import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Helius } from 'helius-sdk';

// Initialize Helius SDK
const helius = new Helius(process.env.VITE_HELIUS_API_KEY || '');

// Caching to minimize redundant API calls
const tokenInfoCache = new Map<string, any>();

// Main serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const {
        tokenAddress,
        startDate,
        endDate,
        maxWallets,
        transactionType,
        minAmount,
        maxAmount,
    } = req.body;

    // --- Input Validation ---
    if (!tokenAddress || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        const startTime = new Date(startDate).getTime() / 1000;
        const endTime = new Date(endDate).getTime() / 1000;

        let transactions: any[] = [];
        let before: string | undefined = undefined;
        let hasMore = true;

        // --- Pagination Logic ---
        // Fetch transactions page by page until we are outside the requested time window
        while (hasMore) {
            const response = await helius.rpc.getParsedTransactions({
                address: tokenAddress,
                limit: 100, // Helius API limit
                before,
            });

            if (!response || response.length === 0) {
                hasMore = false;
                continue;
            }

            const lastTxInPage = response[response.length - 1];
            before = lastTxInPage.transaction.signatures[0];

            for (const tx of response) {
                if (tx.blockTime < startTime) {
                    hasMore = false;
                    break;
                }
                if (tx.blockTime <= endTime) {
                    transactions.push(tx);
                }
            }
        }
        
        // Sort transactions from oldest to newest for "First Buy" logic
        transactions.sort((a, b) => a.blockTime - b.blockTime);

        // --- Analysis Logic ---
        const analyzedData: any[] = [];
        const firstBuyWallets = new Set<string>();

        for (const tx of transactions) {
            if (tx.meta?.err) continue; // Skip failed transactions

            const tokenBalances = tx.meta?.postTokenBalances?.filter(
                (b: any) => b.mint === tokenAddress
            );
            const preTokenBalances = tx.meta?.preTokenBalances?.filter(
                (b: any) => b.mint === tokenAddress
            );

            if (!tokenBalances || !preTokenBalances) continue;

            for (const postBalance of tokenBalances) {
                const preBalance = preTokenBalances.find(
                    (b: any) => b.owner === postBalance.owner
                );

                const preAmount = preBalance ? preBalance.uiTokenAmount.uiAmount : 0;
                const postAmount = postBalance.uiTokenAmount.uiAmount;
                const amountChange = postAmount - preAmount;

                if (amountChange === 0) continue;

                // Filter by amount
                if (Math.abs(amountChange) < minAmount || Math.abs(amountChange) > maxAmount) {
                    continue;
                }

                const type = amountChange > 0 ? 'buy' : 'sell';

                // Filter by transaction type
                if (transactionType !== 'both' && transactionType !== type) {
                    continue;
                }

                let isFirstBuy = null;
                if (type === 'buy') {
                    if (!firstBuyWallets.has(postBalance.owner)) {
                        isFirstBuy = true;
                        firstBuyWallets.add(postBalance.owner);
                    } else {
                        isFirstBuy = false;
                    }
                }

                let sellPercentage = null;
                if (type === 'sell') {
                    const amountSold = Math.abs(amountChange);
                    const finalBalance = postAmount;
                    sellPercentage = (amountSold / (finalBalance + amountSold)) * 100;
                }

                analyzedData.push({
                    wallet: postBalance.owner,
                    type,
                    amount: Math.abs(amountChange),
                    date: new Date(tx.blockTime * 1000).toISOString(),
                    isFirstBuy,
                    sellPercentage,
                    txSignature: tx.transaction.signatures[0],
                });
            }
        }
        
        // Limit the number of wallets in the final result
        const walletCounts: { [key: string]: number } = {};
        const limitedData = analyzedData.filter(d => {
            if (!walletCounts[d.wallet]) {
                walletCounts[d.wallet] = 0;
            }
            if (Object.keys(walletCounts).length <= maxWallets) {
                 walletCounts[d.wallet]++;
                 return true;
            }
            return false;
        });


        res.status(200).json(limitedData.slice(0, maxWallets));

    } catch (error: any) {
        console.error('Error in analyze function:', error);
        res.status(500).json({ error: 'Failed to fetch or analyze data.', details: error.message });
    }
}
