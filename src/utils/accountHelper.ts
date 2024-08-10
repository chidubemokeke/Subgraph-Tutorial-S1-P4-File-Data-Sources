import { BigInt, ethereum, Address, Bytes } from "@graphprotocol/graph-ts";
import { Account, CovenToken } from "../../generated/schema";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  TRANSFER_EVENT_SIGNATURE_HASH,
} from "./constant";

// Enum for Transaction Types
export enum TransactionType {
  TRADE = 0,
  MINT = 1,
}

export function getOrCreateAccount(accountId: string): Account {
  // Attempt to load the account entity by its address
  let account = Account.load(accountId);

  if (!account) {
    // Create a new account entity if it does not exist
    account = new Account(accountId);
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
    account.activityCount = account.activityCount || BIGINT_ZERO;
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

/**
 * Analyzes account history based on transfer events and determines account types.
 * @param event The Ethereum event containing transaction logs.
 * @param accountId The ID of the account to analyze.
 */
export function analyzeAccountHistory(
  event: ethereum.Event,
  accountId: string
): void {
  // Load the account entity from the subgraph's data store using the provided accountId
  let account = Account.load(accountId);

  // If the account does not exist, exit the function as there's nothing to analyze
  if (!account) {
    return;
  }

  // Initialize counters to track the number of mints and sales for the account
  let totalMintCount = BIGINT_ZERO; // Counter for tokens minted by the account
  let totalBuyCount = BIGINT_ZERO; // Counter for tokens bought by the account (to be used if needed)
  let totalSaleCount = BIGINT_ZERO; // Counter for tokens sold by the account

  // Initialize an empty array to store transfer event objects if needed
  let transferEvents: CovenToken[] = [];

  // Loop through all logs in the transaction receipt to process each log entry
  for (let i = 0; i < event.receipt!.logs.length; i++) {
    // Access the current log entry from the transaction receipt
    let log = event.receipt!.logs[i];

    // Check if the log entry corresponds to a Transfer event by comparing the event signature hash
    if (log.topics[0].toHexString() == TRANSFER_EVENT_SIGNATURE_HASH) {
      // Extract 'from' address (sender) from the first topic (index 1)
      let from = Address.fromHexString(log.topics[1].toHexString());

      // Extract 'to' address (receiver) from the second topic (index 2)
      let to = Address.fromHexString(log.topics[2].toHexString());

      // Extract the tokenId from the log's data (first 32 bytes of data)
      let tokenIdBytes = log.data.subarray(0, 32) as Bytes; // First 32 bytes represent tokenId
      let tokenId = BigInt.fromUnsignedBytes(tokenIdBytes); // Convert bytes to BigInt

      // Extract the amount from the log's data (next 32 bytes after tokenId)
      let amount = log.data.subarray(32, 64) as Bytes; // Next 32 bytes represent amount
      let amountBigInt = BigInt.fromUnsignedBytes(amount); // Convert bytes to BigInt

      // Create a unique ID for this transfer event using the transaction hash and log index
      let uniqueId = event.transaction.hash
        .toHexString()
        .concat("-")
        .concat(i.toString());

      // Create a new CovenToken entity with the unique ID
      let transferEvent = new CovenToken(uniqueId);

      // Set the fields of the CovenToken entity with extracted values
      transferEvent.from = from.toHex(); // Address from which tokens were sent
      transferEvent.to = to.toHex(); // Address to which tokens were received
      transferEvent.tokenId = tokenId; // ID of the token being transferred
      transferEvent.amount = amountBigInt; // Amount of tokens transferred
      transferEvent.blockNumber = event.block.number; // Block number in which the transfer occurred
      transferEvent.blockHash = event.block.hash; // Block hash of the block in which the transfer occurred
      transferEvent.txHash = event.transaction.hash; // Transaction hash of the transfer
      transferEvent.timestamp = event.block.timestamp; // Timestamp of the block in which the transfer occurred

      // Add the decoded CovenToken object to the transferEvents array
      transferEvents.push(transferEvent);

      // Update counters based on whether the account is the sender or receiver
      if (from.toHex() == accountId) {
        // If the account is the sender, increment the sale count
        totalSaleCount = totalSaleCount.plus(amountBigInt);
      } else if (to.toHex() == accountId) {
        // If the account is the receiver, increment the mint count
        totalMintCount = totalMintCount.plus(amountBigInt);
      }
    }
  }

  // Determine the account type based on the aggregated counts

  // `isOG`: The account is classified as an "OG" if it has minted at least one token
  // and has not participated in buying or selling any tokens
  account.isOG =
    totalMintCount.ge(BIGINT_ONE) &&
    totalBuyCount.equals(BIGINT_ZERO) &&
    totalSaleCount.equals(BIGINT_ZERO);

  // `isCollector`: The account is classified as a "Collector" if it has minted at least one token
  // and has also bought at least one token, but has not sold any tokens
  account.isCollector =
    totalMintCount.ge(BIGINT_ONE) &&
    totalBuyCount.ge(BIGINT_ONE) &&
    totalSaleCount.equals(BIGINT_ZERO);

  // `isHunter`: The account is classified as a "Hunter" if it has minted at least one token
  // and has sold at least one token, but has not bought any tokens
  account.isHunter =
    totalMintCount.ge(BIGINT_ONE) &&
    totalSaleCount.ge(BIGINT_ONE) &&
    totalBuyCount.equals(BIGINT_ZERO);

  // `isFarmer`: The account is classified as a "Farmer" if it has minted at least one token
  // and has both bought and sold tokens
  account.isFarmer =
    totalMintCount.ge(BIGINT_ONE) &&
    totalSaleCount.ge(BIGINT_ONE) &&
    totalBuyCount.ge(BIGINT_ONE);

  // `isTrader`: The account is classified as a "Trader" if it has not minted any tokens
  // but has bought and sold at least one token
  account.isTrader =
    totalMintCount.equals(BIGINT_ZERO) &&
    totalSaleCount.ge(BIGINT_ONE) &&
    totalBuyCount.ge(BIGINT_ONE);

  // Save the updated Account entity back to the subgraph's data store
  // This persists the changes made to the account entity, including the determined account types
  account.save();
}

/**export function analyzeHistoricalData(accountId: string): void {
  // Load the account entity by its ID from the subgraph's data store
  // If the account doesn't exist (i.e., it hasn't been created), the function exits early
  let account = Account.load(accountId);

  // If no account was found, there's nothing to analyze, so we return immediately
  if (!account) {
    return;
  }

  // Initialize counters to track the total number of mint, buy, and sale events for the account
  let totalMintCount = BIGINT_ZERO; // Start with zero mints
  let totalBuyCount = BIGINT_ZERO; // Start with zero buys
  let totalSaleCount = BIGINT_ZERO; // Start with zero sales

  // This array is a placeholder for the events associated with the account's history
  // In a real scenario, this would contain the events you want to analyze
  let events: ethereum.Event[] = []; // We assume the events are available or retrieved from somewhere

 // Fetch MintEvents associated with this account
  let mintEvents = Transfer.load(accountId);
  for (let i = 0; i < mintEvents.length; i++) {
    let mintEvent = mintEvents[i];
    totalMintCount = totalMintCount.plus(mintEvent.mintCount);
  }
    // Generate a unique ID for this historical event related to the account
    // This ID ensures that each history record is unique, preventing overlap or conflicts
    let historyId = getGlobalId(event, accountId);

    // Load the corresponding AccountHistory entity using the unique history ID
    // This will retrieve the historical record for this specific event if it exists
    let history = AccountHistory.load(historyId);

    // If a historical record exists, update the counters by adding the event counts
    if (history) {
      totalMintCount = totalMintCount.plus(history.mintCount); // Add the mint count from this history to the total
      totalBuyCount = totalBuyCount.plus(history.buyCount); // Add the buy count from this history to the total
      totalSaleCount = totalSaleCount.plus(history.saleCount); // Add the sale count from this history to the total
    }
  }

  // Now that we have the total counts, we determine the account type
  // These boolean flags will be set based on whether the account meets certain criteria

  // OG: If the account has minted at least one token, it's an OG
  account.isOG =
    totalMintCount.ge(BIGINT_ONE) &&
    totalBuyCount.equals(BIGINT_ZERO) &&
    totalSaleCount.equals(BIGINT_ZERO);

  // Collector: If the account has minted and bought at least token, it's a Collector
  account.isCollector =
    totalMintCount.ge(BIGINT_ONE) &&
    totalBuyCount.ge(BIGINT_ONE) &&
    totalSaleCount.equals(BIGINT_ZERO);

  // Hunter: If the account has minted and sold at least one Token, it's a Hunter
  account.isHunter =
    totalMintCount.ge(BIGINT_ONE) &&
    totalSaleCount.ge(BIGINT_ONE) &&
    totalBuyCount.equals(BIGINT_ZERO);

  // Farmer: If the account has minted, bought, and sold at least one token, it's a Farmer
  account.isFarmer =
    totalMintCount.ge(BIGINT_ONE) &&
    totalSaleCount.ge(BIGINT_ONE) &&
    totalBuyCount.ge(BIGINT_ONE);

  // Trader: If the account has not minted any but sold and bought at least one token, it's a Trader
  account.isTrader =
    totalMintCount.equals(BIGINT_ZERO) &&
    totalSaleCount.ge(BIGINT_ONE) &&
    totalBuyCount.ge(BIGINT_ONE);

  // Finally, save the updated account entity back to the subgraph's data store
  // This persists the changes we made, including the determined account types
  account.save();
}**/
