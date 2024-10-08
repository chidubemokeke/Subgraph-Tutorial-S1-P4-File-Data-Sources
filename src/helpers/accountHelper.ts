import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Account, AccountHistory, Transaction } from "../../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO } from "./constant";

/**
 * This function is responsible for loading an Account entity from the store using its ID.
 * If the Account doesn't exist, it creates a new Account entity and initializes its fields.
 *
 * @param accountId - The unique identifier for the account, typically the user's address.
 * @returns The loaded or newly created Account entity.
 */
export function loadOrCreateAccount(accountId: Bytes): Account {
  // Attempt to load the account from the Graph store using the accountId.
  let account = Account.load(accountId.toHex());

  // If the account doesn't exist (i.e., it's null), we create a new one.
  if (!account) {
    account = new Account(accountId.toHex());

    // Initialize transaction-related fields to zero. These fields track the number of different types of transactions.
    account.transactionCount = BIGINT_ZERO;
    account.mintCount = BIGINT_ZERO;
    account.buyCount = BIGINT_ZERO;
    account.saleCount = BIGINT_ZERO;

    // Initialize financial-related fields to zero. These fields track the amount of tokens bought, sold, and the current balance.
    account.totalAmountBought = BIGINT_ZERO;
    account.totalAmountSold = BIGINT_ZERO;
    account.totalAmountBalance = BIGINT_ZERO;

    // Initialize boolean fields to false. These fields determine the account type (OG, Collector, etc.).
    account.isOG = false;
    account.isCollector = false;
    account.isHunter = false;
    account.isFarmer = false;
    account.isTrader = false;

    // Initialize transaction details to zero or empty values. These fields store the transaction metadata.
    account.logIndex = BIGINT_ZERO;
    account.txHash = Bytes.empty();
    account.blockNumber = BIGINT_ZERO;
    account.blockTimestamp = BIGINT_ZERO;
    account.save(); // Save the newly created account to the store.
  }
  return account; // Return the loaded or newly created account.
}

/**
 * This function creates a new AccountHistory entity to record a snapshot of the Account's state.
 * AccountHistory is a log that stores historical data for each transaction.
 *
 * @param account - The current state of the Account entity.
 * @param accountType - The type of the account (e.g., OG, Collector) at the time of this history entry.
 
export function createAccountHistory(account: Account): void {
  // Generate a unique ID for the AccountHistory entity. This ID is a combination of the account ID and the transaction count.
  let historyId = account.id + "-" + account.transactionCount.toString();

  // Create a new AccountHistory entity with the generated ID.
  let accountHistory = new AccountHistory(historyId);

  // Link the AccountHistory to the corresponding Account entity.
  accountHistory.history = account.id;

  // Record the owner of the account at the time this history entry was made.
  accountHistory.owner = Bytes.fromHexString(account.id);

  // Store the transaction counts and account type from the Account entity at the time of this history entry.
  accountHistory.mintCount = account.mintCount;
  accountHistory.buyCount = account.buyCount;
  accountHistory.saleCount = account.saleCount;

  // Copy the transaction metadata from the Account entity to the AccountHistory entity.
  accountHistory.logIndex = account.logIndex;
  accountHistory.txHash = account.txHash;
  accountHistory.blockNumber = account.blockNumber;
  accountHistory.blockTimestamp = account.blockTimestamp;

  // Save the AccountHistory entity to the store.
  // The history is saved immediately because it's a complete record of a past state.
  accountHistory.save();
}*/

/**
 * This function updates the transaction counts in the Account entity based on the transaction type.
 * The function increases the appropriate counters based on whether the transaction was a MINT, TRADE, or Transfer.
 *
 * @param account - The Account entity to be updated.
 * @param transactionType - The type of transaction that occurred (e.g., "MINT", "TRADE", "Transfer").
 * @param isBuyer - A boolean indicating whether the account is the buyer in a TRADE transaction.
 */
export function updateTransactionCounts(
  account: Account,
  transactionType: string,
  isBuyer: boolean = false // Default to false to maintain backward compatibility
): void {
  // If the transaction is a MINT, increment the mintCount.
  if (transactionType == "MINT") {
    account.mintCount = account.mintCount.plus(BIGINT_ONE);
  }
  // If the transaction is a TRADE, increment the buyCount if the account is the buyer, otherwise increment the sellCount.
  else if (transactionType == "TRADE") {
    if (isBuyer) {
      account.buyCount = account.buyCount.plus(BIGINT_ONE);
    } else {
      account.saleCount = account.saleCount.plus(BIGINT_ONE);
    }
  }
  // If the transaction is a Transfer, increment the transactionCount.
  else if (transactionType == "Transfer") {
    account.transactionCount = account.transactionCount.plus(BIGINT_ONE);
  }

  // Increment the overall transactionCount in any case.
  account.transactionCount = account.transactionCount.plus(BIGINT_ONE);
  account.save;
}

/**
 * Function to determine the account type based on transaction history.
 *
 * This function increments the counts for different transaction types (MINT, TRADE, TRANSFER)
 * in the Account entity. These counts are used later to categorize the account type.
 *
 * @param account - The Account entity being updated.
 * @param transaction - The Transaction entity containing the transaction details.
 */
export function determineAccountType(
  account: Account,
  transaction: Transaction
): void {
  // Incrementing the respective count based on the transaction type
  if (transaction.transactionType == "MINT") {
    // If the transaction is a MINT, increment mintCount
    account.mintCount = account.mintCount.plus(BIGINT_ONE);
  } else if (transaction.transactionType == "TRADE") {
    // If the transaction is a TRADE, check if the account is the buyer or seller
    if (transaction.buyer) {
      account.buyCount = account.buyCount.plus(BIGINT_ONE); // Increment buyCount if buyer
    } else {
      account.saleCount = account.saleCount.plus(BIGINT_ONE); // Increment saleCount if seller
    }
  } else if (transaction.transactionType == "TRANSFER") {
    // If the transaction is a TRANSFER, increment transactionCount
    account.transactionCount = account.transactionCount.plus(BIGINT_ONE);
  }

  // Increment the overall transactionCount regardless of the type
  account.transactionCount = account.transactionCount.plus(BIGINT_ONE);

  // Persist the changes to the account entity
  account.save();
}

// Helper function to update account types
// Determines the account type based on the account's activity (mint, buy, and sale counts).
// Sets the appropriate flags for the account type and saves the updated entity.
export function updateAccountType(account: Account): void {
  // Check different conditions to determine the account type.
  if (
    account.mintCount.gt(BIGINT_ZERO) &&
    account.buyCount.isZero() &&
    account.saleCount.isZero()
  ) {
    account.isOG = true; // If the account has minted tokens but not bought or sold any, it's an "OG".
    account.isCollector = false;
    account.isHunter = false;
    account.isFarmer = false;
    account.isTrader = false;
  } else if (
    account.mintCount.gt(BIGINT_ZERO) &&
    account.buyCount.gt(BIGINT_ZERO)
  ) {
    account.isCollector = true; // If the account has both minted and bought tokens, it's a "Collector".
    account.isOG = false;
  } else if (
    account.mintCount.gt(BIGINT_ZERO) &&
    account.saleCount.gt(BIGINT_ZERO) &&
    account.buyCount.isZero()
  ) {
    account.isHunter = true; // If the account has minted and sold tokens but not bought any, it's a "Hunter".
    account.isCollector = false;
    account.isOG = false;
  } else if (
    account.mintCount.gt(BIGINT_ZERO) &&
    account.saleCount.gt(BIGINT_ZERO) &&
    account.buyCount.gt(BIGINT_ZERO)
  ) {
    account.isFarmer = true; // If the account has minted, sold, and bought tokens, it's a "Farmer".
    account.isHunter = false;
    account.isCollector = false;
    account.isOG = false;
  } else if (
    account.mintCount.isZero() &&
    account.buyCount.gt(BIGINT_ZERO) &&
    account.saleCount.gt(BIGINT_ZERO)
  ) {
    account.isTrader = true; // If the account has bought and sold tokens but not minted any, it's a "Trader".
    account.isFarmer = false;
    account.isHunter = false;
    account.isCollector = false;
    account.isOG = false;
  }
  account.save(); // Save the updated account to the store.
}
/**
 * Determines the account type based on the account's transaction history.
 * The function returns a string representing the account type, which can be OG, Collector, Hunter, Farmer, or Trader.
 *
 * @param account - The Account entity to evaluate.
 * @returns The account type as a string.
 
export function determineAccountType(account: Account): string {
  // Determine the account type based on the mint, buy, and sale counts.

  if (
    account.mintCount.ge(BIGINT_ONE) &&
    account.buyCount.equals(BIGINT_ZERO) &&
    account.saleCount.equals(BIGINT_ZERO)
  ) {
    // Account is an OG if it has only minted and not bought or sold.
    return "OG";
  } else if (
    account.mintCount.ge(BIGINT_ONE) &&
    account.buyCount.ge(BIGINT_ONE) &&
    account.saleCount.equals(BIGINT_ZERO)
  ) {
    // Account is a Collector if it has minted and bought but not sold.
    return "Collector";
  } else if (
    account.mintCount.ge(BIGINT_ONE) &&
    account.saleCount.ge(BIGINT_ONE) &&
    account.buyCount.equals(BIGINT_ZERO)
  ) {
    // Account is a Hunter if it has minted and sold but not bought.
    return "Hunter";
  } else if (
    account.mintCount.ge(BIGINT_ONE) &&
    account.saleCount.ge(BIGINT_ONE) &&
    account.buyCount.ge(BIGINT_ONE)
  ) {
    // Account is a Farmer if it has minted, bought, and sold.
    return "Farmer";
  } else if (
    account.mintCount.equals(BIGINT_ZERO) &&
    account.saleCount.ge(BIGINT_ONE) &&
    account.buyCount.ge(BIGINT_ONE)
  ) {
    // Account is a Trader if it has bought and sold but not minted.
    return "Trader";
  } else {
    // If none of the above conditions are met, return "Unknown" or another default type.
    return "Unknown";
  }
}*/
