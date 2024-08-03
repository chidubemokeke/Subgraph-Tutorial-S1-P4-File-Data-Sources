import { BigInt, Bytes } from "@graphprotocol/graph-ts";
// Import necessary types from The Graph protocol

import { Account, Transaction, NFT } from "../../generated/schema";
// Import schema entities: Account, Transaction, and NFT

import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
// Import Transfer event type from CryptoCoven contract

import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
// Import OrdersMatched event type from Opensea contract

import { getOrCreateAccount, updateAccountTypes } from "../utils/accountHelper";
// Import helper function to get or create an Account entity

import { BIGINT_ZERO, BIGINT_ONE, ZERO_ADDRESS } from "./constant";
import { updateTransactionStatistics } from "./logic";
// Import constants used in the code

// Enum for Transaction Types
export enum TransactionType {
  TRADE = "TRADE",
  MINT = "MINT",
}
// Define an enumeration for transaction types: TRADE and MINT

// Helper function to load or create a Transaction entity
export function loadOrCreateTransaction(
  id: string,
  accountId: string,
  type: TransactionType
): Transaction {
  // Attempt to load the transaction entity by its ID
  let transaction = Transaction.load(id);

  if (!transaction) {
    // Create a new transaction entity if it does not exist
    transaction = new Transaction(id);
    transaction.account = accountId; // Set the account ID
    transaction.type = type; // Set the transaction type (MINT or TRADE)
    transaction.from = Bytes.empty(); // Initialize 'from' address
    transaction.to = Bytes.empty(); // Initialize 'to' address
    transaction.tokenId = BigInt.fromI32(0); // Initialize token ID
    transaction.buyer = Bytes.empty(); // Initialize buyer address
    transaction.seller = Bytes.empty(); // Initialize seller address
    transaction.nft = ""; // Initialize NFT information
    transaction.nftSalePrice = BigInt.fromI32(0); // Initialize sale price
    transaction.totalSold = BigInt.fromI32(0); // Initialize total sold amount
    transaction.blockNumber = BigInt.fromI32(0); // Initialize block number
    transaction.blockTimestamp = BigInt.fromI32(0); // Initialize block timestamp
    transaction.totalSalesVolume = BigInt.fromI32(0); // Initialize total sales volume
    transaction.averageSalePrice = BigInt.fromI32(0); // Initialize average sale price
    transaction.totalSalesCount = BigInt.fromI32(0); // Initialize total sales count
    transaction.highestSalePrice = BigInt.fromI32(0); // Initialize highest sale price
    transaction.lowestSalePrice = BigInt.fromI32(0); // Initialize lowest sale price
    transaction.save(); // Save the new transaction entity
  }

  return transaction; // Return the loaded or newly created transaction entity
}

export function handleTransfer(event: TransferEvent): void {
  // Load or create account entities for 'from' and 'to' addresses
  let fromAccount = getOrCreateAccount(event.params.from); // Get or create the account entity for the sender
  let toAccount = getOrCreateAccount(event.params.to); // Get or create the account entity for the recipient

  // Get the token ID from the event parameters
  let tokenId = event.params.tokenId.toHex(); // Convert the token ID to a hexadecimal string

  // Generate a unique transaction ID based on the transaction hash and token ID
  let transactionId = event.transaction.hash.toHex() + "-" + tokenId; // Create a unique ID by concatenating the transaction hash and token ID

  // Determine the type of transaction (MINT if 'from' is zero address, otherwise TRADE)
  let transactionType: TransactionType = event.params.from.equals(ZERO_ADDRESS) // Check if the sender address is the zero address
    ? TransactionType.MINT // If true, the transaction type is MINT
    : TransactionType.TRADE; // If false, the transaction type is TRADE

  // Create or update transaction entity
  let transaction = loadOrCreateTransaction(
    // Load or create the transaction entity
    transactionId, // Use the generated transaction ID
    toAccount.id, // Set the account ID of the recipient
    transactionType // Set the determined transaction type
  );

  // Set transaction details from event parameters
  transaction.from = event.params.from; // Set the 'from' address
  transaction.to = event.params.to; // Set the 'to' address
  transaction.tokenId = event.params.tokenId; // Set the token ID
  transaction.blockNumber = event.block.number; // Set the block number
  transaction.blockTimestamp = event.block.timestamp; // Set the block timestamp

  // Update account statistics based on transaction type
  if (transactionType == TransactionType.MINT) {
    toAccount.mintCount = (toAccount.mintCount || BIGINT_ZERO).plus(BIGINT_ONE); // Increment the mint count for the recipient account
  }

  // Save the updated account and transaction entities
  updateAccountTypes(fromAccount);
  updateAccountTypes(toAccount); // Save the sender account entity
  transaction.save(); // Save the transaction entity
}

// Event handler for OrdersMatched events
export function handleOrdersMatched(event: OrdersMatchedEvent): void {
  // Determine buyer and seller addresses
  let buyerAddress = event.params.taker; // Initially set the buyer address to the taker address from the event parameters
  let sellerAddress = event.params.maker; // Initially set the seller address to the maker address from the event parameters

  // If maker is not zero address, update buyer and seller addresses
  if (!sellerAddress.equals(ZERO_ADDRESS)) {
    buyerAddress = event.params.taker; // If the maker address is not the zero address, update the buyer address
    sellerAddress = event.params.maker; // If the maker address is not the zero address, update the seller address
  }

  // Load or create account entities for buyer and seller
  let buyerAccount = getOrCreateAccount(buyerAddress); // Get or create the account entity for the buyer
  let sellerAccount = getOrCreateAccount(sellerAddress); // Get or create the account entity for the seller

  // Get the token ID from the event parameters
  let tokenId = event.params.tokenId.toHex(); // Convert the token ID to a hexadecimal string

  // Get the sale price from the event parameters
  let salePrice = event.params.price; // Get the sale price from the event parameters

  // Generate a unique transaction ID based on the transaction hash and token ID
  let transactionId = event.transaction.hash.toHex() + "-" + tokenId; // Create a unique ID by concatenating the transaction hash and token ID

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
  transaction.tokenId = event.params.tokenId; // Set the token ID
  transaction.nftSalePrice = salePrice; // Set the NFT sale price
  transaction.blockNumber = event.block.number; // Set the block number
  transaction.blockTimestamp = event.block.timestamp; // Set the block timestamp
  buyerAccount.buyCount = (buyerAccount.buyCount || BIGINT_ZERO).plus(
    BIGINT_ONE
  );
  buyerAccount.totalAmountBought = (
    buyerAccount.totalAmountBought || BIGINT_ZERO
  ).plus(salePrice);

  sellerAccount.saleCount = (sellerAccount.saleCount || BIGINT_ZERO).plus(
    BIGINT_ONE
  );
  sellerAccount.totalAmountSold = (
    sellerAccount.totalAmountSold || BIGINT_ZERO
  ).plus(salePrice);

  updateTransactionStatistics(transaction, salePrice);
  updateAccountTypes(buyerAccount);
  updateAccountTypes(sellerAccount);
}

// Update sale counts and total amounts for buyer and seller
/* buyerAccount.buyCount = (buyerAccount.buyCount || BIGINT_ZERO).plus(
    BIGINT_ONE
  ); // Increment the buy count for the buyer
  buyerAccount.totalAmountBought = (
    buyerAccount.totalAmountBought || BIGINT_ZERO
  ).plus(salePrice); // Add the sale price to the total amount bought by the buyer

  sellerAccount.saleCount = (sellerAccount.saleCount || BIGINT_ZERO).plus(
    BIGINT_ONE
  ); // Increment the sale count for the seller
  sellerAccount.totalAmountSold = (
    sellerAccount.totalAmountSold || BIGINT_ZERO
  ).plus(salePrice); // Add the sale price to the total amount sold by the seller

  // Update transaction statistics
  transaction.totalSalesVolume = (
    transaction.totalSalesVolume || BIGINT_ZERO
  ).plus(salePrice); // Add the sale price to the total sales volume
  transaction.totalSalesCount = (
    transaction.totalSalesCount || BIGINT_ZERO
  ).plus(BIGINT_ONE); // Increment the total sales count

  // Update highest and lowest sale prices
  if (salePrice.gt(transaction.highestSalePrice || BIGINT_ZERO)) {
    // If the sale price is greater than the current highest sale price
    transaction.highestSalePrice = salePrice; // Update the highest sale price
  }
  if (
    salePrice.lt(transaction.lowestSalePrice || BIGINT_ZERO) || // If the sale price is lower than the current lowest sale price
    (transaction.lowestSalePrice || BIGINT_ZERO).equals(BIGINT_ZERO) // Or if the current lowest sale price is zero
  ) {
    transaction.lowestSalePrice = salePrice; // Update the lowest sale price
  }

  // Calculate and update the average sale price
  if (transaction.totalSalesCount.gt(BIGINT_ZERO)) {
    // If the total sales count is greater than zero
    transaction.averageSalePrice = transaction.totalSalesVolume.div(
      transaction.totalSalesCount
    ); // Calculate the average sale price by dividing the total sales volume by the total sales count
  }

  // Save the updated account and transaction entities
  buyerAccount.save(); // Save the buyer account entity
  sellerAccount.save(); // Save the seller account entity
  transaction.save(); // Save the transaction entity
}**/
