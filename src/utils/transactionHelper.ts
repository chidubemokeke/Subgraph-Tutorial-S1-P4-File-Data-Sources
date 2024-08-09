import { BigInt, ethereum, Bytes, log } from "@graphprotocol/graph-ts";
import {
  Account,
  AccountHistory,
  CovenToken,
  Transaction,
} from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  getOrCreateAccount,
  analyzeHistoricalData,
} from "../utils/accountHelper";
import {updateTransactionStatistics} from "../utils/helpers"
import { BIGINT_ZERO, ZERO_ADDRESS } from "./constant";
import { getGlobalId, getOrCreateCovenToken, getTokenId } from "./helpers";

// Define an enumeration for transaction types: TRADE and MINT
// Enum for Transaction Types
export enum TransactionType {
  TRADE = "TRADE",
  MINT = "MINT",
}


// This function creates or loads the Transaction entity on demand.
// It ensures that we accurately track each transaction associated with an account.
export function getOrCreateTransaction(
  event: ethereum.Event,
  accountId: string
): Transaction {
  // Generate the unique ID using the getGlobalId function that includes the account ID
  let transactionId = getGlobalId(event, accountId);

  // Try to load the Transaction entity with this ID
  let transaction = Transaction.load(transactionId);

  // If it doesn't exist, create a new Transaction entity with this ID
  if (!transaction) {
    transaction = new Transaction(transactionId);
    transaction.account = accountId; // Link the transaction to the account
    transaction.blockNumber = event.block.number; // Set the block number from the event
    transaction.blockTimestamp = event.block.timestamp; // Set the timestamp of the event
    transaction.type = TransactionType; // Initialize the type of transaction (e.g., TRADE, MINT)
    transaction.amount = BIGINT_ZERO; // Initialize the transaction amount
    transaction.isSuccessful = true; // Assume the transaction is successful unless flagged otherwise
  }

  // Return the Transaction entity, either loaded or newly created
  return transaction as Transaction;
}


// Helper function to handle Transfer events
export function createTransfer(event: TransferEvent): void {
  // Load or create account entities for 'from' and 'to' addresses
  let fromAccount = getOrCreateAccount(event.params.from); // Get or create the account entity for the sender
  let toAccount = getOrCreateAccount(event.params.to); // Get or create the account entity for the recipient

  // Get or create a TokenEvent entity based on the Transfer event
  let covenToken = getOrCreateCovenToken(event);

  let tokenId = event.params.tokenId; // Get the tokenId from the event
  covenToken.tokenId = tokenId; // Set the tokenId in the Transfer entity
  covenToken.save(); // Save the updated TokenEvent entity

  // Generate a unique transaction ID
  let transactionId = getGlobalId(event); // Create a unique ID

  // Determine the type of transaction (MINT if 'from' is zero address, otherwise TRADE)
  let transactionType: TransactionType = event.params.from.equals(ZERO_ADDRESS) // Check if the sender address is the zero address
    ? TransactionType.MINT // If true, the transaction type is MINT
    : TransactionType.TRADE; // If false, the transaction type is TRADE

  // Create or update transaction entity
  let transaction = loadOrCreateTransaction(transactionId, toAccount.id);
  covenToken.from = event.params.from;
  transaction.to = event.params.to;
  transaction.tokenId = event.params.tokenId;
  transaction.nft = transaction.id;
  transaction.blockNumber = event.block.number;
  transaction.blockTimestamp = event.block.timestamp;
  transaction.save();

  // Update account statistics
  if (event.params.from.equals(ZERO_ADDRESS)) {
    updateAccountStatistics(toAccount, true);
  } else {
    updateAccountStatistics(fromAccount, false, false);
    updateAccountStatistics(toAccount, false, true);
  }

  // Update account history
  updateAccountHistory(fromAccount, event);
  updateAccountHistory(toAccount, event);

  // Update account types
  updateAccountTypes(fromAccount);
  updateAccountTypes(toAccount);

  fromAccount.save();
  toAccount.save();
}

// This function creates or loads the Transaction entity on demand.
// It ensures that we accurately track each transaction associated with an account.
export function getOrCreateTransaction(
  event: ethereum.Event,
  accountId: string
): Transaction {
  // Generate the unique ID using the getGlobalId function that includes the account ID
  let transactionId = getGlobalId(event, accountId);

  // Try to load the Transaction entity with this ID
  let transaction = Transaction.load(transactionId);

  // If it doesn't exist, create a new Transaction entity with this ID
  if (!transaction) {
    transaction = new Transaction(transactionId);
    transaction.account = accountId; // Link the transaction to the account
    transaction.blockNumber = event.block.number; // Set the block number from the event
    transaction.blockHash = event.block.hash; // Set the block hash from the event
    transaction.txHash = event.transaction.hash; // Set the transaction hash
    transaction.timestamp = event.block.timestamp; // Set the timestamp of the event
    transaction.type = ""; // Initialize the type of transaction (e.g., TRADE, MINT)
    transaction.amount = BIGINT_ZERO; // Initialize the transaction amount
    transaction.isSuccessful = true; // Assume the transaction is successful unless flagged otherwise
  }

  // Return the Transaction entity, either loaded or newly created
  return transaction as Transaction;
}

// This helper function is designed to identify and assign transaction types
export function assignTransactionType(
  transaction: Transaction,
  event: ethereum.Event
): void {
  // Depending on the event, we determine the type of transaction
  // For example, based on event signatures, we might know if it’s a trade, mint, or other types.
  
  if (/* condition for TRADE */) {
    transaction.type = TransactionType.TRADE;
  } else if (/* condition for MINT */) {
    transaction.type = TransactionType.MINT;
  } else {
    transaction.type = "UNKNOWN"; // Default to unknown if the type can't be determined
  }

  transaction.save(); // Save the updated transaction with its type
}








// Helper function to handle OrdersMatched events
export function createOrdersMatched(event: OrdersMatchedEvent): void {
  // Get the token ID from the MintEvent parameters
  let tokenId = getTokenId(event);

  if (!tokenId) {
    log.error("Token ID not found for transaction hash: {} at log index: {}", [
      event.transaction.hash.toHexString(),
      event.logIndex.toString(),
    ]);
    return;
  }

  let previousOwner = getTokenOwner(event);

  // Determine buyer and seller addresses
  let buyerAddress = event.params.taker; // Address taking the action
  let sellerAddress = previousOwner; // Previous owner is the seller

  // If previousOwner is null, log an error and return
  if (sellerAddress === null) {
    log.error(
      "Previous owner not found for transaction hash: {} at log index: {}",
      [event.transaction.hash.toHexString(), event.logIndex.toString()]
    );
    return;
  }

  // Check if the sellerAddress is the zero address
  if (sellerAddress.equals(ZERO_ADDRESS)) {
    log.info("Airdrop detected for transaction hash: {} at log index: {}", [
      event.transaction.hash.toHexString(),
      event.logIndex.toString(),
    ]);
    sellerAddress = ZERO_ADDRESS; // Assign zero address if it's an airdrop
  }

  // Load or create account entities for buyer and seller
  let buyerAccount = getOrCreateAccount(buyerAddress);
  let sellerAccount = getOrCreateAccount(sellerAddress);

  let salePrice = event.params.price; // Get the sale price from the event parameters

  // Generate a unique transaction ID
  let transactionId = getGlobalId(event);

  // Create or update transaction entity
  let transaction = loadOrCreateTransaction(
    // Load or create the transaction entity
    transactionId, // Use the generated transaction ID
    buyerAccount.id, // Set the account ID of the buyer
    TransactionType.TRADE // Set the transaction type to TRADE
  );

  // Set transaction details from event parameters
  transaction.buyer = buyerAddress; // Set the buyer address
  transaction.seller = sellerAddress; // Set the seller address
  transaction.nftSalePrice = salePrice; // Set the NFT sale price
  transaction.blockNumber = event.block.number; // Set the block number
  transaction.blockTimestamp = event.block.timestamp; // Set the block timestamp

  // Save the transaction entity
  transaction.save();

  // Update transaction statistics
  updateTransactionStatistics(transaction, salePrice);

  // Update buyer and seller account statistics
  updateAccountStatistics(buyerAccount, false, true, salePrice); // Update buyer stats for a buy transaction
  updateAccountStatistics(sellerAccount, false, false, salePrice); // Update seller stats for a sale transaction

  // Update account types if needed
  updateAccountTypes(buyerAccount);
  updateAccountTypes(sellerAccount);
}
