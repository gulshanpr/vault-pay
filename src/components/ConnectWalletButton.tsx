"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Loader2 } from "lucide-react";

export default function ConnectWalletButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is connected
  const isWalletConnected = authenticated && wallets.length > 0 && wallets[0]?.address;

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Ensure user is authenticated & wallet connected
      if (!authenticated) {
        await login(); // handles wallet linking too
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Get user wallet address for display
  const walletAddress = wallets[0]?.address;
  const displayAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  if (!ready) {
    return (
      <Button disabled className="bg-blue-100 text-blue-600">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isWalletConnected) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-700 dark:text-green-300 font-mono">
            {displayAddress}
          </span>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
