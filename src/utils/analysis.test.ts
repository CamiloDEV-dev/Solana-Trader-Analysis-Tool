import { describe, it, expect } from 'vitest';
import { formatNumber, formatDate, convertToCSV, TransactionRow } from './analysis';

// Note: Using vitest which comes with Vite. Jest would be similar.

describe('Analysis Utility Functions', () => {

    // Test for formatNumber
    it('should format numbers with commas', () => {
        expect(formatNumber(1000)).toBe('1,000');
        expect(formatNumber(1234567.89)).toBe('1,234,567.89');
        expect(formatNumber(500)).toBe('500');
    });

    // Test for formatDate
    it('should format ISO date strings correctly', () => {
        const isoString = '2023-10-27T10:00:00.000Z';
        const expectedDate = new Date(isoString).toLocaleString();
        expect(formatDate(isoString)).toBe(expectedDate);
    });

    // Test for convertToCSV
    it('should convert transaction data to a CSV string', () => {
        const testData: TransactionRow[] = [
            {
                wallet: 'Wallet1',
                type: 'buy',
                amount: 100,
                date: '2023-10-27T10:00:00.000Z',
                isFirstBuy: true,
                sellPercentage: null,
                txSignature: 'sig1'
            },
            {
                wallet: 'Wallet2',
                type: 'sell',
                amount: 50,
                date: '2023-10-27T11:00:00.000Z',
                isFirstBuy: null,
                sellPercentage: 25.5,
                txSignature: 'sig2'
            },
        ];

        const csv = convertToCSV(testData);
        const rows = csv.split('\n');

        expect(rows[0]).toBe('wallet,type,amount,date,isFirstBuy,sellPercentage,txSignature');
        expect(rows[1]).toBe('Wallet1,buy,100,2023-10-27T10:00:00.000Z,true,,sig1');
        expect(rows[2]).toBe('Wallet2,sell,50,2023-10-27T11:00:00.000Z,,25.5,sig2');
    });

    it('should handle empty data when converting to CSV', () => {
        expect(convertToCSV([])).toBe('');
    });
});
