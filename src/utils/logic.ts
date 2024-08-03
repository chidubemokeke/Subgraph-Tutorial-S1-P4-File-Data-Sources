// Importing necessary types and classes from the @graphprotocol/graph-ts library
import { Address, Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Account, NFT, Transaction } from "../../generated/schema";
import { BIGINT_ZERO, BIGINT_ONE, ZERO_ADDRESS } from "./constant";

// Enum for Transaction Types
export enum TransactionType {
  TRADE = "TRADE",
  MINT = "MINT",
}

// Helper function to update account statistics
export function updateAccountStatistics(
  account: Account,
  isMint: boolean,
  salePrice: BigInt | null = null
): void {
  if (isMint) {
    account.mintCount = (account.mintCount || BIGINT_ZERO).plus(BIGINT_ONE);
  } else if (salePrice) {
    account.saleCount = (account.saleCount || BIGINT_ZERO).plus(BIGINT_ONE);
    account.totalAmountSold = (account.totalAmountSold || BIGINT_ZERO).plus(
      salePrice
    );
  }
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
  transaction.totalSalesVolume = (
    transaction.totalSalesVolume || BIGINT_ZERO
  ).plus(salePrice);
  transaction.totalSalesCount = (
    transaction.totalSalesCount || BIGINT_ZERO
  ).plus(BIGINT_ONE);

  if (salePrice.gt(transaction.highestSalePrice || BIGINT_ZERO)) {
    transaction.highestSalePrice = salePrice;
  }

  if (
    salePrice.lt(transaction.lowestSalePrice || BIGINT_ZERO) ||
    (transaction.lowestSalePrice || BIGINT_ZERO).equals(BIGINT_ZERO)
  ) {
    transaction.lowestSalePrice = salePrice;
  }

  if (transaction.totalSalesCount.gt(BIGINT_ZERO)) {
    transaction.averageSalePrice = transaction.totalSalesVolume.div(
      transaction.totalSalesCount
    );
  }

  transaction.save();
}
