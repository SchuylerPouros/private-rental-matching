'use client';

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

export default function Statistics() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: stats, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlatformStats',
  });

  if (!mounted) {
    return (
      <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-white/20 rounded mb-4 w-48"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white/20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-white/20 rounded mb-4 w-48"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white/20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const [totalListings, totalRequests, totalMatches, activeListings, activeRequests] = stats || [0n, 0n, 0n, 0n, 0n];

  return (
    <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-white mb-4">📊 Platform Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Listings"
          value={totalListings.toString()}
          icon="🏘️"
          color="blue"
        />
        <StatCard
          label="Total Requests"
          value={totalRequests.toString()}
          icon="🔍"
          color="purple"
        />
        <StatCard
          label="Total Matches"
          value={totalMatches.toString()}
          icon="🤝"
          color="green"
        />
        <StatCard
          label="Active Listings"
          value={activeListings.toString()}
          icon="✨"
          color="yellow"
        />
        <StatCard
          label="Active Requests"
          value={activeRequests.toString()}
          icon="📝"
          color="pink"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4 text-center transition-all hover:scale-105`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}
