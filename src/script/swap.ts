import { SDK, HashLock, PrivateKeyProviderConnector, NetworkEnum } from "@1inch/cross-chain-sdk";
import { createWalletClient, createPublicClient, http, parseEther, formatEther, getContract, Account } from 'viem';
import { arbitrum, base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { randomBytes } from 'crypto';
import { solidityPackedKeccak256 } from 'ethers';
import Web3 from "web3";

// TODO write formal bug for this function being inaccessible
function getRandomBytes32() {
    // for some reason the cross-chain-sdk expects a leading 0x and can't handle a 32 byte long hex string
    return '0x' + Buffer.from(randomBytes(32)).toString('hex');
}

const makerPrivateKey = process.env.WALLET_KEY;
const makerAddress = process.env.WALLET_ADDRESS;
const nodeUrl = process.env.RPC_URL;
const devPortalApiKey = process.env.DEV_PORTAL_KEY;

// Validate environment variables
if (!makerPrivateKey || !makerAddress || !nodeUrl || !devPortalApiKey) {
    throw new Error("Missing required environment variables. Please check your .env file.");
}

// Create Viem clients
const account = privateKeyToAccount(makerPrivateKey as `0x${string}`);       

let srcChainId = NetworkEnum.ARBITRUM;
let dstChainId = NetworkEnum.COINBASE;
let srcTokenAddress = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
let dstTokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const approveABI = [{
    "constant": false,
    "inputs": [
        { "name": "spender", "type": "address" },
        { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}];

(async () => {
    const invert = true;

    if (invert) {
        const temp = srcChainId;
        srcChainId = dstChainId;
        dstChainId = temp;

        const tempAddress = srcTokenAddress;
        srcTokenAddress = dstTokenAddress;
        dstTokenAddress = tempAddress;
    }

    // Determine which chain to use based on srcChainId
    const chain = srcChainId === NetworkEnum.ARBITRUM ? arbitrum : base;
    
    // Create Viem clients
    const publicClient = createPublicClient({
        chain,
        transport: http(nodeUrl)
    });

    const walletClient = createWalletClient({
        account: account as Account,
        chain,
        transport: http(nodeUrl)
    });

    // Check ETH balance before proceeding
    const balance = await publicClient.getBalance({ 
        address: account.address 
    });
    const ethBalance = parseFloat(formatEther(balance));
    console.log(`ETH balance on ${chain.name}:`, ethBalance);

    // if (ethBalance < 0.001) { // You can adjust this threshold
    //     console.error("Insufficient ETH balance for gas. Please bridge ETH to your wallet.");
    //     process.exit(1);
    // }

    // Create contract instance for approval
    const tokenContract = getContract({
        address: srcTokenAddress as `0x${string}`,
        abi: approveABI,
        client: { public: publicClient, wallet: walletClient }
    });

    // Approve tokens for spending
    console.log("Approving tokens...");
    const approveHash = await walletClient.writeContract({
        address: srcTokenAddress as `0x${string}`,
        abi: approveABI,
        functionName: 'approve',
        args: [
            '0x111111125421ca6dc452d289314280a0f8842a65', // aggregation router v6
            BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') // unlimited allowance
        ]
    });

    console.log("Approval transaction hash:", approveHash);
    
    // Wait for approval confirmation
    const approveReceipt = await publicClient.waitForTransactionReceipt({ 
        hash: approveHash 
    });
    console.log("Approval confirmed in block:", approveReceipt.blockNumber);

    // For the 1inch SDK, we still need to create a Web3 provider for compatibility
    // const { Web3 } = require('web3');
    const web3Instance = new Web3(nodeUrl);
    const blockchainProvider = new PrivateKeyProviderConnector(makerPrivateKey, web3Instance);

    const sdk = new SDK({
        url: 'https://api.1inch.dev/fusion-plus',
        authKey: devPortalApiKey,
        blockchainProvider
    });

    const params = {
        srcChainId,
        dstChainId,
        srcTokenAddress,
        dstTokenAddress,
        amount: '200000', // Adjust this to the correct decimal precision of the source token
        enableEstimate: true,
        walletAddress: makerAddress
    };

    sdk.getQuote(params).then((quote: any) => {
        const secretsCount = quote.getPreset().secretsCount;

        const secrets = Array.from({ length: secretsCount }).map(() => getRandomBytes32());
        const secretHashes = secrets.map(x => HashLock.hashSecret(x));

        const hashLock = secretsCount === 1
            ? HashLock.forSingleFill(secrets[0])
            : HashLock.forMultipleFills(
                secretHashes.map((secretHash, i) =>
                    solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
                )
            );

        console.log("Received Fusion+ quote from 1inch API");
        console.log(quote);

        sdk.placeOrder(quote, {
            walletAddress: makerAddress,
            hashLock,
            secretHashes
        }).then((quoteResponse: any) => {

            const orderHash = quoteResponse.orderHash;

            console.log(`Order successfully placed`);

            const intervalId = setInterval(() => {
                console.log(`Polling for fills until order status is set to "executed"...`);
                sdk.getOrderStatus(orderHash).then((order: any) => {
                    if (order.status === 'executed') {
                        console.log(`Order is complete. Exiting.`);
                        clearInterval(intervalId);
                    }
                }
                ).catch((error: any) =>
                    console.error(`Error: ${JSON.stringify(error, null, 2)}`)
                );

                sdk.getReadyToAcceptSecretFills(orderHash)
                    .then((fillsObject: any) => {
                        if (fillsObject.fills.length > 0) {
                            fillsObject.fills.forEach((fill: any) => {
                                sdk.submitSecret(orderHash, secrets[fill.idx])
                                    .then(() => {
                                        console.log(`Fill order found! Secret submitted: ${JSON.stringify(secretHashes[fill.idx], null, 2)}`);
                                    })
                                    .catch((error: any) => {
                                        console.error(`Error submitting secret: ${JSON.stringify(error, null, 2)}`);
                                    });
                            });
                        }
                    })
                    .catch((error: any) => {
                        if (error.response) {
                            // The request was made and the server responded with a status code
                            // that falls out of the range of 2xx
                            console.error('Error getting ready to accept secret fills:', {
                                status: error.response.status,
                                statusText: error.response.statusText,
                                data: error.response.data
                            });
                        } else if (error.request) {
                            // The request was made but no response was received
                            console.error('No response received:', error.request);
                        } else {
                            // Something happened in setting up the request that triggered an Error
                            console.error('Error', error.message);
                        }
                    });
            }, 5000);
        }).catch((error: any) => {
            console.dir(error, { depth: null });
        });
    }).catch((error: any) => {
        console.dir(error, { depth: null });
    });
})().catch(error => {
    console.error("Error in main execution:", error);
});