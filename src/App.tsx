import React, { useState, useMemo } from 'react';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {
    TransactionRow,
    formatNumber,
    formatDate,
    convertToCSV,
    downloadFile,
} from './utils/analysis';
import { isValidSolanaAddress } from './utils/helius';

type SortConfig = {
    key: keyof TransactionRow;
    direction: 'ascending' | 'descending';
};

const App: React.FC = () => {
    // --- State Management ---
    const [tokenAddress, setTokenAddress] = useState<string>('');
    const [dateRange, setDateRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection',
        },
    ]);
    const [maxWallets, setMaxWallets] = useState<number>(50);
    const [transactionType, setTransactionType] = useState<'buy' | 'sell' | 'both'>('both');
    const [minAmount, setMinAmount] = useState<number>(0);
    const [maxAmount, setMaxAmount] = useState<number>(1000000);

    const [results, setResults] = useState<TransactionRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // --- Event Handlers ---
    const handleFetchAndAnalyze = async () => {
        if (!isValidSolanaAddress(tokenAddress)) {
            setError('Invalid Solana SPL Token Address.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setResults([]);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenAddress,
                    startDate: dateRange[0].startDate.toISOString(),
                    endDate: dateRange[0].endDate.toISOString(),
                    maxWallets,
                    transactionType,
                    minAmount,
                    maxAmount,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'An unknown error occurred.');
            }

            const data: TransactionRow[] = await response.json();
            setResults(data);
            if(data.length === 0) {
                setError("No transactions found for the given criteria.");
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadCSV = () => {
        const csvData = convertToCSV(sortedResults);
        downloadFile(csvData, `solana-trader-analysis.csv`, 'text/csv');
    };

    // --- Sorting Logic ---
    const sortedResults = useMemo(() => {
        let sortableItems = [...results];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [results, sortConfig]);

    const requestSort = (key: keyof TransactionRow) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // --- Rendering ---
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-purple-400">Solana Trader Analysis Tool</h1>
                    <p className="text-gray-400 mt-2">Analyze SPL Token transactions to find key wallet behaviors.</p>
                </header>

                {/* --- Controls Section --- */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Input Fields */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="tokenAddress" className="block text-sm font-medium text-gray-300 mb-1">SPL Token Address</label>
                            <input
                                id="tokenAddress"
                                type="text"
                                value={tokenAddress}
                                onChange={(e) => setTokenAddress(e.target.value)}
                                placeholder="Enter token contract address"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="maxWallets" className="block text-sm font-medium text-gray-300 mb-1">Max Wallets</label>
                            <input
                                id="maxWallets"
                                type="number"
                                value={maxWallets}
                                onChange={(e) => setMaxWallets(Number(e.target.value))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Token Amount Range</label>
                            <div className="flex items-center space-x-2">
                                <input type="number" value={minAmount} onChange={e => setMinAmount(Number(e.target.value))} placeholder="Min" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"/>
                                <span className="text-gray-400">to</span>
                                <input type="number" value={maxAmount} onChange={e => setMaxAmount(Number(e.target.value))} placeholder="Max" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"/>
                            </div>
                        </div>
                    </div>
                    
                    {/* Date Picker */}
                    <div className="flex flex-col items-center">
                         <label className="block text-sm font-medium text-gray-300 mb-2">Select Timeframe</label>
                         <DateRangePicker
                            onChange={item => setDateRange([item.selection] as any)}
                            ranges={dateRange}
                            className="text-black"
                         />
                    </div>

                    {/* Filters & Action */}
                    <div className="space-y-6 flex flex-col justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
                            <div className="flex space-x-4">
                                {['both', 'buy', 'sell'].map(type => (
                                    <button key={type} onClick={() => setTransactionType(type as any)} className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${transactionType === type ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleFetchAndAnalyze}
                            disabled={isLoading}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                                </>
                            ) : "Fetch & Analyze"}
                        </button>
                    </div>
                </div>

                {/* --- Results Section --- */}
                {error && <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center mb-6">{error}</div>}
                
                <div className="bg-gray-800 p-2 sm:p-4 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h2 className="text-2xl font-semibold text-gray-200">Results</h2>
                        {results.length > 0 && (
                             <button
                                onClick={handleDownloadCSV}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
                            >
                                Download as CSV
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    {['wallet', 'type', 'amount', 'date', 'isFirstBuy', 'sellPercentage', 'txSignature'].map((key) => (
                                        <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(key as keyof TransactionRow)}>
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {sortedResults.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono truncate max-w-xs" title={row.wallet}>{row.wallet}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{row.type}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatNumber(row.amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(row.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{row.isFirstBuy === null ? 'N/A' : row.isFirstBuy ? 'Yes' : 'No'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{row.sellPercentage === null ? 'N/A' : `${formatNumber(row.sellPercentage)}%`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400 hover:underline">
                                            <a href={`https://solscan.io/tx/${row.txSignature}`} target="_blank" rel="noopener noreferrer" className="truncate max-w-xs inline-block">
                                                {row.txSignature}
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         {results.length === 0 && !isLoading && (
                            <div className="text-center py-10 text-gray-500">
                                No data to display. Adjust your filters and click "Fetch & Analyze".
                            </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
