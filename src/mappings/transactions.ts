import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  loadOrCreateAccount,
  createAccountHistory,
  updateTransactionCounts,
  updateAccountType,
  determineAccountType,
} from "../helpers/accountHelper";
import {
  calculateAverageSalePrice,
  calculateHighestSalePrice,
  calculateLowestSalePrice,
  createOrUpdateCovenToken,
  extractTokenIdFromLogs,
} from "../helpers/utils";
import { createOrUpdateTransaction } from "../helpers/transactionHelper";
import { BIGINT_ONE } from "../helpers/constant";

export enum transactionType {
  MINT,
  TRADE,
  TRANSFER,
}

/**
 * Handles OrdersMatched events from the OpenSea smart contract.
 *
 * This function processes the OrdersMatched event, which signifies a successful sale of an NFT
 * on OpenSea. It updates the related entities with transaction details, including:
 * - Creating or updating the Transaction entity to record the sale.
 * - Extracting the tokenId from logs and updating the CovenToken entity.
 * - Updating the buyer and seller accounts with transaction details and transaction counts.
 * - Setting the transaction type to TRADE to reflect that it is a sale transaction.
 *
 * @param event - The OrdersMatched event object containing information about the order match.
 */
export function handleOpenSea(event: OrdersMatchedEvent): void {
  // Step 1: Create or update the Transaction entity based on the event's transaction details.
  let buyerAccount = loadOrCreateAccount(event.params.taker);
  let sellerAccount = loadOrCreateAccount(event.params.maker);
  let transaction = createOrUpdateTransaction(event);

  // Step 2: Extract the tokenId from the event logs.
  let tokenIdfromReceipt = extractTokenIdFromLogs(event);

  // Step 3: Check if the tokenId is valid before proceeding.
  if (tokenIdfromReceipt) {
    // Step 4: Create or update the CovenToken entity.
    let covenToken = createOrUpdateCovenToken(tokenIdfromReceipt);

    // Step 5: Set the new owner of the token.
    covenToken.owner = event.params.taker;

    // Save the updated CovenToken entity.
    covenToken.save();

    // Step 6: Update the Transaction entity with the tokenId as the referenceId.
    transaction.referenceId = tokenIdfromReceipt.toHex();

    // Save the updated Transaction entity with the new referenceId.
    transaction.save();
  }

  // Step 7: Calculate various statistics related to the sale.
  let salePrice = event.params.price;
  let previousHighestSalePrice = transaction.highestSalePrice;
  let previousLowestSalePrice = transaction.lowestSalePrice;

  // Calculate the total sales volume based on the sale price and the number of NFTs sold.
  let totalSalesVolume = salePrice.times(transaction.totalNFTsSold);

  // Update transaction fields based on the OrdersMatched event.
  transaction.nftSalePrice = salePrice;
  transaction.totalNFTsSold = BIGINT_ONE; // Set to one NFT sold in this transaction (adjust if needed)
  transaction.totalSalesVolume = totalSalesVolume; // Set total sales volume
  transaction.highestSalePrice = calculateHighestSalePrice(
    salePrice,
    previousHighestSalePrice
  );
  transaction.lowestSalePrice = calculateLowestSalePrice(
    salePrice,
    previousLowestSalePrice
  );
  transaction.averageSalePrice = calculateAverageSalePrice(
    totalSalesVolume,
    salePrice
  );
  transaction.logIndex = event.logIndex;
  transaction.txHash = event.transaction.hash;
  transaction.blockNumber = event.block.number;
  transaction.blockTimestamp = event.block.timestamp;

  // Save the updated Transaction entity with all the updated statistics and details.
  transaction.save();

  // Step 8: Initialize or update transaction details for both accounts.
  buyerAccount.logIndex = event.logIndex;
  buyerAccount.txHash = event.transaction.hash;
  buyerAccount.blockNumber = event.block.number;
  buyerAccount.blockTimestamp = event.block.timestamp;

  sellerAccount.logIndex = event.logIndex;
  sellerAccount.txHash = event.transaction.hash;
  sellerAccount.blockNumber = event.block.number;
  sellerAccount.blockTimestamp = event.block.timestamp;

  // Step 9: Update transaction counts for both buyer and seller.
  updateTransactionCounts(buyerAccount, "TRADE");
  updateTransactionCounts(sellerAccount, "TRADE");

  // Step 10: Update account types and histories for both buyer and seller.
  determineAccountType(buyerAccount);
  determineAccountType(sellerAccount);

  updateAccountType(buyerAccount);
  updateAccountType(sellerAccount);

  createAccountHistory(buyerAccount);
  createAccountHistory(sellerAccount);

  // Save the updated account entities to persist changes.
  buyerAccount.save();
  sellerAccount.save();
}
