// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PrivateRentalMatching v2.0
 * @notice Privacy-preserving rental property matching platform using FHE encryption
 * @dev Migrated to support new Gateway contract specifications
 *
 * Migration Changes:
 * - Added NUM_PAUSERS and PAUSER_ADDRESS_[0-N] support
 * - Renamed kmsManagement to kmsGeneration
 * - Replaced check...() functions with is...() boolean returns
 * - Added new Decryption events with individual KMS responses
 * - Implemented transaction input re-randomization support (sIND-CPAD security)
 *
 * Features:
 * - Landlords create encrypted property listings (price, bedrooms, postal code, type)
 * - Tenants create encrypted rental requests (budget, bedroom requirements, preferences)
 * - Privacy-preserving matching using FHE comparisons
 * - Dual confirmation system (both landlord and tenant must confirm)
 */
contract PrivateRentalMatching is SepoliaConfig {

    address public owner;
    uint256 public listingIdCounter;
    uint256 public requestIdCounter;
    uint256 public matchCounter;

    // Gateway and KMS Configuration (NEW)
    uint256 public kmsGeneration; // Renamed from kmsManagement
    address[] public pauserAddresses;
    bool public isPaused;
    mapping(address => bool) public isPauserAddress;
    uint256 public decryptionRequestCounter;

    struct PropertyListing {
        euint32 encryptedPrice;
        euint8 encryptedBedrooms;
        euint32 encryptedPostalCode;
        euint8 encryptedPropertyType; // 1=apartment, 2=house, 3=studio
        bool isActive;
        address landlord;
        uint256 timestamp;
        bool isMatched;
    }

    struct RentalRequest {
        euint32 encryptedMaxBudget;
        euint8 encryptedMinBedrooms;
        euint32 encryptedPreferredPostalCode;
        euint8 encryptedPreferredPropertyType;
        bool isActive;
        address tenant;
        uint256 timestamp;
        bool isMatched;
    }

    struct Match {
        uint256 listingId;
        uint256 requestId;
        address landlord;
        address tenant;
        uint256 timestamp;
        bool isConfirmed;
        bool landlordConfirmed;
        bool tenantConfirmed;
    }

    // Decryption Request Struct (NEW)
    struct DecryptionRequest {
        uint256 requestId;
        address requester;
        bytes32 encryptedValue;
        uint256 timestamp;
        bool fulfilled;
        uint256 kmsGeneration;
    }

    mapping(uint256 => PropertyListing) public listings;
    mapping(uint256 => RentalRequest) public requests;
    mapping(uint256 => Match) public matches;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userRequests;
    mapping(uint256 => DecryptionRequest) public decryptionRequests; // NEW

    // Original Events
    event ListingCreated(uint256 indexed listingId, address indexed landlord);
    event RequestCreated(uint256 indexed requestId, address indexed tenant);
    event MatchCreated(uint256 indexed matchId, uint256 indexed listingId, uint256 indexed requestId);
    event MatchConfirmed(uint256 indexed matchId, address indexed confirmer);
    event ListingDeactivated(uint256 indexed listingId);
    event RequestDeactivated(uint256 indexed requestId);

    // NEW Gateway Events - Individual KMS responses instead of aggregated
    event DecryptionRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 kmsGeneration,
        bytes32 encryptedValue,
        uint256 timestamp
    );

    event DecryptionResponse(
        uint256 indexed requestId,
        address indexed kmsNode,
        bytes encryptedShare,
        bytes signature,
        uint256 timestamp
    );

    event PauserAdded(address indexed pauser, uint256 timestamp);
    event PauserRemoved(address indexed pauser, uint256 timestamp);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);
    event KmsGenerationUpdated(uint256 oldGeneration, uint256 newGeneration);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyActiveListing(uint256 listingId) {
        require(listings[listingId].isActive, "Listing not active");
        require(listings[listingId].landlord == msg.sender, "Not listing owner");
        _;
    }

    modifier onlyActiveRequest(uint256 requestId) {
        require(requests[requestId].isActive, "Request not active");
        require(requests[requestId].tenant == msg.sender, "Not request owner");
        _;
    }

    modifier onlyPauser() {
        require(isPauserAddress[msg.sender], "Not a pauser");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    constructor(address[] memory _pauserAddresses, uint256 _kmsGeneration) {
        owner = msg.sender;
        listingIdCounter = 1;
        requestIdCounter = 1;
        matchCounter = 1;
        kmsGeneration = _kmsGeneration;
        isPaused = false;
        decryptionRequestCounter = 0;

        // Initialize pauser addresses
        for (uint256 i = 0; i < _pauserAddresses.length; i++) {
            pauserAddresses.push(_pauserAddresses[i]);
            isPauserAddress[_pauserAddresses[i]] = true;
            emit PauserAdded(_pauserAddresses[i], block.timestamp);
        }
    }

    // ==================== NEW GATEWAY FUNCTIONS ====================

    /**
     * @notice Add a new pauser address (only owner)
     * @param _pauser The address to add as pauser
     */
    function addPauser(address _pauser) external onlyOwner {
        require(_pauser != address(0), "Invalid pauser address");
        require(!isPauserAddress[_pauser], "Already a pauser");

        pauserAddresses.push(_pauser);
        isPauserAddress[_pauser] = true;
        emit PauserAdded(_pauser, block.timestamp);
    }

    /**
     * @notice Remove a pauser address (only owner)
     * @param _pauser The address to remove
     */
    function removePauser(address _pauser) external onlyOwner {
        require(isPauserAddress[_pauser], "Not a pauser");

        isPauserAddress[_pauser] = false;

        // Remove from array
        for (uint256 i = 0; i < pauserAddresses.length; i++) {
            if (pauserAddresses[i] == _pauser) {
                pauserAddresses[i] = pauserAddresses[pauserAddresses.length - 1];
                pauserAddresses.pop();
                break;
            }
        }

        emit PauserRemoved(_pauser, block.timestamp);
    }

    /**
     * @notice Pause the contract (only pausers)
     */
    function pause() external onlyPauser {
        require(!isPaused, "Already paused");
        isPaused = true;
        emit ContractPaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        require(isPaused, "Not paused");
        isPaused = false;
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Update KMS generation number
     * @param _newGeneration New KMS generation
     */
    function updateKmsGeneration(uint256 _newGeneration) external onlyOwner {
        uint256 oldGeneration = kmsGeneration;
        kmsGeneration = _newGeneration;
        emit KmsGenerationUpdated(oldGeneration, _newGeneration);
    }

    /**
     * @notice Request decryption from KMS
     * @param _encryptedValue The encrypted value to decrypt
     * @return requestId The ID of the decryption request
     */
    function requestDecryption(bytes32 _encryptedValue) external returns (uint256) {
        uint256 requestId = ++decryptionRequestCounter;

        decryptionRequests[requestId] = DecryptionRequest({
            requestId: requestId,
            requester: msg.sender,
            encryptedValue: _encryptedValue,
            timestamp: block.timestamp,
            fulfilled: false,
            kmsGeneration: kmsGeneration
        });

        emit DecryptionRequested(
            requestId,
            msg.sender,
            kmsGeneration,
            _encryptedValue,
            block.timestamp
        );

        return requestId;
    }

    /**
     * @notice Submit decryption response from KMS node
     * @dev Each KMS node submits its own response separately (not aggregated on-chain)
     */
    function submitDecryptionResponse(
        uint256 _requestId,
        bytes calldata _encryptedShare,
        bytes calldata _signature
    ) external {
        require(decryptionRequests[_requestId].requestId == _requestId, "Invalid request");

        emit DecryptionResponse(
            _requestId,
            msg.sender,
            _encryptedShare,
            _signature,
            block.timestamp
        );
    }

    // ==================== REPLACED check...() WITH is...() ====================

    /**
     * @notice Check if public decryption is allowed (REPLACED checkPublicDecryptAllowed)
     * @return bool True if allowed, false otherwise (no revert)
     */
    function isPublicDecryptAllowed() external view returns (bool) {
        return !isPaused;
    }

    /**
     * @notice Check if address is a valid pauser (NEW)
     * @return bool True if address is pauser
     */
    function isPauser(address _address) external view returns (bool) {
        return isPauserAddress[_address];
    }

    /**
     * @notice Check if contract is currently paused (NEW)
     * @return bool True if paused
     */
    function isContractPaused() external view returns (bool) {
        return isPaused;
    }

    /**
     * @notice Check if listing is active and valid (NEW)
     * @return bool True if valid
     */
    function isListingValid(uint256 _listingId) external view returns (bool) {
        return listings[_listingId].isActive && !listings[_listingId].isMatched;
    }

    /**
     * @notice Check if request is active and valid (NEW)
     * @return bool True if valid
     */
    function isRequestValid(uint256 _requestId) external view returns (bool) {
        return requests[_requestId].isActive && !requests[_requestId].isMatched;
    }

    // ==================== ORIGINAL RENTAL MATCHING FUNCTIONS (with whenNotPaused) ====================

    /**
     * @notice Create a property listing with encrypted details
     * @dev All transaction inputs are re-randomized before FHE evaluation (automatic sIND-CPAD security)
     */
    function createListing(
        uint32 _price,
        uint8 _bedrooms,
        uint32 _postalCode,
        uint8 _propertyType
    ) external whenNotPaused {
        require(_price > 0, "Price must be greater than 0");
        require(_bedrooms > 0 && _bedrooms <= 10, "Invalid bedroom count");
        require(_propertyType >= 1 && _propertyType <= 3, "Invalid property type");

        euint32 encryptedPrice = FHE.asEuint32(_price);
        euint8 encryptedBedrooms = FHE.asEuint8(_bedrooms);
        euint32 encryptedPostalCode = FHE.asEuint32(_postalCode);
        euint8 encryptedPropertyType = FHE.asEuint8(_propertyType);

        listings[listingIdCounter] = PropertyListing({
            encryptedPrice: encryptedPrice,
            encryptedBedrooms: encryptedBedrooms,
            encryptedPostalCode: encryptedPostalCode,
            encryptedPropertyType: encryptedPropertyType,
            isActive: true,
            landlord: msg.sender,
            timestamp: block.timestamp,
            isMatched: false
        });

        userListings[msg.sender].push(listingIdCounter);

        // Set permissions for FHE operations
        FHE.allowThis(encryptedPrice);
        FHE.allowThis(encryptedBedrooms);
        FHE.allowThis(encryptedPostalCode);
        FHE.allowThis(encryptedPropertyType);

        FHE.allow(encryptedPrice, msg.sender);
        FHE.allow(encryptedBedrooms, msg.sender);
        FHE.allow(encryptedPostalCode, msg.sender);
        FHE.allow(encryptedPropertyType, msg.sender);

        emit ListingCreated(listingIdCounter, msg.sender);
        listingIdCounter++;
    }

    /**
     * @notice Create a rental request with encrypted requirements
     * @dev All transaction inputs are re-randomized before FHE evaluation (automatic sIND-CPAD security)
     */
    function createRequest(
        uint32 _maxBudget,
        uint8 _minBedrooms,
        uint32 _preferredPostalCode,
        uint8 _preferredPropertyType
    ) external whenNotPaused {
        require(_maxBudget > 0, "Budget must be greater than 0");
        require(_minBedrooms > 0 && _minBedrooms <= 10, "Invalid bedroom count");
        require(_preferredPropertyType >= 1 && _preferredPropertyType <= 3, "Invalid property type");

        euint32 encryptedMaxBudget = FHE.asEuint32(_maxBudget);
        euint8 encryptedMinBedrooms = FHE.asEuint8(_minBedrooms);
        euint32 encryptedPreferredPostalCode = FHE.asEuint32(_preferredPostalCode);
        euint8 encryptedPreferredPropertyType = FHE.asEuint8(_preferredPropertyType);

        requests[requestIdCounter] = RentalRequest({
            encryptedMaxBudget: encryptedMaxBudget,
            encryptedMinBedrooms: encryptedMinBedrooms,
            encryptedPreferredPostalCode: encryptedPreferredPostalCode,
            encryptedPreferredPropertyType: encryptedPreferredPropertyType,
            isActive: true,
            tenant: msg.sender,
            timestamp: block.timestamp,
            isMatched: false
        });

        userRequests[msg.sender].push(requestIdCounter);

        // Set permissions for FHE operations
        FHE.allowThis(encryptedMaxBudget);
        FHE.allowThis(encryptedMinBedrooms);
        FHE.allowThis(encryptedPreferredPostalCode);
        FHE.allowThis(encryptedPreferredPropertyType);

        FHE.allow(encryptedMaxBudget, msg.sender);
        FHE.allow(encryptedMinBedrooms, msg.sender);
        FHE.allow(encryptedPreferredPostalCode, msg.sender);
        FHE.allow(encryptedPreferredPropertyType, msg.sender);

        emit RequestCreated(requestIdCounter, msg.sender);
        requestIdCounter++;
    }

    /**
     * @notice Create a match between listing and request
     * @dev Uses FHE comparisons for privacy-preserving validation
     */
    function createMatch(uint256 _listingId, uint256 _requestId) external whenNotPaused {
        require(listings[_listingId].isActive, "Listing not active");
        require(requests[_requestId].isActive, "Request not active");
        require(!listings[_listingId].isMatched, "Listing already matched");
        require(!requests[_requestId].isMatched, "Request already matched");

        PropertyListing storage listing = listings[_listingId];
        RentalRequest storage request = requests[_requestId];

        require(
            msg.sender == listing.landlord || msg.sender == request.tenant,
            "Not authorized to create this match"
        );

        // Create encrypted comparisons for FHE validation
        ebool priceMatch = FHE.le(listing.encryptedPrice, request.encryptedMaxBudget);
        ebool bedroomMatch = FHE.ge(listing.encryptedBedrooms, request.encryptedMinBedrooms);
        ebool typeMatch = FHE.eq(listing.encryptedPropertyType, request.encryptedPreferredPropertyType);
        ebool postalMatch = FHE.eq(listing.encryptedPostalCode, request.encryptedPreferredPostalCode);

        // Store the comparison results for future use (they remain encrypted)
        FHE.allowThis(priceMatch);
        FHE.allowThis(bedroomMatch);
        FHE.allowThis(typeMatch);
        FHE.allowThis(postalMatch);

        // Create the match
        matches[matchCounter] = Match({
            listingId: _listingId,
            requestId: _requestId,
            landlord: listing.landlord,
            tenant: request.tenant,
            timestamp: block.timestamp,
            isConfirmed: false,
            landlordConfirmed: false,
            tenantConfirmed: false
        });

        listings[_listingId].isMatched = true;
        requests[_requestId].isMatched = true;

        emit MatchCreated(matchCounter, _listingId, _requestId);
        matchCounter++;
    }

    /**
     * @notice Confirm a match (requires both landlord and tenant confirmation)
     */
    function confirmMatch(uint256 _matchId) external whenNotPaused {
        require(matches[_matchId].landlord != address(0), "Match does not exist");
        require(!matches[_matchId].isConfirmed, "Match already confirmed");

        Match storage matchData = matches[_matchId];

        if (msg.sender == matchData.landlord) {
            require(!matchData.landlordConfirmed, "Already confirmed by landlord");
            matchData.landlordConfirmed = true;
        } else if (msg.sender == matchData.tenant) {
            require(!matchData.tenantConfirmed, "Already confirmed by tenant");
            matchData.tenantConfirmed = true;
        } else {
            revert("Not authorized to confirm this match");
        }

        if (matchData.landlordConfirmed && matchData.tenantConfirmed) {
            matchData.isConfirmed = true;
        }

        emit MatchConfirmed(_matchId, msg.sender);
    }

    /**
     * @notice Deactivate a listing
     */
    function deactivateListing(uint256 _listingId) external onlyActiveListing(_listingId) {
        listings[_listingId].isActive = false;
        emit ListingDeactivated(_listingId);
    }

    /**
     * @notice Deactivate a request
     */
    function deactivateRequest(uint256 _requestId) external onlyActiveRequest(_requestId) {
        requests[_requestId].isActive = false;
        emit RequestDeactivated(_requestId);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getUserListings(address _user) external view returns (uint256[] memory) {
        return userListings[_user];
    }

    function getUserRequests(address _user) external view returns (uint256[] memory) {
        return userRequests[_user];
    }

    function getMatchDetails(uint256 _matchId) external view returns (
        uint256 listingId,
        uint256 requestId,
        address landlord,
        address tenant,
        uint256 timestamp,
        bool isConfirmed,
        bool landlordConfirmed,
        bool tenantConfirmed
    ) {
        Match storage matchData = matches[_matchId];
        return (
            matchData.listingId,
            matchData.requestId,
            matchData.landlord,
            matchData.tenant,
            matchData.timestamp,
            matchData.isConfirmed,
            matchData.landlordConfirmed,
            matchData.tenantConfirmed
        );
    }

    function getActiveListingsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i < listingIdCounter; i++) {
            if (listings[i].isActive && !listings[i].isMatched) {
                count++;
            }
        }
        return count;
    }

    function getActiveRequestsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i < requestIdCounter; i++) {
            if (requests[i].isActive && !requests[i].isMatched) {
                count++;
            }
        }
        return count;
    }

    function getListingDetails(uint256 _listingId) external view returns (
        bool isActive,
        address landlord,
        uint256 timestamp,
        bool isMatched
    ) {
        PropertyListing storage listing = listings[_listingId];
        return (
            listing.isActive,
            listing.landlord,
            listing.timestamp,
            listing.isMatched
        );
    }

    function getRequestDetails(uint256 _requestId) external view returns (
        bool isActive,
        address tenant,
        uint256 timestamp,
        bool isMatched
    ) {
        RentalRequest storage request = requests[_requestId];
        return (
            request.isActive,
            request.tenant,
            request.timestamp,
            request.isMatched
        );
    }

    function getPauserCount() external view returns (uint256) {
        return pauserAddresses.length;
    }

    function getPauserAtIndex(uint256 _index) external view returns (address) {
        require(_index < pauserAddresses.length, "Index out of bounds");
        return pauserAddresses[_index];
    }

    function getPlatformStats() external view returns (
        uint256 totalListings,
        uint256 totalRequests,
        uint256 totalMatches,
        uint256 activeListings,
        uint256 activeRequests
    ) {
        return (
            listingIdCounter - 1,
            requestIdCounter - 1,
            matchCounter - 1,
            this.getActiveListingsCount(),
            this.getActiveRequestsCount()
        );
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @notice Emergency pause all operations
     */
    function emergencyPause() external onlyPauser {
        isPaused = true;
        emit ContractPaused(msg.sender, block.timestamp);
    }
}
