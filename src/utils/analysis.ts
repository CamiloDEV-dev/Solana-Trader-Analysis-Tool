// This file contains helper functions for client-side data manipulation and formatting.

/**
 * Represents a single analyzed transaction row.
 */
export interface TransactionRow {
    wallet: string;
    type: 'buy' | 'sell';
    amount: number;
    date: string;
    isFirstBuy: boolean | null;
    sellPercentage: number | null;
    txSignature: string;
}

/**
 * Formats a number to a more readable string with commas.
 * @param num The number to format.
 * @returns A formatted string.
 */
export const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

/**
 * Formats an ISO date string to a more readable local date and time.
 * @param isoDate The ISO date string.
 * @returns A formatted date string.
 */
export const formatDate = (isoDate: string): string => {
    return new Date(isoDate).toLocaleString();
};

/**
 * Converts an array of transaction data into a CSV formatted string.
 * @param data The array of TransactionRow objects.
 * @returns A string in CSV format.
 */
export const convertToCSV = (data: TransactionRow[]): string => {
    if (data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers
                .map(fieldName => {
                    // @ts-ignore
                    const value = row[fieldName];
                    // Handle nulls and wrap strings with quotes in them
                    if (value === null) return '';
                    const stringValue = String(value);
                    return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
                })
                .join(',')
        ),
    ];

    return csvRows.join('\n');
};

/**
 * Triggers a file download in the browser.
 * @param content The content of the file.
 * @param fileName The name of the file to be downloaded.
 * @param contentType The MIME type of the file.
 */
export const downloadFile = (
    content: string,
    fileName: string,
    contentType: string
) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};
