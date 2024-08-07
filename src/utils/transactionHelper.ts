import { Bytes, log } from "@graphprotocol/graph-ts";
import { Transaction } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  getOrCreateAccount,
  updateAccountStatistics,
  updateAccountTypes,
  updateTransactionStatistics,
} from "../utils/accountHelper";
import { BIGINT_ZERO, ZERO_ADDRESS } from "./constant";
import {
  getGlobalId,
  getOrCovenTracker,
  getTokenId,
  getTokenOwner,
} from "./tokenHelper";

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
    transaction.buyer = Bytes.empty(); // Initialize buyer address
    transaction.seller = Bytes.empty(); // Initialize seller address
    transaction.tokenId = BIGINT_ZERO; // Initialize NFT information
    transaction.nftSalePrice = BIGINT_ZERO; // Initialize sale price
    transaction.totalSold = BIGINT_ZERO; // Initialize total sold amount
    transaction.blockNumber = BIGINT_ZERO; // Initialize block number
    transaction.blockTimestamp = BIGINT_ZERO; // Initialize block timestamp
    transaction.totalSalesVolume = BIGINT_ZERO; // Initialize total sales volume
    transaction.averageSalePrice = BIGINT_ZERO; // Initialize average sale price
    transaction.totalSalesCount = BIGINT_ZERO; // Initialize total sales count
    transaction.highestSalePrice = BIGINT_ZERO; // Initialize highest sale price
    transaction.lowestSalePrice = BIGINT_ZERO; // Initialize lowest sale price
    transaction.save(); // Save the new transaction entity
  }

  return transaction; // Return the loaded or newly created transaction entity
}

// Helper function to handle Transfer events
export function createTransfer(event: TransferEvent): void {
  // Load or create account entities for 'from' and 'to' addresses
  let fromAccount = getOrCreateAccount(event.params.from); // Get or create the account entity for the sender
  let toAccount = getOrCreateAccount(event.params.to); // Get or create the account entity for the recipient

  // Get or create a TokenEvent entity based on the Transfer event
  let tokenEvent = getOrCovenTracker(event);

  let tokenId = event.params.tokenId; // Get the tokenId from the event
  tokenEvent.tokenId = tokenId; // Set the tokenId in the MintEvent entity
  tokenEvent.save(); // Save the updated TokenEvent entity

  // Generate a unique transaction ID
  let transactionId = getGlobalId(event); // Create a unique ID

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
  transaction.nft = transaction.id; //
  transaction.blockNumber = event.block.number; // Set the block number
  transaction.blockTimestamp = event.block.timestamp; // Set the block timestamp

  // Update account statistics based on transaction type
  if (event.params.from == ZERO_ADDRESS) {
    updateAccountStatistics(toAccount, true);
  } else {
    updateAccountStatistics(fromAccount, false);
    updateAccountStatistics(toAccount, false);
  }

  // Save the updated account and transaction entities
  updateAccountTypes(fromAccount);
  updateAccountTypes(toAccount); // Save the sender account entity

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
