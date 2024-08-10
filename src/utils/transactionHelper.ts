import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Transaction } from "../../generated/schema";
import { BIGINT_ZERO, BIGINT_ONE } from "./constant";
import { getGlobalId } from "./helpers";

// Define an enumeration for transaction types: TRADE and MINT
// Enum for Transaction Types
export enum TransactionType {
  TRADE = "TRADE",
  MINT = "MINT",
}

// This function creates or loads the Transaction entity on demand.
// It ensures that we accurately track each transaction associated with an account.
// Function to create or load a Transaction entity
export function getOrCreateTransaction(
  event: ethereum.Event,
  type: string
): Transaction {
  // Generate a unique ID for the transaction based on the event and type
  let transactionId = getGlobalId(event, type);

  // Attempt to load the transaction entity using the generated ID
  let transaction = Transaction.load(transactionId);

  if (!transaction) {
    // If the transaction does not exist, create a new one
    transaction = new Transaction(transactionId);
    transaction.transactionType = type; // Set the type of transaction (e.g., "TRADE", "MINT")
    transaction.totalNFTsSold = BIGINT_ZERO; // Initialize total NFTs sold
    transaction.totalSalesVolume = BIGINT_ZERO; // Initialize total sales volume
    transaction.averageSalePrice = BIGINT_ZERO; // Initialize average sale price
    transaction.highestSalePrice = BIGINT_ZERO; // Initialize highest sale price
    transaction.lowestSalePrice = BIGINT_ZERO; // Initialize lowest sale price
    transaction.blockNumber = event.block.number; // Record block number
    transaction.blockTimestamp = event.block.timestamp; // Record block timestamp
  }

  // Return the loaded or newly created transaction entity
  return transaction;
}
// Function to update aggregated data for a Transaction entity
export function updateTransactionAggregates(
  transaction: Transaction,
  nftSalePrice: BigInt
): void {
  // Update transaction count by incrementing the current value by 1
  transaction.transactionCount = transaction.transactionCount.plus(BIGINT_ONE);

  // Update total sales volume by adding the current sale price to the existing volume
  transaction.totalSalesVolume =
    transaction.totalSalesVolume.plus(nftSalePrice);

  // Increment the total sales count by 1
  transaction.totalSalesCount = transaction.totalSalesCount.plus(BIGINT_ONE);

  // Update the average sale price by dividing the total sales volume by the total sales count
  if (transaction.totalSalesCount > BIGINT_ZERO) {
    transaction.averageSalePrice = transaction.totalSalesVolume.div(
      transaction.totalSalesCount
    );
  }

  // Update the highest sale price if the current sale price is greater than the existing highest price
  if (nftSalePrice > transaction.highestSalePrice) {
    transaction.highestSalePrice = nftSalePrice;
  }

  // Update the lowest sale price if it is zero (uninitialized) or if the current sale price is lower than the existing lowest price
  if (
    transaction.lowestSalePrice.equals(BIGINT_ZERO) ||
    nftSalePrice < transaction.lowestSalePrice
  ) {
    transaction.lowestSalePrice = nftSalePrice;
  }

  // Save the updated transaction entity back to the store
  transaction.save();
}
