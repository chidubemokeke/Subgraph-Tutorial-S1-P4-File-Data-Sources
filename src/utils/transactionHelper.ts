import { ethereum } from "@graphprotocol/graph-ts";
import { Transaction } from "../../generated/schema";
import { BIGINT_ZERO } from "./constant";
import { getGlobalId } from "./helpers";

// Define an enumeration for transaction types: TRADE and MINT
// Enum for Transaction Types
export enum TransactionType {
  TRADE = 0,
  MINT = 1,
}

// This function creates or loads the Transaction entity on demand.
// It ensures that we accurately track each transaction associated with an account.
// Function to create or load a Transaction entity
export function getOrCreateTransaction(
  event: ethereum.Event,
  type: TransactionType
): Transaction {
  // Generate a unique ID for the transaction based on the event and type
  let transactionId = getGlobalId(event);

  // Attempt to load the transaction entity using the generated ID
  let transaction = Transaction.load(transactionId);

  if (!transaction) {
    // If the transaction does not exist, create a new one
    transaction = new Transaction(transactionId);
    transaction.transactionType = type.toString(); // Convert enum to string // Set the type of transaction (e.g., "TRADE", "MINT")
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
