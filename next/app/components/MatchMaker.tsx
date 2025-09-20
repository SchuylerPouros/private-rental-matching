'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

export default function MatchMaker() {
  const [listingId, setListingId] = useState('');
  const [requestId, setRequestId] = useState('');

  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createMatch',
        args: [BigInt(listingId), BigInt(requestId)],
      });
    } catch (err) {
      console.error('Error creating match:', err);
    }
  };

  if (isSuccess) {
    setTimeout(() => {
      setListingId('');
      setRequestId('');
    }, 2000);
  }

  return (
    <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 animate-slide-up">
      <h3 className="text-2xl font-bold text-green-300 mb-4">🤝 Create Match</h3>
      <form onSubmit={handleMatch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-green-200 mb-1">
            Listing ID
          </label>
          <input
            type="number"
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            required
            min="1"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-200 mb-1">
            Request ID
          </label>
          <input
            type="number"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            required
            min="1"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="1"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-2 rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
          >
            {isPending || isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                {isPending ? 'Matching...' : 'Confirming...'}
              </span>
            ) : (
              'Match Properties'
            )}
          </button>
        </div>
      </form>

      {isSuccess && (
        <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-300 text-sm">
          ✅ Match created successfully! Both parties need to confirm.
        </div>
      )}

      {isError && (
        <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
          ❌ Error: {error?.message?.substring(0, 100)}
        </div>
      )}
    </div>
  );
}
