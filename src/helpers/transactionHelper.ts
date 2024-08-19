import { ethereum, Bytes, log } from "@graphprotocol/graph-ts";
import { Transaction } from "../../generated/schema";
import { BIGINT_ZERO, BIGDECIMAL_ZERO, ordersMatchedSig } from "./constant";
import { getTransactionId } from "./utils";

/**
 * Creates or updates a Transaction entity using only the getTransactionId.
 *
 * @param event - The Ethereum event object containing transaction details.
 */
export function createOrUpdateTransaction(event: ethereum.Event): Transaction {
  // Generate the ID using the transaction hash and log index
  let id = getTransactionId(event.transaction.hash, event.logIndex);

  // Load the existing Transaction entity, or create a new one if it doesn't exist.
  let transaction = Transaction.load(id);

  if (transaction == null) {
    // If the transaction doesn't exist, create a new entity.
    transaction = new Transaction(id);
  }

  // Initialize or update other fields here as required.
  transaction.txHash = event.transaction.hash;
  transaction.logIndex = event.logIndex;
  transaction.blockNumber = event.block.number;
  transaction.blockTimestamp = event.block.timestamp;

  // Additional fields can be initialized or updated here
  transaction.account = transaction.id;
  transaction.referenceId = "";
  transaction.buyer = Bytes.empty();
  transaction.seller = Bytes.empty();
  transaction.nftSalePrice = BIGINT_ZERO;
  transaction.totalNFTsSold = BIGINT_ZERO;
  transaction.totalSalesVolume = BIGINT_ZERO;
  transaction.averageSalePrice = BIGDECIMAL_ZERO;
  transaction.totalSalesCount = BIGINT_ZERO;
  transaction.highestSalePrice = BIGINT_ZERO;
  transaction.lowestSalePrice = BIGINT_ZERO;

  // Save the Transaction entity.
  transaction.save();

  return transaction as Transaction;
}

/**
 * Processes the transaction receipt associated with the given event to determine if
 * an `OrdersMatched` event occurs after the current event within the same transaction.
 *
 * @param event - The Ethereum event to be processed.
 * @returns A boolean indicating whether an `OrdersMatched` event is found after the current event.
 */
export function processTransactionReceipt(event: ethereum.Event): boolean {
  // Define the keccak256 hash of the `OrdersMatched` event signature.
  const ordersMatched = ordersMatchedSig;

  // Check if the event has an associated transaction receipt.
  if (!event.receipt) {
    log.warning("[handleTransfer][{}] has no event.receipt", [
      event.transaction.hash.toHexString(),
    ]);

    // Exit early if no receipt is available since there are no logs to process.
    return false;
  }

  // Get the current event's log index to identify its position within the transaction logs.
  const currentEventLogIndex = event.logIndex;

  // Retrieve all logs associated with the transaction from the receipt.
  const logs = event.receipt!.logs;

  // Initialize a variable to store the index of the current event log within the logs array.
  let foundIndex = -1;

  // Iterate through the logs to find the index of the current event's log.
  for (let i = 0; i < logs.length; i++) {
    const currLog = logs[i];

    // If the log index matches the current event's log index, store the index and break the loop.
    if (currLog.logIndex.equals(currentEventLogIndex)) {
      foundIndex = i;
      break;
    }
  }

  // Check if we found the current event's log and if there are at least 5 logs after it.
  // The assumption is that the `OrdersMatched` event may follow the current event after 5 logs.
  if (foundIndex >= 0 && foundIndex + 5 < logs.length) {
    // Retrieve the log that occurs 5 positions after the current event's log.
    const nextLog = logs[foundIndex + 5];
    // Extract the first topic (topic0) from the next log, which contains the event signature.
    const topic0Sig = nextLog.topics[0];

    // Compare the topic0 of the next log with the `OrdersMatched` signature.
    if (topic0Sig.equals(ordersMatchedSig)) {
      // If they match, the `OrdersMatched` event is found.
      return true;
    }
  }

  // If no `OrdersMatched` event is found after the current event, return false.
  return false;
}

/**
 * Records the transaction history for a given account by creating a new AccountHistory entity.
 * This entity captures the state of the account at the time of the event, including transaction counts,
 * account type, and the details of the event (log index, transaction hash, block number, and timestamp).
 *
 * @param account - The Account entity whose history is being recorded.
 * @param event - The Ethereum event that triggered the transaction.

export function recordTransactionHistory(
  account: Account,
  event: ethereum.Event
): void {
  // Generate a unique ID for the history entry using the transaction hash and log index.
  let history = new AccountHistory(getTransactionId(event));

  // Associate the history entry with the account.
  history.history = account.id;

  // Record the transaction sender (owner) and account transaction counts.
  history.owner = event.transaction.from;
  history.mintCount = account.mintCount;
  history.buyCount = account.buyCount;
  history.saleCount = account.saleCount;

  // Determine the account type at the time of the history record.
  history.accountType = determineAccountType(account);

  // Record the details of the Ethereum event (log index, transaction hash, block number, and timestamp).
  history.logIndex = event.logIndex;
  history.txHash = event.transaction.hash;
  history.blockNumber = event.block.number;
  history.blockTimestamp = event.block.timestamp;

  // Save the AccountHistory entity to the store.
  history.save();
}*/

/**
 * Determines the type of transaction (MINT, TRADE, or TRANSFER) based on the TransferEvent.
 *
 * @param event - The TransferEvent emitted by the contract.
 * @returns - A TransactionType indicating the type of transaction.
 
export function getTransactionType(event: TransferEvent): TransactionType {
  // Check if the `from` address in the event is the zero address.
  // If so, it indicates that this transaction is a mint (i.e., the creation of a new token).
  let isMint = event.params.from == ZERO_ADDRESS;

  // If the transaction is a mint, return the TransactionType.MINT enum value.
  if (isMint) {
    return TransactionType.MINT;
  } else {
    // If the transaction is not a mint, retrieve the transaction receipt to check the logs.
    let receipt = event.receipt;

    // Ensure that the receipt is not null (i.e., the receipt exists).
    if (receipt) {
      // Loop through each log entry in the transaction receipt.
      for (let i = 0; i < receipt.logs.length; i++) {
        let currLog = receipt.logs[i];

        // Check if the current log has topics (a non-empty list of topics).
        // The first topic (topics[0]) should be compared against the OrdersMatched event signature.
        if (
          currLog.topics.length > 0 &&
          currLog.topics[0].equals(ORDERS_MATCHED_SIG)
        ) {
          // If the log's first topic matches the OrdersMatched signature, this transaction is a trade/sale.
          // Return the TransactionType.TRADE enum value.
          return TransactionType.TRADE;
        }
      }
    }

    // If the transaction is not a mint and there are no logs indicating a trade/sale,
    // then the transaction is classified as a simple transfer.
    // Return the TransactionType.TRANSFER enum value.
    return TransactionType.TRANSFER;
  }
}*/
