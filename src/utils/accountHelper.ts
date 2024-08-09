import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Account, AccountHistory, Transaction } from "../../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO } from "./constant";
import { getGlobalId } from "./helpers";

// Enum for Transaction Types
export enum TransactionType {
  TRADE = "TRADE",
  MINT = "MINT",
}

export function getOrCreateAccount(accountId: string): Account {
  // Attempt to load the account entity by its address
  let account = Account.load(accountId);

  if (!account) {
    // Create a new account entity if it does not exist
    account = new Account(accountId);
    account.activityCount = BIGINT_ZERO;
    account.mintCount = BIGINT_ZERO; // Initialize mint count
    account.buyCount = BIGINT_ZERO; // Initialize mint count
    account.saleCount = BIGINT_ZERO; // Initialize mint count
    account.totalAmountBought = BIGINT_ZERO; // Initialize total amount bought
    account.totalAmountSold = BIGINT_ZERO; // Initialize total amount sold
    account.totalAmountBalance = BIGINT_ZERO; // Initialize total balance
    account.blockNumber = BIGINT_ZERO; // Initialize block number
    account.blockTimestamp = BIGINT_ZERO; // Initialize block timestamp
    account.isOG = false; // Default to not being a collector
    account.isCollector = false; // Default to not being a collector
    account.isHunter = false; // Default to not being a hunter
    account.isFarmer = false; // Default to not being a farmer
    account.isTrader = false; // Default to not being a trader
  } else {
    // Ensure existing account fields are initialized
    account.activityCount = account.activityCount || BIGINT_ZERO;
    account.mintCount = account.mintCount || BIGINT_ZERO;
    account.buyCount = account.buyCount || BIGINT_ZERO;
    account.saleCount = account.saleCount || BIGINT_ZERO;
    account.totalAmountBought = account.totalAmountBought || BIGINT_ZERO;
    account.totalAmountSold = account.totalAmountSold || BIGINT_ZERO;
    account.totalAmountBalance || BIGINT_ZERO;
    account.blockNumber = account.blockNumber || BIGINT_ZERO;
    account.blockTimestamp = account.blockTimestamp || BIGINT_ZERO;
  }

  return account; // Return the loaded or newly created account entity
}

/**
 * Analyzes historical data to determine the account types.
 * @param accountId The ID of the account to analyze.
 */
export function analyzeHistoricalData(accountId: string): void {
  // Load the account entity by its ID from the subgraph's data store
  // If the account doesn't exist (i.e., it hasn't been created), the function exits early
  let account = Account.load(accountId);

  // If no account was found, there's nothing to analyze, so we return immediately
  if (!account) {
    return;
  }

  // Initialize counters to track the total number of mint, buy, and sale events for the account
  let totalMintCount = BIGINT_ZERO; // Start with zero mints
  let totalBuyCount = BIGINT_ZERO; // Start with zero buys
  let totalSaleCount = BIGINT_ZERO; // Start with zero sales

  // This array is a placeholder for the events associated with the account's history
  // In a real scenario, this would contain the events you want to analyze
  let events: ethereum.Event[] = []; // We assume the events are available or retrieved from somewhere

  // Loop through each event in the events array to process historical data
  for (let i = 0; i < events.length; i++) {
    let event = events[i]; // Get the current event in the loop

    // Generate a unique ID for this historical event related to the account
    // This ID ensures that each history record is unique, preventing overlap or conflicts
    let historyId = getGlobalId(event, accountId);

    // Load the corresponding AccountHistory entity using the unique history ID
    // This will retrieve the historical record for this specific event if it exists
    let history = AccountHistory.load(historyId);

    // If a historical record exists, update the counters by adding the event counts
    if (history) {
      totalMintCount = totalMintCount.plus(history.mintCount); // Add the mint count from this history to the total
      totalBuyCount = totalBuyCount.plus(history.buyCount); // Add the buy count from this history to the total
      totalSaleCount = totalSaleCount.plus(history.saleCount); // Add the sale count from this history to the total
    }
  }

  // Now that we have the total counts, we determine the account type
  // These boolean flags will be set based on whether the account meets certain criteria

  // OG: If the account has minted at least one token, it's an OG
  account.isOG =
    totalMintCount.ge(BIGINT_ONE) &&
    totalBuyCount.equals(BIGINT_ZERO) &&
    totalSaleCount.equals(BIGINT_ZERO);

  // Collector: If the account has minted and bought at least token, it's a Collector
  account.isCollector =
    totalMintCount.ge(BIGINT_ONE) &&
    totalBuyCount.ge(BIGINT_ONE) &&
    totalSaleCount.equals(BIGINT_ZERO);

  // Hunter: If the account has minted and sold at least one Token, it's a Hunter
  account.isHunter =
    totalMintCount.ge(BIGINT_ONE) &&
    totalSaleCount.ge(BIGINT_ONE) &&
    totalBuyCount.equals(BIGINT_ZERO);

  // Farmer: If the account has minted, bought, and sold at least one token, it's a Farmer
  account.isFarmer =
    totalMintCount.ge(BIGINT_ONE) &&
    totalSaleCount.ge(BIGINT_ONE) &&
    totalBuyCount.ge(BIGINT_ONE);

  // Trader: If the account has not minted any but sold and bought at least one token, it's a Trader
  account.isTrader =
    totalMintCount.equals(BIGINT_ZERO) &&
    totalSaleCount.ge(BIGINT_ONE) &&
    totalBuyCount.ge(BIGINT_ONE);

  // Finally, save the updated account entity back to the subgraph's data store
  // This persists the changes we made, including the determined account types
  account.save();
}
