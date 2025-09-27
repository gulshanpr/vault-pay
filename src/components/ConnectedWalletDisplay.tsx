"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getENSProfile, type ENSResult } from '@/lib/ens';
import { 
  User, 
  Copy, 
  Check, 
  Loader2,
  ExternalLink 
} from 'lucide-react';

export function ConnectedWalletDisplay() {
  const { address, isConnected } = useAccount();
  const [ensData, setEnsData] = useState<ENSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      fetchENSData();
    } else {
      setEnsData(null);
    }
  }, [address, isConnected]);

  const fetchENSData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const profile = await getENSProfile(address);
      setEnsData(profile);
    } catch (error) {
      console.error('Error fetching ENS data:', error);
      // Set fallback data with just the address
      setEnsData({
        ensName: null,
        address: address,
        avatar: null
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) return null;

  if (loading) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm text-blue-700 dark:text-blue-300">
          Loading wallet info...
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      {/* Avatar or Default Icon */}
      <div className="flex-shrink-0">
        {ensData?.avatar ? (
          <img
            src={ensData.avatar}
            alt="ENS Avatar"
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Name/Address Display */}
      <div className="flex-1 min-w-0">
        {ensData?.ensName ? (
          // Has ENS - Show prominently
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {ensData.ensName}
              </span>
              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                ENS
              </span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {formatAddress(ensData.address)}
            </div>
          </div>
        ) : (
          // No ENS - Show address with suggestion
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              Connected Wallet
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {formatAddress(address!)}
              </span>
              <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                No ENS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Copy Button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => copyToClipboard(ensData?.ensName || address!)}
          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
          title={`Copy ${ensData?.ensName ? 'ENS name' : 'address'}`}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-slate-500" />
          )}
        </button>
        
        {ensData?.ensName && (
          <button
            onClick={() => window.open(`https://app.ens.domains/${ensData.ensName}`, '_blank')}
            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
            title="View on ENS App"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>
    </div>
  );
}

// Simplified version for smaller spaces
export function CompactWalletDisplay() {
  const { address, isConnected } = useAccount();
  const [ensData, setEnsData] = useState<ENSResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      fetchENSData();
    }
  }, [address, isConnected]);

  const fetchENSData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const profile = await getENSProfile(address);
      setEnsData(profile);
    } catch (error) {
      console.error('Error fetching ENS data:', error);
      setEnsData({
        ensName: null,
        address: address,
        avatar: null
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) return null;

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {ensData?.avatar && (
        <img
          src={ensData.avatar}
          alt="Avatar"
          className="w-6 h-6 rounded-full"
        />
      )}
      <span className="text-sm font-medium">
        {ensData?.ensName || (address && formatAddress(address))}
      </span>
      {ensData?.ensName && (
        <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
          ENS
        </span>
      )}
    </div>
  );
}