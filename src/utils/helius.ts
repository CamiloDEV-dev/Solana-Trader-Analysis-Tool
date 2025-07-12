// This file is primarily for client-side Helius interactions if needed.
// The main heavy lifting is in the /api/analyze.ts serverless function.
// We can add functions here to validate token addresses or fetch other on-chain data directly from the client if necessary.

const HELIUS_API_URL = `https://mainnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY}`;

/**
 * Validates if a given string is a valid Solana address.
 * This is a basic client-side check.
 * @param address The address to validate.
 * @returns True if the address seems valid, false otherwise.
 */
export const isValidSolanaAddress = (address: string): boolean => {
    // A basic check for length and characters. A more robust check could use a library.
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

/**
 * Fetches basic metadata for a token.
 * This can be used to verify if a token address is valid and get its name/symbol.
 * @param tokenAddress The SPL token contract address.
 * @returns The token metadata or null if not found.
 */
export const getTokenMetadata = async (tokenAddress: string) => {
    if (!isValidSolanaAddress(tokenAddress)) {
        return null;
    }
    try {
        const response = await fetch(HELIUS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'my-id',
                method: 'getAsset',
                params: {
                    id: tokenAddress,
                },
            }),
        });
        const data = await response.json();
        if (data.error || !data.result) {
            console.error('Failed to get token metadata:', data.error);
            return null;
        }
        return data.result;
    } catch (error) {
        console.error('Error fetching token metadata:', error);
        return null;
    }
};
