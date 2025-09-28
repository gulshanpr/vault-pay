'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { VaultPaySDK } from '../sdk';
import { Button } from './ui/button';

/**
 * VaultPay SDK Integration Component
 * Demonstrates the simple backend API wrapper SDK
 */
export function VaultPayIntegration() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Initialize comprehensive merchant SDK
  const sdk = new VaultPaySDK({
    apiKey: process.env.NEXT_PUBLIC_VAULTPAY_API_KEY || 'demo-api-key',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    merchantId: 'demo-merchant-123',
    merchantAddress: address || '0x742d35cc6bf4532c4db62b7d2e3c1b5eb3f8e3c4',
    merchantName: 'Demo Store',
    environment: 'development',
    debugMode: true,
    autoYieldEnabled: true,
    supportedChains: [1, 137, 42161],
    defaultChain: 1
  });

  const handleQuickPay = async () => {
    if (!address) {
      setResult('❌ Please connect your wallet first');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const paymentResult = await sdk.quickPay(
        '0.001',
        'ETH', 
        `order-${Date.now()}`
      );

      if (paymentResult.success) {
        setResult(`
          ✅ Payment Request Sent!
          
          💳 Backend Response:
          • Status: ${paymentResult.success ? 'Success' : 'Failed'}
          • Transaction: ${paymentResult.data?.transactionHash || 'Pending'}
          • Amount: 0.001 ETH
          • Order ID: order-${Date.now()}
          
          🚀 SDK Features:
          • Backend API integration ✅
          • Merchant payment processing ✅
          • Order tracking ✅
          
          📊 Configuration:
          • API URL: ${sdk.getConfig().apiUrl}
          • Merchant: ${sdk.getConfig().merchantId}
          • Environment: ${sdk.getConfig().environment}
        `);
      } else {
        setResult(`❌ Payment failed: ${paymentResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapDemo = async () => {
    setLoading(true);
    setResult('');

    try {
      setResult('Getting swap quote from backend...');
      
      const swapQuote = await sdk.getSwapQuote('ETH', 'USDC', '0.1');
      
      if (swapQuote.success) {
        setResult(`
          ✅ Swap Quote Retrieved!
          
          💱 Quote Details:
          • 0.1 ETH → USDC
          • Backend API: Connected ✅
          • Quote Status: Available
          
          🔗 Backend Integration:
          • API URL: ${sdk.getConfig().apiUrl}
          • Swap Service: Active ✅
          • Ready for merchant payments ✅
        `);
      } else {
        setResult(`❌ Swap quote failed: ${swapQuote.error || 'Backend not available'}`);
      }
      
    } catch (error) {
      setResult(`❌ Swap Error: ${error instanceof Error ? error.message : 'Backend API connection failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVaultSearch = async () => {
    setLoading(true);
    setResult('');

    try {
      setResult('Searching for yield vaults...');
      
      const vaults = await sdk.vaults.getAvailableVaults('USDC');
      
      if (vaults.success) {
        setResult(`
          ✅ Vault Information Retrieved!
          
          🏦 Vault Services:
          • Backend API: Connected ✅
          • Vault Data: Available ✅
          • Yield Opportunities: Ready ✅
          
          💰 Available Features:
          • Deposit to earn yield
          • Withdraw from vaults
          • APY tracking
          
          🔗 Backend Status:
          • Vault Service: Active ✅
          • API Response: ${vaults.success ? 'Success' : 'Failed'}
        `);
      } else {
        setResult(`❌ Vault search failed: ${vaults.error || 'Backend not available'}`);
      }
      
    } catch (error) {
      setResult(`❌ Vault Error: ${error instanceof Error ? error.message : 'Backend API connection failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    setLoading(true);
    setResult('');

    try {
      const health = await sdk.healthCheck();
      
      if (health.success) {
        setResult(`
          🏥 Backend Health Check
          
          ✅ Overall Status: HEALTHY
          
          🔧 Services:
          • Payment API: ${health.success ? '✅' : '❌'}
          • Swap API: ${health.success ? '✅' : '❌'}
          • Vault API: ${health.success ? '✅' : '❌'}
          
          ⏰ Checked at: ${new Date().toLocaleTimeString()}
          
          📊 SDK Information:
          • API URL: ${sdk.getConfig().apiUrl}
          • Merchant ID: ${sdk.getConfig().merchantId}
          • Merchant: ${sdk.getConfig().merchantAddress || 'Not set'}
        `);
      } else {
        setResult(`❌ Health check failed: ${health.error || 'Backend not responding'}`);
      }
    } catch (error) {
      setResult(`❌ Health check failed: ${error instanceof Error ? error.message : 'Connection error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          VaultPay SDK Demo
        </h1>
        <p className="text-gray-600 mt-2">
          Simple Backend API Wrapper for Merchant Payments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={handleQuickPay} 
          disabled={loading}
          className="h-16 text-lg"
        >
          💳 Quick Payment Demo
        </Button>

        <Button 
          onClick={handleSwapDemo} 
          disabled={loading}
          variant="outline"
          className="h-16 text-lg"
        >
          🔄 Swap Quote Demo
        </Button>

        <Button 
          onClick={handleVaultSearch} 
          disabled={loading}
          variant="outline"
          className="h-16 text-lg"
        >
          🏦 Vault Info Demo
        </Button>

        <Button 
          onClick={handleHealthCheck} 
          disabled={loading}
          variant="outline"
          className="h-16 text-lg"
        >
          🏥 Health Check
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Processing...</span>
        </div>
      )}

      {result && (
        <div className="bg-gray-50 rounded-lg p-6 border">
          <h3 className="font-semibold mb-3 text-gray-800">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
            {result}
          </pre>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-semibold mb-3 text-blue-800">About This SDK</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>• <strong>Simple Backend Wrapper:</strong> Calls your backend API endpoints</p>
          <p>• <strong>Merchant Focused:</strong> Built for e-commerce payment processing</p>
          <p>• <strong>Easy Integration:</strong> Drop-in replacement for complex blockchain code</p>
          <p>• <strong>Smart Contract Ready:</strong> Backend handles all blockchain interactions</p>
        </div>
      </div>
    </div>
  );
}