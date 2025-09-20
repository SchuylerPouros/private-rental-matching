'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

export default function UserActivity() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: userListings } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserListings',
    args: address ? [address] : undefined,
  });

  const { data: userRequests } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserRequests',
    args: address ? [address] : undefined,
  });

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4 w-32"></div>
          <div className="h-24 bg-white/20 rounded"></div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4 w-32"></div>
          <div className="h-24 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
        <h3 className="text-xl font-bold text-blue-300 mb-4">📋 My Listings</h3>
        {userListings && userListings.length > 0 ? (
          <div className="space-y-2">
            {userListings.map((id: bigint, index: number) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-3 border border-white/10"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white">Listing #{id.toString()}</span>
                  <span className="text-xs text-blue-300">Active</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">📭</div>
            <p>No listings yet</p>
          </div>
        )}
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
        <h3 className="text-xl font-bold text-purple-300 mb-4">🔍 My Requests</h3>
        {userRequests && userRequests.length > 0 ? (
          <div className="space-y-2">
            {userRequests.map((id: bigint, index: number) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-3 border border-white/10"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white">Request #{id.toString()}</span>
                  <span className="text-xs text-purple-300">Active</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">📭</div>
            <p>No requests yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
