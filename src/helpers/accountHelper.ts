import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Account } from "../../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO } from "./constant";

// Define the enum with the three transaction types
export enum TransactionType {
  TRADE, // Represents a sale transaction where an NFT is sold
  MINT, // Represents a mint transaction where a new NFT is created
  TRANSFER, // Represents when an NFT is transferred without being sold on OpenSea
}
/**
 * Creates a new Account entity or updates an existing one with default values if necessary.
 * This function ensures that all accounts involved in transactions are properly initialized
 * and tracked. It initializes default values for all relevant fields when a new account is created.
 *
 * @param address - The Ethereum address of the account as a Bytes object.
 * @returns The created or updated Account entity.
 */
export function createOrUpdateAccount(address: Bytes): Account {
  // Attempt to load the existing Account entity from the store using the address as the ID.
  let account = Account.load(address.toHex());

  // If the account doesn't exist in the store (i.e., it's null), create a new one.
  if (!account) {
    // Initialize a new Account entity using the address as the unique ID.
    account = new Account(address.toHex());

    // Initialize all transaction-related counters and aggregated fields to zero.
    account.transactionCount = BIGINT_ZERO; // Set the initial transaction count to 0.
    account.mintCount = BIGINT_ZERO; // Set the initial mint count to 0.
    account.buyCount = BIGINT_ZERO; // Set the initial buy count to 0.
    account.saleCount = BIGINT_ZERO; // Set the initial sale count to 0.
    account.totalAmountBought = BIGINT_ZERO; // Set the initial total amount bought to 0.
    account.totalAmountSold = BIGINT_ZERO; // Set the initial total amount sold to 0.
    account.totalAmountBalance = BIGINT_ZERO; // Set the initial total amount balance to 0.

    // Initialize all boolean flags related to account types to false.
    account.isOG = false; // Indicates if the account has only minted and holds.
    account.isCollector = false; // Indicates if the account has minted and bought on OpenSea and holds.
    account.isHunter = false; // Indicates if the account has minted and sold on OpenSea without buying.
    account.isFarmer = false; // Indicates if the account has minted, sold, and bought on OpenSea.
    account.isTrader = false; // Indicates if the account has only bought and sold on OpenSea.

    // Other fields like transactions and history will be automatically populated via @derivedFrom.
  }

  // Return the existing or newly created Account entity.
  return account;
}

/**
 * Updates the given Account entity based on the type of transaction and amount involved.
 * This function increments the appropriate counters (e.g., transaction count, mint count, sale count)
 * and adjusts the total amounts bought and sold, as well as the balance.
 *
 * @param account - The Account entity to update.
 * @param transactionType - The type of transaction (TRADE, MINT, TRANSFER).
 * @param amount - The amount involved in the transaction.
 * @param isSale - Indicates whether the transaction is a sale (true) or a purchase (false).
 * @returns The updated Account entity.
 */
export function updateAccountHistory(
  account: Account,
  transactionType: TransactionType,
  price: BigInt,
  isSale: boolean = false
): Account {
  // Increment the overall transaction count for the account.
  account.transactionCount = account.transactionCount.plus(BIGINT_ONE);

  // Update specific counters and amounts based on the transaction type.
  if (transactionType === TransactionType.MINT) {
    // If the transaction is a mint, increment the mint count.
    account.mintCount = account.mintCount.plus(account.mintCount);
  } else if (transactionType === TransactionType.TRADE && isSale) {
    // If the transaction is a sale, increment the sale count and update the total amount sold.
    account.saleCount = account.saleCount.plus(BIGINT_ONE);
    account.totalAmountSold = account.totalAmountSold.plus(price);
    // Decrease the total balance by the amount sold.
    account.totalAmountBalance = account.totalAmountBalance.minus(price);
  } else if (transactionType === TransactionType.TRADE && !isSale) {
    // If the transaction is a purchase, increment the buy count and update the total amount bought.
    account.buyCount = account.buyCount.plus(BIGINT_ONE);
    account.totalAmountBought = account.totalAmountBought.plus(price);
    // Increase the total balance by the amount bought.
    account.totalAmountBalance = account.totalAmountBalance.plus(price);
  }

  // Return the updated account entity.
  return account;
}
/**
 * Determines the account type based on the account's transaction history.
 * The function sets boolean flags to categorize the account as an OG, Collector, Hunter, Farmer, or Trader.
 *
 * @param account - The Account entity to evaluate.
 * @returns The updated Account entity with the appropriate type flags set.
 */
export function determineAccountType(account: Account): Account {
  // Determine the account type based on the mint, buy, and sale counts.

  if (
    account.mintCount.ge(BIGINT_ONE) &&
    account.buyCount.equals(BIGINT_ZERO) &&
    account.saleCount.equals(BIGINT_ZERO)
  ) {
    // Account is an OG if it has only minted and not bought or sold.
    account.isOG = true;
    account.isCollector = false;
    account.isHunter = false;
    account.isFarmer = false;
    account.isTrader = false;
  } else if (
    account.mintCount.ge(BIGINT_ONE) &&
    account.buyCount.ge(BIGINT_ONE) &&
    account.saleCount.equals(BIGINT_ZERO)
  ) {
    // Account is a Collector if it has minted and bought but not sold.
    account.isOG = false;
    account.isCollector = true;
    account.isHunter = false;
    account.isFarmer = false;
    account.isTrader = false;
  } else if (
    account.mintCount.ge(BIGINT_ONE) &&
    account.saleCount.ge(BIGINT_ONE) &&
    account.buyCount.equals(BIGINT_ZERO)
  ) {
    // Account is a Hunter if it has minted and sold but not bought.
    account.isOG = false;
    account.isCollector = false;
    account.isHunter = true;
    account.isFarmer = false;
    account.isTrader = false;
  } else if (
    account.mintCount.ge(BIGINT_ONE) &&
    account.saleCount.ge(BIGINT_ONE) &&
    account.buyCount.ge(BIGINT_ONE)
  ) {
    // Account is a Farmer if it has minted, bought, and sold.
    account.isOG = false;
    account.isCollector = false;
    account.isHunter = false;
    account.isFarmer = true;
    account.isTrader = false;
  } else if (
    account.mintCount.equals(BIGINT_ZERO) &&
    account.saleCount.ge(BIGINT_ONE) &&
    account.buyCount.ge(BIGINT_ONE)
  ) {
    // Account is a Trader if it has bought and sold but not minted.
    account.isOG = false;
    account.isCollector = false;
    account.isHunter = false;
    account.isFarmer = false;
    account.isTrader = true;
  } else {
    // If none of the above conditions are met, reset all flags to false.
    account.isOG = false;
    account.isCollector = false;
    account.isHunter = false;
    account.isFarmer = false;
    account.isTrader = false;
  }

  // Return the account entity with updated type flags.
  return account;
}
