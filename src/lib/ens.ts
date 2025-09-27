import { createPublicClient, http, isAddress } from 'viem';
import { mainnet } from 'viem/chains';

// Create a public client for ENS resolution with fallback RPC
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com') // Free RPC endpoint
});

export interface ENSResult {
  ensName: string | null;
  address: string;
  avatar?: string | null;
}

/**
 * Get ENS name from wallet address (reverse lookup)
 */
export async function getENSName(address: string): Promise<string | null> {
  try {
    if (!isAddress(address)) {
      throw new Error('Invalid address format');
    }
    
    const ensName = await publicClient.getEnsName({
      address: address as `0x${string}`,
    });
    
    return ensName;
  } catch (error) {
    console.error('Error fetching ENS name:', error);
    return null;
  }
}

/**
 * Resolve ENS name to address
 */
export async function resolveENSName(ensName: string): Promise<string | null> {
  try {
    const address = await publicClient.getEnsAddress({
      name: ensName,
    });
    
    return address;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
}

/**
 * Get ENS avatar
 */
export async function getENSAvatar(ensName: string): Promise<string | null> {
  try {
    const avatar = await publicClient.getEnsAvatar({
      name: ensName,
    });
    
    return avatar;
  } catch (error) {
    console.error('Error fetching ENS avatar:', error);
    return null;
  }
}

/**
 * Get complete ENS profile
 */
export async function getENSProfile(address: string): Promise<ENSResult> {
  const ensName = await getENSName(address);
  let avatar = null;
  
  if (ensName) {
    avatar = await getENSAvatar(ensName);
  }
  
  return {
    ensName,
    address,
    avatar
  };
}

/**
 * Check if ENS name is available for registration
 */
export async function isENSAvailable(name: string): Promise<boolean> {
  try {
    const address = await resolveENSName(name);
    return address === null;
  } catch (error) {
    return true; // Assume available if there's an error
  }
}

/**
 * Generate ENS registration URL
 */
export function getENSRegistrationURL(name?: string): string {
  const baseUrl = 'https://app.ens.domains';
  return name ? `${baseUrl}/${name}.eth` : baseUrl;
}