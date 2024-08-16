import { log } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  createOrUpdateAccount,
  determineAccountType,
  updateAccountHistory,
} from "../helpers/accountHelper";
import {
  calculateAverageSalePrice,
  calculateHighestSalePrice,
  calculateLowestSalePrice,
  extractNFTsFromLogs,
  getTokenIdFromReceipt,
  updateTokenOwner,
} from "../helpers/utils";
import {
  initializeTransaction,
  getTransactionType,
} from "../helpers/transactionHelper";
import { BIGINT_ONE } from "../helpers/constant";

// Define the enum with the three transaction types
export enum TransactionType {
  TRADE, // Represents a sale transaction where an NFT is sold
  MINT, // Represents a mint transaction where a new NFT is created
  TRANSFER, // Represents when an NFT is transferred without being sold on OpenSea
}

/**
 * Handles a transfer event which could be a mint, trade, or standard transfer.
 *
 * @param event - The TransferEvent emitted by the contract.
 */
export function handleTransfer(event: TransferEvent): void {
  // Determine the transaction type (MINT, TRADE, or TRANSFER) based on the event details
  let transactionType: TransactionType = getTransactionType(event);

  // Extract the total number of NFTs involved in this transaction from the logs
  let totalNFTs = extractNFTsFromLogs(event.receipt!);

  // Log if an airdrop is detected or if multiple NFTs are purchased
  if (transactionType === TransactionType.MINT || totalNFTs > BIGINT_ONE) {
    log.info("Airdrop or multiple NFT purchase detected", [
      totalNFTs.toString(),
    ]);
  }

  // Update the CovenToken entity with details from the transfer event
  updateTokenOwner(
    event.params.tokenId,
    event.params.to,
    event.logIndex,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp
  );

  // Get or create the account entities for the sender and recipient
  let fromAccount = createOrUpdateAccount(event.params.from);
  let toAccount = createOrUpdateAccount(event.params.to);

  // Determine if this is a sale (assume sale if transaction type is TRADE)
  let isSale = transactionType === TransactionType.TRADE;

  // Update account history for both sender and recipient based on transaction type
  updateAccountHistory(fromAccount, transactionType, totalNFTs, isSale);
  updateAccountHistory(toAccount, transactionType, totalNFTs, !isSale);

  // Determine the account type based on historical transactions
  determineAccountType(fromAccount);
  determineAccountType(toAccount);

  // Save the updated account entities to persist the changes
  fromAccount.save();
  toAccount.save();
}

/**
 * Handles the OrdersMatched event, representing a sale on OpenSea.
 *
 * @param event - The OrdersMatchedEvent emitted by the contract.
 */
export function handleOpenSeaSale(event: OrdersMatchedEvent): void {
  // Step 1: Initialize a new Transaction entity using the event details
  let transaction = initializeTransaction(event);

  // Step 2: Extract the tokenId from the event receipt using the helper function
  let tokenId = getTokenIdFromReceipt(event.receipt!);
  if (tokenId === null) {
    log.warning(
      "Token ID could not be extracted from the transaction receipt.",
      []
    );
    return;
  }

  // Step 3: Update the Transaction entity with the extracted tokenId
  transaction.referenceId = tokenId.toHex();

  // Step 4: Update the CovenToken entity to reflect the new owner of the token
  updateTokenOwner(
    tokenId,
    event.params.taker, // Buyer is the new owner
    event.logIndex,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp
  );

  // Step 5: Retrieve or create Account entities for both seller and buyer
  let seller = createOrUpdateAccount(event.params.maker); // Seller's address
  let buyer = createOrUpdateAccount(event.params.taker); // Buyer's address

  // Step 6: Extract the sale price from the event parameters
  let salePrice = event.params.price;

  // Step 7: Determine the number of NFTs sold by analyzing the logs
  let totalNFTsSold = extractNFTsFromLogs(event.receipt!);

  // Step 8: Log if multiple NFTs are purchased in a single transaction
  if (totalNFTsSold > BIGINT_ONE) {
    log.info("Multiple NFTs purchased in a single transaction", [
      totalNFTsSold.toString(),
    ]);
  }

  let salePrices = [salePrice]; // Collect all sale prices (for example purposes)
  let totalSalesVolume = salePrice.times(totalNFTsSold);
  let totalSalesCount = BIGINT_ONE; // Count of sales in this example

  let averageSalePrice = calculateAverageSalePrice(
    totalSalesVolume,
    totalSalesCount
  );
  let highestSalePrice = calculateHighestSalePrice(salePrices);
  let lowestSalePrice = calculateLowestSalePrice(salePrices);

  // Step 9: Update the Transaction entity with sale details
  transaction.nftSalePrice = salePrice;
  transaction.totalNFTsSold = totalNFTsSold;
  transaction.totalSalesVolume = totalSalesVolume;
  transaction.averageSalePrice = averageSalePrice;
  transaction.totalSalesCount = totalSalesCount;
  transaction.highestSalePrice = highestSalePrice;
  transaction.lowestSalePrice = lowestSalePrice;

  // Step 10: Save the transaction entity
  transaction.save();

  // Step 11: Update account history for both the seller and buyer based on the sale
  updateAccountHistory(seller, TransactionType.TRADE, totalNFTsSold, true); // Update seller's history
  updateAccountHistory(buyer, TransactionType.TRADE, totalNFTsSold, false); // Update buyer's history

  // Step 12: Determine the account type based on historical transactions
  determineAccountType(seller);
  determineAccountType(buyer);

  // Step 13: Save the updated account entities to persist the changes
  seller.save();
  buyer.save();
}
