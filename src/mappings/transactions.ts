import { BigInt, log } from "@graphprotocol/graph-ts";
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
import { BIGINT_ONE, ZERO_ADDRESS } from "../helpers/constant";

// Define the enum with the three transaction types
export enum TransactionType {
  TRADE, // Represents a sale transaction where an NFT is sold
  MINT, // Represents a mint transaction where a new NFT is created
  TRANSFER, // Represents when an NFT is transferred without being sold on OpenSea
}

/**
 * Handles the Transfer event emitted by the CryptoCoven contract.
 * This event may represent a minting, trading, or standard transfer of an NFT.
 *
 * @param event - The TransferEvent emitted by the CryptoCoven contract.
 */
export function handleTransfer(event: TransferEvent): void {
  // Check if this is a minting event (from the zero address)
  let isMinting = event.params.from == ZERO_ADDRESS;

  // Retrieve or create account entities for the sender and recipient.
  let fromAccount = createOrUpdateAccount(
    event.params.from,
    event.logIndex,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp
  ); // Sender's address
  let toAccount = createOrUpdateAccount(
    event.params.to,
    event.logIndex,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp
  ); // Recipient's address

  // Determine the type of transaction based on event details.
  let transactionType: TransactionType = isMinting
    ? TransactionType.MINT
    : getTransactionType(event);

  // Extract the total number of NFTs involved in this transaction from the event's logs.
  let totalNFTs = extractNFTsFromLogs(event);

  // Log if the transaction is a mint or involves multiple NFTs (indicating a potential airdrop).
  if (transactionType === TransactionType.MINT || totalNFTs.length > 1) {
    log.info("Airdrop or multiple NFT purchase detected", [
      totalNFTs.toString(),
    ]);
  }

  // Update the owner of the NFT in the CovenToken entity with the details from the transfer event.
  updateTokenOwner(
    event.params.tokenId, // Token ID of the transferred NFT
    event.params.from,
    event.params.to,
    event.logIndex,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp
  );

  // Determine if this transfer is part of a sale.
  let isSale = transactionType === TransactionType.TRADE;

  // Update the historical account data for both the sender and recipient based on the transaction type.
  updateAccountHistory(
    fromAccount,
    transactionType,
    BigInt.fromI32(totalNFTs.length),
    isSale
  ); // Update sender's account history
  updateAccountHistory(
    toAccount,
    transactionType,
    BigInt.fromI32(totalNFTs.length),
    !isSale
  ); // Update recipient's account history

  // Analyze the account's transaction history to determine its type (e.g., trader, holder).
  determineAccountType(fromAccount); // Determine sender's account type
  determineAccountType(toAccount); // Determine recipient's account type

  // Persist the updated account entities to the store.
  fromAccount.save();
  toAccount.save();
}

/**
 * Handles the OrdersMatched event emitted by the OpenSea contract.
 * This event represents a completed sale transaction on OpenSea.
 *
 * @param event - The OrdersMatchedEvent emitted by the OpenSea contract.
 */
export function handleOpenSeaSale(event: OrdersMatchedEvent): void {
  // Step 5: Retrieve or create Account entities for both the seller and buyer.
  let seller = createOrUpdateAccount(
    event.params.maker,
    event.logIndex,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp
  ); // Seller's address
  let buyer = createOrUpdateAccount(
    event.params.taker,
    event.logIndex,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp
  ); // Buyer's address

  // Step 1: Initialize a new Transaction entity using the details from the OrdersMatched event.
  let transaction = initializeTransaction(event);

  // Step 2: Extract the tokenId of the NFT involved in the sale from the event receipt.
  let tokenId = getTokenIdFromReceipt(event);

  // If tokenId is null, log a warning and exit the function to prevent errors.
  if (tokenId === null) {
    log.warning("Didint extract", [event.transaction.hash.toHex()]);
    return;
  }

  // Step 3: Update the Transaction entity with the extracted tokenId.
  transaction.referenceId = tokenId;

  // Step 4: Update the CovenToken entity to reflect the new owner of the NFT after the sale.
  updateTokenOwner(
    tokenId, // Token ID of the sold NFT
    event.params.maker,
    event.params.taker,
    event.logIndex,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp // Buyer's address (new owner)
  );

  // Step 6: Extract the sale price from the event parameters.
  let salePrice = event.params.price;

  // Step 7: Determine the number of NFTs sold by analyzing the logs in the event receipt.
  let totalNFTsSold = extractNFTsFromLogs(event);

  // If multiple NFTs were sold in a single transaction, log this information.
  if (totalNFTsSold.length > 1) {
    log.info("Multiple NFTs purchased in a single transaction", [
      totalNFTsSold.toString(),
    ]);
  }

  // Step 8: Calculate various statistics related to the sale, such as average, highest, and lowest prices.
  let salePrices = [salePrice]; // Collect all sale prices (for example purposes)
  let totalSalesVolume = salePrice.times(BigInt.fromI32(totalNFTsSold.length)); // Calculate total sales volume
  let totalSalesCount = BIGINT_ONE; // Count of sales in this example (one transaction)

  let averageSalePrice = calculateAverageSalePrice(
    totalSalesVolume,
    totalSalesCount
  );
  let highestSalePrice = calculateHighestSalePrice(salePrices);
  let lowestSalePrice = calculateLowestSalePrice(salePrices);

  // Step 9: Update the Transaction entity with the calculated sale details.
  transaction.nftSalePrice = salePrice;
  transaction.totalNFTsSold = BigInt.fromI32(totalNFTsSold.length);
  transaction.totalSalesVolume = totalSalesVolume;
  transaction.averageSalePrice = averageSalePrice;
  transaction.totalSalesCount = totalSalesCount;
  transaction.highestSalePrice = highestSalePrice;
  transaction.lowestSalePrice = lowestSalePrice;

  // Step 10: Save the updated Transaction entity to persist the sale details.
  transaction.save();

  // Step 11: Update the historical account data for both the seller and buyer based on the sale.
  updateAccountHistory(
    seller,
    TransactionType.TRADE,
    BigInt.fromI32(totalNFTsSold.length),
    true
  ); // Update seller's account history
  updateAccountHistory(
    buyer,
    TransactionType.TRADE,
    BigInt.fromI32(totalNFTsSold.length),
    false
  ); // Update buyer's account history

  // Step 12: Analyze the account's transaction history to determine its type (e.g., trader, holder).
  determineAccountType(seller); // Determine seller's account type
  determineAccountType(buyer); // Determine buyer's account type

  // Step 13: Persist the updated account entities to the store.
  seller.save();
  buyer.save();
}
