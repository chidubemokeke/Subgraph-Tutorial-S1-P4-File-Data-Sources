// Importing necessary types and classes from the @graphprotocol/graph-ts library
import { Address, Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Account, NFT, Transaction } from "../../generated/schema";
import { BIGINT_ZERO, BIGINT_ONE, ZERO_ADDRESS } from "./constant";

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
