import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Transaction } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import { getOrCreateAccount } from "../utils/accountHelper";
import { updateTransactionStatistics } from "../utils/helpers";
import { BIGINT_ZERO, BIGINT_ONE, ZERO_ADDRESS } from "./constant";
import { getGlobalId, getOrCreateCovenToken, getTokenId } from "./helpers";

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
