import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Transaction, CovenToken } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  getOrCreateAccount,
  updateAccountTypes,
  updateTransactionStatistics,
} from "../utils/accountHelper";
import { BIGINT_ZERO, BIGINT_ONE, ZERO_ADDRESS } from "./constant";
import {
  getGlobalId,
  getOrCreateMintEvent,
  getOrCreateCovenToken,
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
    transaction.type = type; // Set the transaction type (MINT or TRADE)
    transaction.from = Bytes.empty(); // Initialize 'from' address
    transaction.to = Bytes.empty(); // Initialize 'to' address
    transaction.buyer = Bytes.empty(); // Initialize buyer address
    transaction.seller = Bytes.empty(); // Initialize seller address
    transaction.nft = transaction.id; // Initialize NFT information
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

export function handleTransfer(event: TransferEvent): void {
  // Load or create account entities for 'from' and 'to' addresses
  let fromAccount = getOrCreateAccount(event.params.from); // Get or create the account entity for the sender
  let toAccount = getOrCreateAccount(event.params.to); // Get or create the account entity for the recipient

  // Get or create a MintEvent entity based on the Transfer event
  let mintEvent = getOrCreateMintEvent(event);

  let tokenId = event.params.tokenId; // Get the tokenId from the event
  mintEvent.tokenId = tokenId; // Set the tokenId in the MintEvent entity
  mintEvent.save(); // Save the updated MintEvent entity

  // Generate a unique transaction ID based on the transaction hash and token ID
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
