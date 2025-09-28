"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient, useChainId } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowDownUp,
  Send,
  DollarSign,
  Info,
} from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { CONTRACT_ADDRESSES, getContractAddress } from "@/config/abi";
import { SUPPORTED_CHAINS } from "@/config/supportedCombinations";

type Position = {
  vault: { address: string; name?: string | null };
  assets: string;
  assetsUsd: string;
  shares: string;
};

type UserPositionsResponse = {
  userByAddress?: {
    address: string;
    vaultPositions: Position[];
  } | null;
};

interface RedeemAction {
  type: "redeem" | "withdraw" | "transfer";
  amount: string;
  recipient?: string;
  minOut?: string;
}

const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.BASE]: "Base",
  [SUPPORTED_CHAINS.ARBITRUM]: "Arbitrum", 
  [SUPPORTED_CHAINS.UNICHAIN]: "Unichain",
};

function formatUSD(value?: string | null, digits = 2) {
  if (!value) return "0";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatShares(shares: string, decimals = 18) {
  try {
    return formatUnits(BigInt(shares), decimals);
  } catch {
    return shares;
  }
}

export function VaultRedeemInterface() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { user } = usePrivy();

  // State
  const [selectedChain, setSelectedChain] = useState<keyof typeof SUPPORTED_CHAINS>("ARBITRUM");
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Form state
  const [redeemAction, setRedeemAction] = useState<RedeemAction>({
    type: "redeem",
    amount: "",
    recipient: "",
    minOut: "",
  });

  const userAddress = address || user?.wallet?.address || "";
  const currentChainId = SUPPORTED_CHAINS[selectedChain];

  // Load user positions
  useEffect(() => {
    if (!userAddress) return;

    const loadPositions = async () => {
      setLoading(true);
      setError(null);
      try {
        const chainName = selectedChain.toLowerCase();
        const url = new URL("/api/morpho/user-positions", window.location.origin);
        url.searchParams.set("chain", chainName);
        url.searchParams.set("user", userAddress);

        const response = await fetch(url.toString());
        const data: UserPositionsResponse = await response.json();

        if (data.userByAddress?.vaultPositions) {
          setPositions(data.userByAddress.vaultPositions);
          if (data.userByAddress.vaultPositions.length > 0) {
            setSelectedPosition(data.userByAddress.vaultPositions[0]);
          }
        } else {
          setPositions([]);
          setSelectedPosition(null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load positions");
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPositions();
  }, [selectedChain, userAddress]);

  // Reset form when position changes
  useEffect(() => {
    setRedeemAction({
      type: "redeem",
      amount: "",
      recipient: userAddress,
      minOut: "",
    });
    setTxHash(null);
    setError(null);
  }, [selectedPosition, userAddress]);

  const handleMaxAmount = () => {
    if (selectedPosition) {
      const formattedShares = formatShares(selectedPosition.shares);
      setRedeemAction(prev => ({ ...prev, amount: formattedShares }));
    }
  };

  const getContractForChain = (chainId: number, isEuler: boolean = false) => {
    return getContractAddress(
      chainId,
      isEuler ? "EULER_VAULT_ADAPTER" : "VAULT_ADAPTER"
    );
  };

  const executeRedeem = async () => {
    if (!selectedPosition || !walletClient || !publicClient || !userAddress) {
      setError("Missing required data for transaction");
      return;
    }

    if (!redeemAction.amount || parseFloat(redeemAction.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setTxLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Switch to correct chain if needed
      if (chainId !== currentChainId) {
        // You might want to add chain switching logic here
        throw new Error(`Please switch to ${CHAIN_NAMES[currentChainId]} network`);
      }

      const sharesAmount = parseUnits(redeemAction.amount, 18).toString();
      const recipient = redeemAction.recipient || userAddress;
      const minOut = redeemAction.minOut ? parseUnits(redeemAction.minOut, 18).toString() : "0";

      // Determine if this is an Euler vault (you might need to adjust this logic)
      const isEulerVault = selectedPosition.vault.name?.toLowerCase().includes("euler") || false;
      const contractAddress = getContractForChain(currentChainId, isEulerVault);

      let hash: string;

      if (redeemAction.type === "redeem") {
        // Redeem shares for assets
        hash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: isEulerVault ? eulerVaultAdapterABI : vaultAdapterABI,
          functionName: "redeemShares",
          args: [
            selectedPosition.vault.address,
            BigInt(sharesAmount),
            recipient,
            BigInt(minOut),
          ],
        });
      } else if (redeemAction.type === "withdraw") {
        // Withdraw specific amount of assets
        const assetsAmount = parseUnits(redeemAction.amount, 18).toString();
        const maxSharesIn = redeemAction.minOut ? parseUnits(redeemAction.minOut, 18).toString() : sharesAmount;

        hash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: isEulerVault ? eulerVaultAdapterABI : vaultAdapterABI,
          functionName: "withdrawAssets",
          args: [
            selectedPosition.vault.address,
            BigInt(assetsAmount),
            recipient,
            BigInt(maxSharesIn),
          ],
        });
      } else {
        // Transfer shares directly (ERC20 transfer)
        hash = await walletClient.writeContract({
          address: selectedPosition.vault.address as `0x${string}`,
          abi: erc20ABI,
          functionName: "transfer",
          args: [recipient, BigInt(sharesAmount)],
        });
      }

      setTxHash(hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === "success") {
        // Reload positions after successful transaction
        setTimeout(() => {
          window.location.reload(); // Simple reload, you could implement a more sophisticated refresh
        }, 2000);
      }

    } catch (err: any) {
      console.error("Transaction failed:", err);
      setError(err.message || "Transaction failed");
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5" />
            Redeem Vault Shares
          </CardTitle>
          <CardDescription>
            Withdraw your vault positions or transfer shares to another address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chain Selection */}
          <div className="space-y-2">
            <Label>Select Network</Label>
            <Select
              value={selectedChain}
              onValueChange={(value) => setSelectedChain(value as keyof typeof SUPPORTED_CHAINS)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASE">Base</SelectItem>
                <SelectItem value="ARBITRUM">Arbitrum</SelectItem>
                <SelectItem value="UNICHAIN">Unichain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Positions Loading/Error */}
          {loading && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading positions...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* No Wallet Connected */}
          {!userAddress && (
            <div className="text-center py-8 text-slate-500">
              Please connect your wallet to view and redeem vault positions.
            </div>
          )}

          {/* No Positions */}
          {userAddress && !loading && positions.length === 0 && !error && (
            <div className="text-center py-8 text-slate-500">
              No vault positions found on {CHAIN_NAMES[currentChainId]}.
            </div>
          )}

          {/* Position Selection */}
          {positions.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Vault Position</Label>
                <Select
                  value={selectedPosition?.vault.address || ""}
                  onValueChange={(address) => {
                    const position = positions.find(p => p.vault.address === address);
                    setSelectedPosition(position || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vault position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position, idx) => (
                      <SelectItem key={idx} value={position.vault.address}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {position.vault.name || `Vault ${idx + 1}`}
                          </span>
                          <span className="text-xs text-slate-500">
                            ${formatUSD(position.assetsUsd)} • {formatShares(position.shares)} shares
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Position Details */}
              {selectedPosition && (
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">Vault Address</div>
                      <div className="font-mono text-xs">
                        {selectedPosition.vault.address.slice(0, 10)}...
                        {selectedPosition.vault.address.slice(-8)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Total Value (USD)</div>
                      <div className="font-semibold text-green-600">
                        ${formatUSD(selectedPosition.assetsUsd)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Your Shares</div>
                      <div className="font-semibold">
                        {formatShares(selectedPosition.shares)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Redeem Actions */}
              <Tabs value={redeemAction.type} onValueChange={(value) => 
                setRedeemAction(prev => ({ ...prev, type: value as RedeemAction["type"] }))
              }>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="redeem" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Redeem
                  </TabsTrigger>
                  <TabsTrigger value="withdraw" className="flex items-center gap-2">
                    <ArrowDownUp className="w-4 h-4" />
                    Withdraw
                  </TabsTrigger>
                  <TabsTrigger value="transfer" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Transfer
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="redeem" className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 text-blue-600" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Redeem your vault shares for the underlying assets. You'll receive the assets in your wallet.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Shares to Redeem</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={redeemAction.amount}
                        onChange={(e) => setRedeemAction(prev => ({ ...prev, amount: e.target.value }))}
                      />
                      <Button variant="outline" onClick={handleMaxAmount}>
                        Max
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Assets Out (Optional)</Label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={redeemAction.minOut}
                      onChange={(e) => setRedeemAction(prev => ({ ...prev, minOut: e.target.value }))}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 text-blue-600" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Withdraw a specific amount of underlying assets. The required shares will be burned automatically.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Assets to Withdraw</Label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={redeemAction.amount}
                      onChange={(e) => setRedeemAction(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Shares to Burn (Optional)</Label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={redeemAction.minOut}
                      onChange={(e) => setRedeemAction(prev => ({ ...prev, minOut: e.target.value }))}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="transfer" className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 text-blue-600" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Transfer your vault shares to another address. The recipient will own the shares and can redeem them later.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Shares to Transfer</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={redeemAction.amount}
                        onChange={(e) => setRedeemAction(prev => ({ ...prev, amount: e.target.value }))}
                      />
                      <Button variant="outline" onClick={handleMaxAmount}>
                        Max
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Recipient Address</Label>
                    <Input
                      type="text"
                      placeholder="0x..."
                      value={redeemAction.recipient}
                      onChange={(e) => setRedeemAction(prev => ({ ...prev, recipient: e.target.value }))}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Button */}
              <Button
                onClick={executeRedeem}
                disabled={
                  txLoading ||
                  !selectedPosition ||
                  !redeemAction.amount ||
                  (redeemAction.type === "transfer" && !redeemAction.recipient)
                }
                className="w-full"
                size="lg"
              >
                {txLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {redeemAction.type === "redeem" && <DollarSign className="w-4 h-4 mr-2" />}
                    {redeemAction.type === "withdraw" && <ArrowDownUp className="w-4 h-4 mr-2" />}
                    {redeemAction.type === "transfer" && <Send className="w-4 h-4 mr-2" />}
                    {redeemAction.type === "redeem" && "Redeem Shares"}
                    {redeemAction.type === "withdraw" && "Withdraw Assets"}
                    {redeemAction.type === "transfer" && "Transfer Shares"}
                  </>
                )}
              </Button>

              {/* Transaction Status */}
              {txHash && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Transaction Submitted</div>
                      <div className="text-sm">
                        Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Minimal ABIs for the contracts
const vaultAdapterABI = [
  {
    name: "redeemShares",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vault", type: "address" },
      { name: "shares", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "minAssetsOut", type: "uint256" },
    ],
    outputs: [{ name: "assetsReceived", type: "uint256" }],
  },
  {
    name: "withdrawAssets",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vault", type: "address" },
      { name: "assets", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "maxSharesIn", type: "uint256" },
    ],
    outputs: [{ name: "sharesBurned", type: "uint256" }],
  },
] as const;

const eulerVaultAdapterABI = [
  {
    name: "redeemShares",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vault", type: "address" },
      { name: "shares", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "minAssetsOut", type: "uint256" },
    ],
    outputs: [{ name: "assetsReceived", type: "uint256" }],
  },
  {
    name: "withdrawAssets",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vault", type: "address" },
      { name: "assets", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "maxSharesIn", type: "uint256" },
    ],
    outputs: [{ name: "sharesBurned", type: "uint256" }],
  },
] as const;

const erc20ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
