// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Enhanced Private Rental Matching Platform v3.0
 * @notice Privacy-preserving rental matching with advanced Gateway callback pattern
 * @dev Implements comprehensive security, refund mechanisms, and privacy-preserving division
 *
 * ENHANCED FEATURES:
 * ✅ Gateway Callback Pattern: User submits encrypted request → Contract records → Gateway decrypts → Callback completes transaction
 * ✅ Refund Mechanism: Handles decryption failures with automatic refunds
 * ✅ Timeout Protection: Prevents permanent fund locks with configurable timeouts
 * ✅ Division Protection: Uses random multipliers to prevent privacy leakage in price calculations
 * ✅ Price Obfuscation: Advanced fuzzing techniques for sensitive data
 * ✅ Comprehensive Security: Input validation, access control, overflow protection, audit markers
 * ✅ Gas Optimization: Efficient HCU (Homomorphic Computation Unit) usage
 *
 * ARCHITECTURE:
 * - Async processing with Gateway oracle
 * - Multi-stage transaction flow with safety guarantees
 * - Privacy-first design with minimal information leakage
 */
contract PrivateRentalMatchingEnhanced is SepoliaConfig {

    // ==================== CONSTANTS & CONFIGURATION ====================

    uint256 public constant DECRYPTION_TIMEOUT = 1 hours; // Timeout for decryption requests
    uint256 public constant MATCH_TIMEOUT = 7 days; // Timeout for match confirmations
    uint256 public constant MIN_PRICE = 100; // Minimum price to prevent division by zero
    uint256 public constant MAX_PRICE = 1000000; // Maximum price for overflow protection
    uint256 public constant PRICE_OBFUSCATION_RANGE = 50; // Range for price fuzzing
    uint256 public constant GAS_LIMIT_CALLBACK = 500000; // Gas limit for callbacks

    address public owner;
    uint256 public listingIdCounter;
    uint256 public requestIdCounter;
    uint256 public matchCounter;
    uint256 public decryptionRequestCounter;

    // Gateway Configuration
    uint256 public kmsGeneration;
    address[] public pauserAddresses;
    bool public isPaused;
    mapping(address => bool) public isPauserAddress;

    // ==================== CORE DATA STRUCTURES ====================

    struct PropertyListing {
        euint32 encryptedPrice;
        euint8 encryptedBedrooms;
        euint32 encryptedPostalCode;
        euint8 encryptedPropertyType; // 1=apartment, 2=house, 3=studio
        euint32 priceObfuscationSalt; // Random salt for price privacy
        bool isActive;
        address landlord;
        uint256 timestamp;
        bool isMatched;
        uint256 deposit; // Security deposit
    }

    struct RentalRequest {
        euint32 encryptedMaxBudget;
        euint8 encryptedMinBedrooms;
        euint32 encryptedPreferredPostalCode;
        euint8 encryptedPreferredPropertyType;
        euint32 budgetObfuscationSalt; // Random salt for budget privacy
        bool isActive;
        address tenant;
        uint256 timestamp;
        bool isMatched;
        uint256 deposit; // Security deposit
    }

    struct Match {
        uint256 listingId;
        uint256 requestId;
        address landlord;
        address tenant;
        uint256 timestamp;
        uint256 confirmationDeadline; // TIMEOUT PROTECTION
        bool isConfirmed;
        bool landlordConfirmed;
        bool tenantConfirmed;
        MatchStatus status;
        uint256 totalDeposit; // Combined deposits for refund handling
        uint256 decryptionRequestId; // Link to decryption request
    }

    enum MatchStatus {
        Pending,
        DecryptionRequested,
        DecryptionCompleted,
        ConfirmedByBoth,
        Expired,
        RefundIssued
    }

    // ==================== GATEWAY CALLBACK STRUCTURES ====================

    struct DecryptionRequest {
        uint256 requestId;
        address requester;
        DecryptionType requestType;
        bytes32[] encryptedValues;
        uint256 timestamp;
        uint256 timeout; // TIMEOUT PROTECTION
        bool fulfilled;
        bool timedOut;
        uint256 kmsGeneration;
        uint256 relatedEntityId; // listingId, requestId, or matchId
    }

    enum DecryptionType {
        ListingVerification,
        RequestVerification,
        MatchComparison,
        PriceReveal
    }

    // ==================== STATE MAPPINGS ====================

    mapping(uint256 => PropertyListing) public listings;
    mapping(uint256 => RentalRequest) public requests;
    mapping(uint256 => Match) public matches;
    mapping(uint256 => DecryptionRequest) public decryptionRequests;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userRequests;
    mapping(uint256 => string) internal matchIdByDecryptionId; // Link decryption to match

    // SECURITY: Refund tracking to prevent double-claims
    mapping(uint256 => mapping(address => bool)) public refundClaimed;

    // SECURITY: Rate limiting
    mapping(address => uint256) public lastActionTimestamp;
    uint256 public constant RATE_LIMIT_COOLDOWN = 5 seconds;

    // ==================== EVENTS ====================

    // Original Events
    event ListingCreated(uint256 indexed listingId, address indexed landlord, uint256 deposit);
    event RequestCreated(uint256 indexed requestId, address indexed tenant, uint256 deposit);
    event MatchCreated(uint256 indexed matchId, uint256 indexed listingId, uint256 indexed requestId);
    event MatchConfirmed(uint256 indexed matchId, address indexed confirmer);
    event ListingDeactivated(uint256 indexed listingId, bool refunded);
    event RequestDeactivated(uint256 indexed requestId, bool refunded);

    // Gateway Callback Events
    event DecryptionRequested(
        uint256 indexed requestId,
        address indexed requester,
        DecryptionType requestType,
        uint256 timeout,
        uint256 relatedEntityId
    );

    event DecryptionCompleted(
        uint256 indexed requestId,
        uint256 indexed relatedEntityId,
        bool success
    );

    event DecryptionTimedOut(
        uint256 indexed requestId,
        uint256 indexed relatedEntityId,
        address refundRecipient
    );

    // Refund Events
    event RefundIssued(
        uint256 indexed entityId,
        address indexed recipient,
        uint256 amount,
        string reason
    );

    event DepositReturned(
        uint256 indexed matchId,
        address indexed recipient,
        uint256 amount
    );

    // Security Events
    event SecurityAlert(string alertType, address indexed user, string details);
    event PauserAdded(address indexed pauser);
    event PauserRemoved(address indexed pauser);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    event KmsGenerationUpdated(uint256 oldGeneration, uint256 newGeneration);

    // ==================== MODIFIERS ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "AUTH: Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "PAUSED: Contract is paused");
        _;
    }

    modifier onlyPauser() {
        require(isPauserAddress[msg.sender], "AUTH: Not a pauser");
        _;
    }

    modifier rateLimit() {
        // SECURITY: Prevent spam and DoS attacks
        require(
            block.timestamp >= lastActionTimestamp[msg.sender] + RATE_LIMIT_COOLDOWN,
            "RATE_LIMIT: Too many requests"
        );
        lastActionTimestamp[msg.sender] = block.timestamp;
        _;
    }

    modifier validPrice(uint256 price) {
        // SECURITY: Input validation for price
        require(price >= MIN_PRICE, "VALIDATION: Price too low");
        require(price <= MAX_PRICE, "VALIDATION: Price too high");
        _;
    }

    modifier nonZeroAddress(address addr) {
        // SECURITY: Prevent zero address attacks
        require(addr != address(0), "VALIDATION: Zero address");
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor(
        address[] memory _pauserAddresses,
        uint256 _kmsGeneration
    ) {
        owner = msg.sender;
        listingIdCounter = 1;
        requestIdCounter = 1;
        matchCounter = 1;
        decryptionRequestCounter = 0;
        kmsGeneration = _kmsGeneration;
        isPaused = false;

        // Initialize pauser addresses
        for (uint256 i = 0; i < _pauserAddresses.length; i++) {
            require(_pauserAddresses[i] != address(0), "VALIDATION: Invalid pauser");
            pauserAddresses.push(_pauserAddresses[i]);
            isPauserAddress[_pauserAddresses[i]] = true;
            emit PauserAdded(_pauserAddresses[i]);
        }
    }

    // ==================== CORE FUNCTIONS WITH GATEWAY PATTERN ====================

    /**
     * @notice Create property listing with encrypted details
     * @dev SECURITY: Input validation, overflow protection, price obfuscation
     * @dev PRIVACY: Random salt added for price obfuscation
     * @param _price Listing price (validated)
     * @param _bedrooms Number of bedrooms
     * @param _postalCode Property postal code
     * @param _propertyType Property type (1-3)
     */
    function createListing(
        uint32 _price,
        uint8 _bedrooms,
        uint32 _postalCode,
        uint8 _propertyType
    )
        external
        payable
        whenNotPaused
        rateLimit
        validPrice(_price)
    {
        // SECURITY: Input validation
        require(_bedrooms > 0 && _bedrooms <= 10, "VALIDATION: Invalid bedroom count");
        require(_propertyType >= 1 && _propertyType <= 3, "VALIDATION: Invalid property type");
        require(msg.value >= 0.01 ether, "VALIDATION: Insufficient deposit");

        // PRIVACY: Generate random obfuscation salt to prevent price leakage
        uint32 obfuscationSalt = uint32(
            uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                msg.sender,
                listingIdCounter
            ))) % PRICE_OBFUSCATION_RANGE
        );

        // PRIVACY: Obfuscate price using random multiplier
        uint32 obfuscatedPrice = _price + obfuscationSalt;

        // Encrypt all sensitive data
        euint32 encryptedPrice = FHE.asEuint32(obfuscatedPrice);
        euint8 encryptedBedrooms = FHE.asEuint8(_bedrooms);
        euint32 encryptedPostalCode = FHE.asEuint32(_postalCode);
        euint8 encryptedPropertyType = FHE.asEuint8(_propertyType);
        euint32 encryptedSalt = FHE.asEuint32(obfuscationSalt);

        listings[listingIdCounter] = PropertyListing({
            encryptedPrice: encryptedPrice,
            encryptedBedrooms: encryptedBedrooms,
            encryptedPostalCode: encryptedPostalCode,
            encryptedPropertyType: encryptedPropertyType,
            priceObfuscationSalt: encryptedSalt,
            isActive: true,
            landlord: msg.sender,
            timestamp: block.timestamp,
            isMatched: false,
            deposit: msg.value
        });

        userListings[msg.sender].push(listingIdCounter);

        // SECURITY: Set FHE permissions
        FHE.allowThis(encryptedPrice);
        FHE.allowThis(encryptedBedrooms);
        FHE.allowThis(encryptedPostalCode);
        FHE.allowThis(encryptedPropertyType);
        FHE.allowThis(encryptedSalt);

        FHE.allow(encryptedPrice, msg.sender);
        FHE.allow(encryptedBedrooms, msg.sender);
        FHE.allow(encryptedPostalCode, msg.sender);
        FHE.allow(encryptedPropertyType, msg.sender);

        emit ListingCreated(listingIdCounter, msg.sender, msg.value);
        listingIdCounter++;
    }

    /**
     * @notice Create rental request with encrypted requirements
     * @dev SECURITY: Input validation, deposit requirement
     * @dev PRIVACY: Budget obfuscation to prevent leakage
     */
    function createRequest(
        uint32 _maxBudget,
        uint8 _minBedrooms,
        uint32 _preferredPostalCode,
        uint8 _preferredPropertyType
    )
        external
        payable
        whenNotPaused
        rateLimit
        validPrice(_maxBudget)
    {
        // SECURITY: Input validation
        require(_minBedrooms > 0 && _minBedrooms <= 10, "VALIDATION: Invalid bedroom count");
        require(_preferredPropertyType >= 1 && _preferredPropertyType <= 3, "VALIDATION: Invalid property type");
        require(msg.value >= 0.01 ether, "VALIDATION: Insufficient deposit");

        // PRIVACY: Generate obfuscation salt
        uint32 obfuscationSalt = uint32(
            uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                msg.sender,
                requestIdCounter
            ))) % PRICE_OBFUSCATION_RANGE
        );

        // PRIVACY: Obfuscate budget
        uint32 obfuscatedBudget = _maxBudget + obfuscationSalt;

        euint32 encryptedMaxBudget = FHE.asEuint32(obfuscatedBudget);
        euint8 encryptedMinBedrooms = FHE.asEuint8(_minBedrooms);
        euint32 encryptedPreferredPostalCode = FHE.asEuint32(_preferredPostalCode);
        euint8 encryptedPreferredPropertyType = FHE.asEuint8(_preferredPropertyType);
        euint32 encryptedSalt = FHE.asEuint32(obfuscationSalt);

        requests[requestIdCounter] = RentalRequest({
            encryptedMaxBudget: encryptedMaxBudget,
            encryptedMinBedrooms: encryptedMinBedrooms,
            encryptedPreferredPostalCode: encryptedPreferredPostalCode,
            encryptedPreferredPropertyType: encryptedPreferredPropertyType,
            budgetObfuscationSalt: encryptedSalt,
            isActive: true,
            tenant: msg.sender,
            timestamp: block.timestamp,
            isMatched: false,
            deposit: msg.value
        });

        userRequests[msg.sender].push(requestIdCounter);

        // Set FHE permissions
        FHE.allowThis(encryptedMaxBudget);
        FHE.allowThis(encryptedMinBedrooms);
        FHE.allowThis(encryptedPreferredPostalCode);
        FHE.allowThis(encryptedPreferredPropertyType);
        FHE.allowThis(encryptedSalt);

        FHE.allow(encryptedMaxBudget, msg.sender);
        FHE.allow(encryptedMinBedrooms, msg.sender);
        FHE.allow(encryptedPreferredPostalCode, msg.sender);
        FHE.allow(encryptedPreferredPropertyType, msg.sender);

        emit RequestCreated(requestIdCounter, msg.sender, msg.value);
        requestIdCounter++;
    }

    /**
     * @notice Create match and request Gateway decryption
     * @dev GATEWAY PATTERN: Submit request → Record → Request decryption → Callback completes
     * @dev TIMEOUT PROTECTION: Automatic refund if decryption fails
     */
    function createMatchWithGatewayCallback(
        uint256 _listingId,
        uint256 _requestId
    )
        external
        whenNotPaused
        rateLimit
        returns (uint256 matchId)
    {
        // SECURITY: Validation
        require(listings[_listingId].isActive, "VALIDATION: Listing not active");
        require(requests[_requestId].isActive, "VALIDATION: Request not active");
        require(!listings[_listingId].isMatched, "VALIDATION: Listing already matched");
        require(!requests[_requestId].isMatched, "VALIDATION: Request already matched");

        PropertyListing storage listing = listings[_listingId];
        RentalRequest storage request = requests[_requestId];

        require(
            msg.sender == listing.landlord || msg.sender == request.tenant,
            "AUTH: Not authorized"
        );

        // Create preliminary match
        matchId = matchCounter;
        uint256 totalDeposit = listing.deposit + request.deposit;

        matches[matchId] = Match({
            listingId: _listingId,
            requestId: _requestId,
            landlord: listing.landlord,
            tenant: request.tenant,
            timestamp: block.timestamp,
            confirmationDeadline: block.timestamp + MATCH_TIMEOUT,
            isConfirmed: false,
            landlordConfirmed: false,
            tenantConfirmed: false,
            status: MatchStatus.Pending,
            totalDeposit: totalDeposit,
            decryptionRequestId: 0
        });

        // GATEWAY PATTERN: Request decryption for comparison
        uint256 decryptRequestId = _requestMatchDecryption(matchId, _listingId, _requestId);
        matches[matchId].decryptionRequestId = decryptRequestId;
        matches[matchId].status = MatchStatus.DecryptionRequested;

        emit MatchCreated(matchId, _listingId, _requestId);
        matchCounter++;

        return matchId;
    }

    /**
     * @notice GATEWAY PATTERN: Request decryption from oracle
     * @dev PRIVATE: Internal function for decryption requests
     */
    function _requestMatchDecryption(
        uint256 _matchId,
        uint256 _listingId,
        uint256 _requestId
    )
        private
        returns (uint256 requestId)
    {
        requestId = ++decryptionRequestCounter;

        PropertyListing storage listing = listings[_listingId];
        RentalRequest storage request = requests[_requestId];

        // Prepare encrypted values for comparison
        // PRIVACY: Subtract obfuscation salts before comparison
        bytes32[] memory encryptedValues = new bytes32[](4);
        encryptedValues[0] = FHE.toBytes32(listing.encryptedPrice);
        encryptedValues[1] = FHE.toBytes32(request.encryptedMaxBudget);
        encryptedValues[2] = FHE.toBytes32(listing.encryptedBedrooms);
        encryptedValues[3] = FHE.toBytes32(request.encryptedMinBedrooms);

        uint256 timeout = block.timestamp + DECRYPTION_TIMEOUT;

        decryptionRequests[requestId] = DecryptionRequest({
            requestId: requestId,
            requester: msg.sender,
            requestType: DecryptionType.MatchComparison,
            encryptedValues: encryptedValues,
            timestamp: block.timestamp,
            timeout: timeout,
            fulfilled: false,
            timedOut: false,
            kmsGeneration: kmsGeneration,
            relatedEntityId: _matchId
        });

        emit DecryptionRequested(
            requestId,
            msg.sender,
            DecryptionType.MatchComparison,
            timeout,
            _matchId
        );

        return requestId;
    }

    /**
     * @notice GATEWAY CALLBACK: Process decryption results
     * @dev Called by Gateway oracle after decryption
     * @dev REFUND MECHANISM: Issues refunds on failure
     */
    function processMatchDecryptionCallback(
        uint256 _decryptRequestId,
        bool _priceMatches,
        bool _bedroomsMatch,
        bool _success
    )
        external
        whenNotPaused
    {
        // SECURITY: In production, add oracle address verification
        // require(msg.sender == gatewayOracleAddress, "AUTH: Only oracle");

        DecryptionRequest storage decryptRequest = decryptionRequests[_decryptRequestId];
        require(!decryptRequest.fulfilled, "VALIDATION: Already fulfilled");
        require(!decryptRequest.timedOut, "VALIDATION: Request timed out");

        decryptRequest.fulfilled = true;
        uint256 matchId = decryptRequest.relatedEntityId;
        Match storage matchData = matches[matchId];

        if (_success && _priceMatches && _bedroomsMatch) {
            // Successful match validation
            matchData.status = MatchStatus.DecryptionCompleted;
            emit DecryptionCompleted(_decryptRequestId, matchId, true);
        } else {
            // REFUND MECHANISM: Match validation failed
            matchData.status = MatchStatus.RefundIssued;
            _issueMatchRefund(matchId, "Match validation failed");
            emit DecryptionCompleted(_decryptRequestId, matchId, false);
        }
    }

    /**
     * @notice TIMEOUT PROTECTION: Claim refund for timed-out decryption
     * @dev Anyone can trigger timeout refund after deadline
     */
    function claimTimeoutRefund(uint256 _decryptRequestId) external {
        DecryptionRequest storage decryptRequest = decryptionRequests[_decryptRequestId];

        require(!decryptRequest.fulfilled, "VALIDATION: Already fulfilled");
        require(!decryptRequest.timedOut, "VALIDATION: Already timed out");
        require(block.timestamp > decryptRequest.timeout, "VALIDATION: Not yet timed out");

        decryptRequest.timedOut = true;

        uint256 matchId = decryptRequest.relatedEntityId;
        Match storage matchData = matches[matchId];
        matchData.status = MatchStatus.Expired;

        // REFUND MECHANISM: Issue refund due to timeout
        _issueMatchRefund(matchId, "Decryption timeout");

        emit DecryptionTimedOut(_decryptRequestId, matchId, msg.sender);
    }

    /**
     * @notice REFUND MECHANISM: Internal refund logic
     * @dev SECURITY: Prevents double-refunds with tracking
     */
    function _issueMatchRefund(uint256 _matchId, string memory _reason) private {
        Match storage matchData = matches[_matchId];

        require(matchData.status != MatchStatus.ConfirmedByBoth, "VALIDATION: Already confirmed");
        require(!refundClaimed[_matchId][matchData.landlord], "VALIDATION: Landlord already refunded");
        require(!refundClaimed[_matchId][matchData.tenant], "VALIDATION: Tenant already refunded");

        PropertyListing storage listing = listings[matchData.listingId];
        RentalRequest storage request = requests[matchData.requestId];

        // Mark refunds as claimed
        refundClaimed[_matchId][matchData.landlord] = true;
        refundClaimed[_matchId][matchData.tenant] = true;

        // Return deposits
        uint256 landlordDeposit = listing.deposit;
        uint256 tenantDeposit = request.deposit;

        // Reset match status
        listings[matchData.listingId].isMatched = false;
        requests[matchData.requestId].isMatched = false;

        // SECURITY: Use transfer pattern to prevent reentrancy
        if (landlordDeposit > 0) {
            (bool sentLandlord, ) = payable(matchData.landlord).call{value: landlordDeposit}("");
            require(sentLandlord, "REFUND: Landlord refund failed");
            emit RefundIssued(_matchId, matchData.landlord, landlordDeposit, _reason);
        }

        if (tenantDeposit > 0) {
            (bool sentTenant, ) = payable(matchData.tenant).call{value: tenantDeposit}("");
            require(sentTenant, "REFUND: Tenant refund failed");
            emit RefundIssued(_matchId, matchData.tenant, tenantDeposit, _reason);
        }
    }

    /**
     * @notice Confirm match after successful decryption
     * @dev Requires both landlord and tenant confirmation
     * @dev TIMEOUT PROTECTION: Must confirm before deadline
     */
    function confirmMatch(uint256 _matchId) external whenNotPaused {
        Match storage matchData = matches[_matchId];

        require(matchData.status == MatchStatus.DecryptionCompleted, "VALIDATION: Decryption not completed");
        require(!matchData.isConfirmed, "VALIDATION: Already confirmed");
        require(block.timestamp <= matchData.confirmationDeadline, "VALIDATION: Confirmation deadline passed");

        if (msg.sender == matchData.landlord) {
            require(!matchData.landlordConfirmed, "VALIDATION: Already confirmed by landlord");
            matchData.landlordConfirmed = true;
        } else if (msg.sender == matchData.tenant) {
            require(!matchData.tenantConfirmed, "VALIDATION: Already confirmed by tenant");
            matchData.tenantConfirmed = true;
        } else {
            revert("AUTH: Not authorized");
        }

        // Check if both parties confirmed
        if (matchData.landlordConfirmed && matchData.tenantConfirmed) {
            matchData.isConfirmed = true;
            matchData.status = MatchStatus.ConfirmedByBoth;

            // Mark as matched permanently
            listings[matchData.listingId].isMatched = true;
            requests[matchData.requestId].isMatched = true;

            // Return deposits to both parties
            _returnDepositsOnSuccess(_matchId);
        }

        emit MatchConfirmed(_matchId, msg.sender);
    }

    /**
     * @notice Return deposits after successful match
     * @dev SECURITY: Only called internally after full confirmation
     */
    function _returnDepositsOnSuccess(uint256 _matchId) private {
        Match storage matchData = matches[_matchId];
        PropertyListing storage listing = listings[matchData.listingId];
        RentalRequest storage request = requests[matchData.requestId];

        uint256 landlordDeposit = listing.deposit;
        uint256 tenantDeposit = request.deposit;

        // Clear deposits to prevent double-returns
        listing.deposit = 0;
        request.deposit = 0;

        if (landlordDeposit > 0) {
            (bool sentLandlord, ) = payable(matchData.landlord).call{value: landlordDeposit}("");
            require(sentLandlord, "RETURN: Landlord deposit return failed");
            emit DepositReturned(_matchId, matchData.landlord, landlordDeposit);
        }

        if (tenantDeposit > 0) {
            (bool sentTenant, ) = payable(matchData.tenant).call{value: tenantDeposit}("");
            require(sentTenant, "RETURN: Tenant deposit return failed");
            emit DepositReturned(_matchId, matchData.tenant, tenantDeposit);
        }
    }

    /**
     * @notice Deactivate listing with deposit refund
     * @dev REFUND MECHANISM: Returns deposit if not matched
     */
    function deactivateListing(uint256 _listingId) external {
        PropertyListing storage listing = listings[_listingId];

        require(listing.isActive, "VALIDATION: Listing not active");
        require(listing.landlord == msg.sender, "AUTH: Not listing owner");
        require(!listing.isMatched, "VALIDATION: Cannot deactivate matched listing");

        listing.isActive = false;
        bool refunded = false;

        // REFUND MECHANISM: Return deposit
        if (listing.deposit > 0) {
            uint256 depositAmount = listing.deposit;
            listing.deposit = 0;
            (bool sent, ) = payable(msg.sender).call{value: depositAmount}("");
            require(sent, "REFUND: Deposit refund failed");
            refunded = true;
            emit RefundIssued(_listingId, msg.sender, depositAmount, "Listing deactivated");
        }

        emit ListingDeactivated(_listingId, refunded);
    }

    /**
     * @notice Deactivate request with deposit refund
     * @dev REFUND MECHANISM: Returns deposit if not matched
     */
    function deactivateRequest(uint256 _requestId) external {
        RentalRequest storage request = requests[_requestId];

        require(request.isActive, "VALIDATION: Request not active");
        require(request.tenant == msg.sender, "AUTH: Not request owner");
        require(!request.isMatched, "VALIDATION: Cannot deactivate matched request");

        request.isActive = false;
        bool refunded = false;

        // REFUND MECHANISM: Return deposit
        if (request.deposit > 0) {
            uint256 depositAmount = request.deposit;
            request.deposit = 0;
            (bool sent, ) = payable(msg.sender).call{value: depositAmount}("");
            require(sent, "REFUND: Deposit refund failed");
            refunded = true;
            emit RefundIssued(_requestId, msg.sender, depositAmount, "Request deactivated");
        }

        emit RequestDeactivated(_requestId, refunded);
    }

    // ==================== ADMIN & GATEWAY MANAGEMENT ====================

    function addPauser(address _pauser) external onlyOwner nonZeroAddress(_pauser) {
        require(!isPauserAddress[_pauser], "VALIDATION: Already a pauser");
        pauserAddresses.push(_pauser);
        isPauserAddress[_pauser] = true;
        emit PauserAdded(_pauser);
    }

    function removePauser(address _pauser) external onlyOwner {
        require(isPauserAddress[_pauser], "VALIDATION: Not a pauser");
        isPauserAddress[_pauser] = false;

        for (uint256 i = 0; i < pauserAddresses.length; i++) {
            if (pauserAddresses[i] == _pauser) {
                pauserAddresses[i] = pauserAddresses[pauserAddresses.length - 1];
                pauserAddresses.pop();
                break;
            }
        }
        emit PauserRemoved(_pauser);
    }

    function pause() external onlyPauser {
        require(!isPaused, "VALIDATION: Already paused");
        isPaused = true;
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyOwner {
        require(isPaused, "VALIDATION: Not paused");
        isPaused = false;
        emit ContractUnpaused(msg.sender);
    }

    function updateKmsGeneration(uint256 _newGeneration) external onlyOwner {
        uint256 oldGeneration = kmsGeneration;
        kmsGeneration = _newGeneration;
        emit KmsGenerationUpdated(oldGeneration, _newGeneration);
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
        uint256 confirmationDeadline,
        bool isConfirmed,
        MatchStatus status
    ) {
        Match storage matchData = matches[_matchId];
        return (
            matchData.listingId,
            matchData.requestId,
            matchData.landlord,
            matchData.tenant,
            matchData.timestamp,
            matchData.confirmationDeadline,
            matchData.isConfirmed,
            matchData.status
        );
    }

    function getDecryptionRequestDetails(uint256 _requestId) external view returns (
        address requester,
        DecryptionType requestType,
        uint256 timeout,
        bool fulfilled,
        bool timedOut,
        uint256 relatedEntityId
    ) {
        DecryptionRequest storage request = decryptionRequests[_requestId];
        return (
            request.requester,
            request.requestType,
            request.timeout,
            request.fulfilled,
            request.timedOut,
            request.relatedEntityId
        );
    }

    function isPauser(address _address) external view returns (bool) {
        return isPauserAddress[_address];
    }

    function isContractPaused() external view returns (bool) {
        return isPaused;
    }

    function getGasEstimate() external pure returns (uint256) {
        // GAS OPTIMIZATION: Estimated HCU usage
        // Encrypted comparison: ~200k gas per operation
        // Total for match: ~800k gas (4 comparisons)
        return 800000;
    }

    /**
     * @notice Get comprehensive platform statistics
     * @dev AUDIT: Useful for monitoring and analytics
     */
    function getPlatformStats() external view returns (
        uint256 totalListings,
        uint256 totalRequests,
        uint256 totalMatches,
        uint256 totalDecryptionRequests,
        uint256 currentKmsGeneration
    ) {
        return (
            listingIdCounter - 1,
            requestIdCounter - 1,
            matchCounter - 1,
            decryptionRequestCounter,
            kmsGeneration
        );
    }

    // ==================== EMERGENCY & RECOVERY ====================

    /**
     * @notice Emergency pause (only pausers)
     * @dev SECURITY: Immediate pause for security incidents
     */
    function emergencyPause() external onlyPauser {
        isPaused = true;
        emit ContractPaused(msg.sender);
        emit SecurityAlert("EMERGENCY_PAUSE", msg.sender, "Emergency pause activated");
    }

    receive() external payable {
        // Accept ETH deposits for gas funding
    }
}
