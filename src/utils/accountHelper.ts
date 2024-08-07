import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Account, Transaction } from "../../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO } from "./constant";

// Enum for Transaction Types
export enum TransactionType {
  TRADE = "TRADE",
  MINT = "MINT",
}

export function getOrCreateAccount(accountAddress: Bytes): Account {
  // Attempt to load the account entity by its address
  let account = Account.load(accountAddress.toHex());

  if (!account) {
    // Create a new account entity if it does not exist
    account = new Account(accountAddress.toHex());
    account.transactionCount = BIGINT_ZERO;
    account.mintCount = BIGINT_ZERO; // Initialize mint count
    account.buyCount = BIGINT_ZERO; // Initialize mint count
    account.saleCount = BIGINT_ZERO; // Initialize mint count
    account.isOG = false; // Default to not being a collector
    account.isCollector = false; // Default to not being a collector
    account.isHunter = false; // Default to not being a hunter
    account.isFarmer = false; // Default to not being a farmer
    account.isTrader = false; // Default to not being a trader
    account.totalAmountBought = BIGINT_ZERO; // Initialize total amount bought
    account.totalAmountSold = BIGINT_ZERO; // Initialize total amount sold
    account.totalAmountBalance = BIGINT_ZERO; // Initialize total balance
    account.blockNumber = BIGINT_ZERO; // Initialize block number
    account.blockTimestamp = BIGINT_ZERO; // Initialize block timestamp
  } else {
    // Ensure existing account fields are initialized
    account.totalAmountBought = account.totalAmountBought || BIGINT_ZERO;
    account.totalAmountSold = account.totalAmountSold || BIGINT_ZERO;
    account.totalAmountBalance || BIGINT_ZERO;
    account.blockNumber = account.blockNumber || BIGINT_ZERO;
    account.blockTimestamp = account.blockTimestamp || BIGINT_ZERO;
  }

  return account; // Return the loaded or newly created account entity
}

// Helper function to update account statistics
export function updateAccountStatistics(
  account: Account,
  isMint: boolean
): void {
  // Initialize mint field if null
  if (!account.mintCount) {
    account.mintCount = BIGINT_ZERO;
  }
  // Increment mintCount if it's a mint event
  if (!isMint) {
    account.mintCount = account.mintCount.plus(BIGINT_ONE);
  }

  // Increment the transaction count for both mint and trade events
  account.transactionCount = account.transactionCount.plus(BIGINT_ONE);

  // Save the updated account entity
  account.save();
}

// Function to update account types based on their activities
export function updateAccountTypes(account: Account): void {
  // Check if mintCount is null, and if so, default to BIGINT_ZERO
  const mintCount = account.mintCount || BIGINT_ZERO;
  const buyCount = account.buyCount || BIGINT_ZERO;
  const saleCount = account.saleCount || BIGINT_ZERO;

  // Check if the account is an OG
  // An OG account only mints and holds NFTs
  account.isOG =
    mintCount.gt(BIGINT_ZERO) && // Must have minted at least one NFT
    buyCount.equals(BIGINT_ZERO) && // Must not have bought any NFTs
    saleCount.equals(BIGINT_ZERO); // Must not have sold any NFTs

  // Check if the account is a Collector
  // A Collector mints or buys NFTs but does not sell
  account.isCollector =
    (mintCount.gt(BIGINT_ZERO) || buyCount.gt(BIGINT_ZERO)) && // Must have minted or bought at least one NFT
    saleCount.equals(BIGINT_ZERO); // Must not have sold any NFTs

  // Check if the account is a Hunter
  // A Hunter mints, sells, but does not buy
  account.isHunter =
    mintCount.gt(BIGINT_ZERO) && // Must have minted at least one NFT
    buyCount.equals(BIGINT_ZERO) && // Must not have bought any NFTs
    saleCount.gt(BIGINT_ZERO); // Must have sold at least one NFT

  // Check if the account is a Farmer
  // A Farmer mints, buys, sells, and engages in other transactions
  account.isFarmer =
    mintCount.gt(BIGINT_ZERO) && // Must have minted at least one NFT
    buyCount.gt(BIGINT_ZERO) && // Must have bought at least one NFT
    saleCount.gt(BIGINT_ZERO); // Must have sold at least one NFT

  // Check if the account is a Trader
  // A Trader does not mint but buys or sells NFTs
  account.isTrader =
    mintCount.equals(BIGINT_ZERO) && // Must not have minted any NFTs
    (buyCount.gt(BIGINT_ZERO) || saleCount.gt(BIGINT_ZERO)); // Must have bought or sold at least one NFT
}

// Helper function to update transaction statistics
export function updateTransactionStatistics(
  transaction: Transaction,
  salePrice: BigInt
): void {
  // Update the total sales volume by adding the current sale price
  transaction.totalSalesVolume = (
    transaction.totalSalesVolume || BIGINT_ZERO
  ).plus(salePrice);

  // Increment the total sales count by one
  transaction.totalSalesCount = (
    transaction.totalSalesCount || BIGINT_ZERO
  ).plus(BIGINT_ONE);

  // If the sale price is greater than the current highest sale price, update it
  if (salePrice.gt(transaction.highestSalePrice || BIGINT_ZERO)) {
    transaction.highestSalePrice = salePrice;
  }

  // If the sale price is less than the current lowest sale price or if it's the first sale, update it
  if (
    salePrice.lt(transaction.lowestSalePrice || BIGINT_ZERO) ||
    (transaction.lowestSalePrice || BIGINT_ZERO).equals(BIGINT_ZERO)
  ) {
    transaction.lowestSalePrice = salePrice;
  }

  // Calculate the average sale price if there are any sales
  if (transaction.totalSalesCount.gt(BIGINT_ZERO)) {
    transaction.averageSalePrice = transaction.totalSalesVolume.div(
      transaction.totalSalesCount
    );
  }

  // Save the updated transaction entity
  transaction.save();
}
