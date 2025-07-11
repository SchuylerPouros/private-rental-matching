'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

export default function CreateRequest() {
  const [budget, setBudget] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [propertyType, setPropertyType] = useState('1');

  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createRequest',
        args: [
          parseInt(budget),
          parseInt(bedrooms),
          parseInt(postalCode),
          parseInt(propertyType),
        ],
      });
    } catch (err) {
      console.error('Error creating request:', err);
    }
  };

  if (isSuccess) {
    setTimeout(() => {
      setBudget('');
      setBedrooms('');
      setPostalCode('');
      setPropertyType('1');
    }, 2000);
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 animate-slide-up">
      <h3 className="text-2xl font-bold text-purple-300 mb-4">🔍 Create Rental Request</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-1">
            Max Budget (USD/month)
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
            min="1"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="2000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-1">
            Minimum Bedrooms
          </label>
          <input
            type="number"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            required
            min="1"
            max="10"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-1">
            Preferred Postal Code
          </label>
          <input
            type="number"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="10001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-1">
            Preferred Type
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="1">Apartment</option>
            <option value="2">House</option>
            <option value="3">Studio</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              {isPending ? 'Sending...' : 'Confirming...'}
            </span>
          ) : (
            '🔒 Create Encrypted Request'
          )}
        </button>

        {isSuccess && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-300 text-sm">
            ✅ Request created successfully!
          </div>
        )}

        {isError && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
            ❌ Error: {error?.message?.substring(0, 100)}
          </div>
        )}
      </form>
    </div>
  );
}
