# Solana Trader Analysis Tool

This is a web application designed to fetch, analyze, and display historical transaction data for a given Solana SPL token address. It allows users to filter transactions by date, type, and amount, and provides insights into the behavior of individual wallets.

## Features

-   **Transaction Analysis:** Analyze transactions for any SPL token.
-   **Timeframe Selection:** Filter transactions within a specific date range.
-   **Transaction Type Filtering:** View buyers, sellers, or both.
-   **Token Amount Filtering:** Specify a minimum and maximum token amount for transactions.
-   **First Buy Detection:** Identifies a wallet's first purchase of a token within the selected timeframe.
-   **Sell Percentage Calculation:** Calculates the percentage of a wallet's holdings sold in a single transaction.
-   **Sortable Results:** Sort the transaction data by any column.
-   **CSV Export:** Download the filtered data as a CSV file.

## Tech Stack

-   **Frontend:** React, Vite, Tailwind CSS
-   **Backend:** Node.js, Express (run as a Vercel Serverless Function)
-   **API:** Helius API for Solana blockchain data

## Project Structure

/├── api/│   └── analyze.ts        # Serverless function for data analysis├── src/│   ├── components/       # React components (optional)│   ├── utils/│   │   ├── analysis.ts     # Client-side analysis helpers│   │   ├── analysis.test.ts# Jest tests for analysis helpers│   │   └── helius.ts       # Helius API interaction logic│   ├── App.tsx             # Main React application component│   ├── index.css           # Tailwind CSS styles│   └── main.tsx            # React entry point├── .env.local              # Environment variables├── package.json├── tsconfig.json└── README.md
## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd solana-trader-analysis-tool
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add your Helius API key:

    ```
    VITE_HELIUS_API_KEY=your_helius_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, and the application will be available at `http://localhost:5173`. The serverless function will be accessible through the development server as well.

## Usage

1.  **Enter the SPL Token contract address** you want to analyze.
2.  **Select a date range** for the analysis.
3.  **Set the maximum number of wallets** to display.
4.  **Apply filters** for transaction type and token amount.
5.  **Click "Fetch & Analyze"** to retrieve and process the data.
6.  The results will be displayed in a table. You can **sort the data** by clicking on the table headers.
7.  Click **"Download as CSV"** to export the current view.

## Deployment

This application is structured for easy deployment on [Vercel](https://vercel.com/).

1.  Push your code to a Git repository (e.g., GitHub, GitLab).
2.  Import the repository into your Vercel account.
3.  Vercel will automatically detect the Vite frontend and the serverless function in the `/api` directory.
4.  Add your `HELIUS_API_KEY` as an environment variable in the Vercel project settings.
5.  Deploy!
