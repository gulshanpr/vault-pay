"use client";

import { useState } from 'react';
import { resolveRecipientAddress, getDisplayNameForAddress } from '@/utils/swapUtils';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, User, Check, AlertCircle } from 'lucide-react';

export function ENSTestComponent() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{
    type: 'address' | 'ens' | 'error';
    displayName: string;
    resolvedAddress?: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      // Test ENS resolution
      const resolvedAddress = await resolveRecipientAddress(input.trim());
      const displayName = await getDisplayNameForAddress(resolvedAddress);
      
      setResult({
        type: input.endsWith('.eth') ? 'ens' : 'address',
        displayName,
        resolvedAddress,
      });
    } catch (error) {
      setResult({
        type: 'error',
        displayName: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testCases = [
    { name: 'Vitalik', value: 'vitalik.eth' },
    { name: 'ENS', value: 'ens.eth' },
    { name: 'Random Address', value: '0x742d35cc6475e2a0b99c60a18fb3b0b0a13ba5f4' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
        <Search className="w-5 h-5 mr-2" />
        ENS Resolution Test
      </h3>
      
      <div className="space-y-4">
        {/* Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter ENS name (e.g., vitalik.eth) or address"
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleTest()}
          />
          <Button
            onClick={handleTest}
            disabled={loading || !input.trim()}
            className="px-4"
          >
            {loading ? '...' : 'Test'}
          </Button>
        </div>

        {/* Quick Test Cases */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Try:</span>
          {testCases.map((testCase) => (
            <button
              key={testCase.name}
              onClick={() => setInput(testCase.value)}
              className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
            >
              {testCase.name}
            </button>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className="mt-4 p-4 rounded-lg border">
            {result.type === 'error' ? (
              <div className="flex items-start space-x-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <div className="font-medium">Resolution Failed</div>
                  <div className="text-sm mt-1">{result.error}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Resolution Successful</span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Input:</span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                      {input}
                    </span>
                  </div>
                  
                  {result.type === 'ens' && (
                    <>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="flex items-center space-x-2">
                        <span>Resolves to:</span>
                        <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                          {result.resolvedAddress}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Display Name:</strong> {result.displayName}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    This is how it would appear in the UI
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}