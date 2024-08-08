import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Account, AccountHistory, Transaction } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { BIGINT_ONE, BIGINT_ZERO } from "./constant";
import { getGlobalId } from "./helpers";

// Enum for Transaction Types
export enum TransactionType {
  TRADE = "TRADE",
  MINT = "MINT",
}

export function getOrCreateAccount(accountAddress: Bytes): Account {
  // Attempt to load the account entity by its address
  let account = Account.load(accountAddress.toHex());

  if (!account) {
    // Create a new account entity if it does not exist
    account = new Account(accountAddress.toHex());
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
    /** */ account.activityCount = account.activityCount || BIGINT_ZERO;
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

// Function to update account history with the new global ID function
export function updateAccountHistory(
  account: Account,
  event: TransferEvent
): void {
  let history = new AccountHistory(getGlobalId(event, account.id)); // Create a new account history entity with account-specific global ID
  history.account = account.id; // Set the account ID
  history.timestamp = event.block.timestamp; // Set the timestamp
  history.mintCount = account.mintCount; // Set the mint count
  history.buyCount = account.buyCount; // Set the buy count
  history.saleCount = account.saleCount; // Set the sale count
  history.blockHash = event.block.hash; // Set the block hash
  history.txHash = event.transaction.hash; // Set the transaction hash
  history.save(); // Save the new account history entity to the store
}

// Helper function to update account statistics
export function updateAccountStatistics(
  account: Account,
  isMint: boolean,
  isBuy: boolean = false,
  isSale: boolean = false
): void {
  if (isMint) {
    account.mintCount = account.mintCount.plus(BIGINT_ONE); // Increment mintCount if it's a mint transaction
  } else if (isBuy) {
    account.buyCount = account.buyCount.plus(BIGINT_ONE); // Increment buyCount if it's a purchase transaction
  } else if (isSale) {
    account.saleCount = account.saleCount.plus(BIGINT_ONE); // Increment saleCount if it's a sale transaction
  }
  account.activityCount = account.activityCount.plus(BIGINT_ONE); // Increment account activity count
}

// Function to analyze historical data
export function analyzeHistoricalData(accountId: string): void {
  let historyRecords = AccountHistory.load(accountId); // Load account history records

  // Persist and Initialize historical data counts for consistency and accurate data
  let mintCount = BIGINT_ZERO;
  let buyCount = BIGINT_ZERO;
  let saleCount = BIGINT_ZERO;

  // Aggregate historical data
  for (let i = 0; i < historyRecords.length; i++) {
    mintCount = mintCount.plus(historyRecords[i].mintCount); // Aggregate mint count
    buyCount = buyCount.plus(historyRecords[i].buyCount); // Aggregate buy count
    saleCount = saleCount.plus(historyRecords[i].saleCount); // Aggregate sale count
  }

  // Analyze historical data to determine account types
  let isOG =
    mintCount.gt(BIGINT_ZERO) &&
    buyCount.equals(BIGINT_ZERO) &&
    saleCount.equals(BIGINT_ZERO);
  let isCollector =
    (mintCount.gt(BIGINT_ZERO) || buyCount.gt(BIGINT_ZERO)) &&
    saleCount.equals(BIGINT_ZERO);
  let isHunter =
    mintCount.gt(BIGINT_ZERO) &&
    buyCount.equals(BIGINT_ZERO) &&
    saleCount.gt(BIGINT_ZERO);
  let isFarmer =
    mintCount.gt(BIGINT_ZERO) &&
    buyCount.gt(BIGINT_ZERO) &&
    saleCount.gt(BIGINT_ZERO);
  let isTrader =
    mintCount.equals(BIGINT_ZERO) &&
    (buyCount.gt(BIGINT_ZERO) || saleCount.gt(BIGINT_ZERO));

  // Update account with historical analysis
  let account = Account.load(accountId);
  if (account != null) {
    account.isOG = isOG; // Update isOG status
    account.isCollector = isCollector; // Update isCollector status
    account.isHunter = isHunter; // Update isHunter status
    account.isFarmer = isFarmer; // Update isFarmer status
    account.isTrader = isTrader; // Update isTrader status
    account.save(); // Save the updated account entity to the store
  }
}

// Function to update account types based on their activities
export function updateAccountTypes(account: Account): void {
  const mintCount = account.mintCount || BIGINT_ZERO; // Get mint count or default to zero
  const buyCount = account.buyCount || BIGINT_ZERO; // Get buy count or default to zero
  const saleCount = account.saleCount || BIGINT_ZERO; // Get sale count or default to zero

  // Update account types based on activities
  account.isOG =
    mintCount.gt(BIGINT_ZERO) &&
    buyCount.equals(BIGINT_ZERO) &&
    saleCount.equals(BIGINT_ZERO);
  account.isCollector =
    (mintCount.gt(BIGINT_ZERO) || buyCount.gt(BIGINT_ZERO)) &&
    saleCount.equals(BIGINT_ZERO);
  account.isHunter =
    mintCount.gt(BIGINT_ZERO) &&
    buyCount.equals(BIGINT_ZERO) &&
    saleCount.gt(BIGINT_ZERO);
  account.isFarmer =
    mintCount.gt(BIGINT_ZERO) &&
    buyCount.gt(BIGINT_ZERO) &&
    saleCount.gt(BIGINT_ZERO);
  account.isTrader =
    mintCount.equals(BIGINT_ZERO) &&
    (buyCount.gt(BIGINT_ZERO) || saleCount.gt(BIGINT_ZERO));

  account.save(); // Save the updated account entity to the store
}

// Helper function to update transaction statistics
export function updateTransactionStatistics(
  transaction: Transaction,
  salePrice: BigInt
): void {
  // Update the total sales volume by adding the current sale price
  transaction.totalSalesVolume = (
    transaction.totalSalesVolume || BIGINT_ZERO
  ).plus(salePrice);

  // Increment the total sales count by one
  transaction.totalSalesCount = (
    transaction.totalSalesCount || BIGINT_ZERO
  ).plus(BIGINT_ONE);

  // If the sale price is greater than the current highest sale price, update it
  if (salePrice.gt(transaction.highestSalePrice || BIGINT_ZERO)) {
    transaction.highestSalePrice = salePrice;
  }

  // If the sale price is less than the current lowest sale price or if it's the first sale, update it
  if (
    salePrice.lt(transaction.lowestSalePrice || BIGINT_ZERO) ||
    (transaction.lowestSalePrice || BIGINT_ZERO).equals(BIGINT_ZERO)
  ) {
    transaction.lowestSalePrice = salePrice;
  }

  // Calculate the average sale price if there are any sales
  if (transaction.totalSalesCount.gt(BIGINT_ZERO)) {
    transaction.averageSalePrice = transaction.totalSalesVolume.div(
      transaction.totalSalesCount
    );
  }

  // Save the updated transaction entity
  transaction.save();
}
