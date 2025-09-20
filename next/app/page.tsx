'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import CreateListing from './components/CreateListing';
import CreateRequest from './components/CreateRequest';
import MatchMaker from './components/MatchMaker';
import Statistics from './components/Statistics';
import UserActivity from './components/UserActivity';

export default function Home() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            🏠 Private Rental Matching
          </h1>
          <p className="text-xl text-blue-200 mb-6">
            Privacy-preserving property matching using FHE encryption
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </header>

        {/* Privacy Notice */}
        <div className="mb-8 bg-blue-900/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🔒</div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Privacy Protection
              </h3>
              <p className="text-blue-200">
                All sensitive information (prices, locations, preferences) is encrypted using
                Fully Homomorphic Encryption (FHE). Only you can see your encrypted data.
                Matching happens without revealing private details to unauthorized parties.
              </p>
            </div>
          </div>
        </div>

        {isConnected ? (
          <>
            {/* Statistics */}
            <Statistics />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <CreateListing />
              <CreateRequest />
            </div>

            {/* Match Maker */}
            <MatchMaker />

            {/* User Activity */}
            <UserActivity />
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">👋</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to Private Rental Matching
            </h2>
            <p className="text-xl text-blue-200 mb-8">
              Connect your wallet to start using the platform
            </p>
            <div className="inline-block">
              <ConnectButton />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-blue-300 pb-8">
          <p>
            Powered by{' '}
            <a
              href="https://www.zama.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Zama's fhEVM
            </a>
          </p>
          <p className="mt-2 text-sm text-blue-400">
            Built with ❤️ for privacy-preserving web3
          </p>
        </footer>
      </div>
    </main>
  );
}
