"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getENSProfile, isENSAvailable, getENSRegistrationURL, type ENSResult } from '@/lib/ens';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Loader2, 
  User, 
  Store,
  Sparkles
} from 'lucide-react';

interface ENSCardProps {
  onENSUpdate?: (ensData: ENSResult | null) => void;
}

export function ENSCard({ onENSUpdate }: ENSCardProps) {
  const { address, isConnected } = useAccount();
  const [ensData, setENSData] = useState<ENSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestedName, setSuggestedName] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

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
      setENSData(profile);
      onENSUpdate?.(profile);
    } catch (error) {
      console.error('Error fetching ENS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNameAvailability = async (name: string) => {
    if (!name || name.length < 3) {
      setIsAvailable(null);
      return;
    }

    setCheckingAvailability(true);
    try {
      const available = await isENSAvailable(`${name}.eth`);
      setIsAvailable(available);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsAvailable(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleNameChange = (name: string) => {
    setSuggestedName(name);
    // Debounce the availability check
    const timeoutId = setTimeout(() => checkNameAvailability(name), 500);
    return () => clearTimeout(timeoutId);
  };

  const openENSApp = () => {
    const url = getENSRegistrationURL(suggestedName);
    window.open(url, '_blank');
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

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            ENS Domain
          </h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300">
          Connect your wallet to check for ENS domains and set up your merchant identity.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            ENS Domain
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-slate-600 dark:text-slate-300">
            Checking for ENS name...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          ENS Domain
        </h3>
      </div>

      {ensData?.ensName ? (
        // User has ENS - Show their domain
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            {ensData.avatar && (
              <img
                src={ensData.avatar}
                alt="ENS Avatar"
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {ensData.ensName}
                </span>
                <button
                  onClick={() => copyToClipboard(ensData.ensName!)}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Your merchant payment domain
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-300">
                  Ready for Payments! 🎉
                </h4>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Customers can now send payments to <strong>{ensData.ensName}</strong> instead of your wallet address.
                  This makes transactions more trustworthy and memorable.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Wallet: {formatAddress(ensData.address)}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(ensData.address)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      ) : (
        // User doesn't have ENS - Show registration option
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <Store className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                  Claim Your Store Domain
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Get a memorable .eth domain for your business. Customers can pay to 
                  <strong> yourstore.eth</strong> instead of a long wallet address.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Choose your store name
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <div className="flex">
                  <input
                    type="text"
                    value={suggestedName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="mystore"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-600 border border-l-0 border-slate-300 dark:border-slate-600 rounded-r-md text-slate-600 dark:text-slate-300">
                    .eth
                  </div>
                </div>
                {suggestedName && (
                  <div className="mt-2 flex items-center space-x-2">
                    {checkingAvailability ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : isAvailable === true ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : isAvailable === false ? (
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    ) : null}
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {checkingAvailability 
                        ? 'Checking availability...' 
                        : isAvailable === true 
                        ? `${suggestedName}.eth is available!`
                        : isAvailable === false
                        ? `${suggestedName}.eth is taken`
                        : 'Enter a name to check availability'
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={openENSApp}
            className="w-full"
            disabled={!suggestedName || isAvailable === false}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Register {suggestedName ? `${suggestedName}.eth` : 'ENS Domain'}
          </Button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            You'll be redirected to ENS App to complete registration. 
            Registration typically costs ~$5/year + gas fees.
          </p>
        </div>
      )}
    </div>
  );
}