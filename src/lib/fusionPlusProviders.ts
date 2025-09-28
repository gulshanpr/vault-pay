import type {
  HttpProviderConnector,
  BlockchainProviderConnector,
  EIP712TypedData,
} from "@1inch/fusion-sdk";
import type { WalletClient, PublicClient } from "viem";

export class NextApiHttpProvider implements HttpProviderConnector {
  async get<T>(url: string): Promise<T> {
    const res = await fetch("/api/fusion-plus/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "GET", url }),
    });
    if (!res.ok) throw new Error(`Proxy GET failed: ${res.status}`);
    return res.json();
  }
  async post<T>(url: string, data: unknown): Promise<T> {
    const res = await fetch("/api/fusion-plus/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "POST", url, data }),
    });
    if (!res.ok) throw new Error(`Proxy POST failed: ${res.status}`);
    return res.json();
  }
}

export class WagmiPrivyBlockchainProvider
  implements BlockchainProviderConnector
{
  private walletClient: WalletClient;
  private publicClient: PublicClient;

  constructor(walletClient: WalletClient, publicClient: PublicClient) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
  }

  async signTypedData(
    walletAddress: string,
    typedData: EIP712TypedData
  ): Promise<string> {
    const { domain, types, primaryType, message } = typedData as any;
    const { EIP712Domain, ...restTypes } = types || {};
    return this.walletClient.signTypedData({
      account: walletAddress as `0x${string}`,
      domain,
      types: restTypes,
      primaryType,
      message,
    });
  }

  async ethCall(contractAddress: string, callData: string): Promise<string> {
    const res = await this.publicClient.call({
      to: contractAddress as `0x${string}`,
      data: callData as `0x${string}`,
    });
    return (res?.data ?? "0x") as string;
  }
}
