import { ethereum } from "@graphprotocol/graph-ts";
import { Account, AccountHistory, Transaction } from "../../generated/schema";
import { BIGINT_ZERO } from "./constant";
import { getGlobalId, getTransactionType } from "./utils";

/**
 * Initializes a new Transaction entity based on the provided event, account, and transaction type.
 * This function sets up basic transaction details, including the transaction type, account association,
 * and relevant blockchain event details. Counters related to bids, whitelisting, and NFT sales are initialized
 * with default values.
 *
 * @param event - The Ethereum event that triggered the transaction.
 * @param account - The Account entity associated with the transaction.
 * @param transactionType - The type of transaction ("TRADE", "MINT", "TRANSFER").
 * @returns The initialized Transaction entity.
 */
export function initializeTransaction(
  event: ethereum.Event,
  transactionType: string
): Transaction {
  // Generate a unique ID for the transaction using the transaction hash and log index.
  // This ensures that each transaction has a distinct identifier.
  let transaction = new Transaction(getGlobalId(event));

  // Associate the transaction with the account entity by setting the account ID.
  transaction.account = account.id;

  // Set the type of transaction, such as "TRADE", "MINT", or "TRANSFER".
  // The function getTransactionType ensures the transaction type is valid.
  transaction.transactionType = getTransactionType(transactionType);

  // Initialize counters and flags for additional transaction-related metrics.
  // These are initialized to zero or false, providing a default starting state.
  transaction.nftSalePrice = BIGINT_ZERO;
  transaction.totalNFTsSold = BIGINT_ZERO;
  transaction.totalSalesVolume = BIGINT_ZERO; // Default NFT sale price set to zero.
  transaction.averageSalePrice = BIGINT_ZERO; // Default total NFTs sold set to zero.
  transaction.totalSalesCount = BIGINT_ZERO;
  transaction.highestSalePrice = BIGINT_ZERO;
  transaction.lowestSalePrice = BIGINT_ZERO;

  // Record the event details, such as log index, transaction hash, block number, and timestamp.
  // This information is crucial for tracking when and where the transaction occurred on the blockchain.
  transaction.logIndex = event.logIndex;
  transaction.txHash = event.transaction.hash;
  transaction.blockNumber = event.block.number;
  transaction.blockTimestamp = event.block.timestamp;

  // Return the fully initialized Transaction entity.
  // This entity is now ready to be saved and associated with other relevant data.
  return transaction;
}

/**
 * Records the transaction history for a given account by creating a new AccountHistory entity.
 * This entity captures the state of the account at the time of the event, including transaction counts
 * and the details of the event (log index, transaction hash, block number, and timestamp).
 *
 * @param account - The Account entity whose history is being recorded.
 * @param event - The Ethereum event that triggered the transaction.
 */
export function recordTransactionHistory(
  account: Account,
  event: ethereum.Event
): void {
  // Generate a unique ID for the history entry using the transaction hash and log index.
  let history = new AccountHistory(getGlobalId(event));

  // Associate the history entry with the account.
  history.history = account.id;

  // Record the transaction sender (owner) and account transaction counts.
  history.owner = event.transaction.from;
  history.mintCount = account.mintCount;
  history.buyCount = account.buyCount;
  history.saleCount = account.saleCount;

  // Record the details of the Ethereum event (log index, transaction hash, block number, and timestamp).
  history.logIndex = event.logIndex;
  history.txHash = event.transaction.hash;
  history.blockNumber = event.block.number;
  history.blockTimestamp = event.block.timestamp;

  // Save the AccountHistory entity to the store.
  history.save();
}
