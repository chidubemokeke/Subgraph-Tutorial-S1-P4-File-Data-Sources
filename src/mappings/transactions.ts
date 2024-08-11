import { ethereum } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  getOrCreateAccount,
  analyzeAccountHistory,
} from "../utils/accountHelper";
import {
  getTokenId,
  getOrCreateCovenToken,
  getGlobalId,
} from "../utils/helpers";
import { getOrCreateTransaction } from "../utils/transactionHelper";
import { ZERO_ADDRESS, BIGINT_ZERO, BIGINT_ONE } from "../utils/constant";

// Enum for Transaction Types
// Enum is a special "class" that represents a group of constants (unchangeable variables).
export enum TransactionType {
  TRADE = 0, // Represents a trade transaction
  MINT = 1, // Represents a mint transaction
}

// Handles a transfer event which could be a mint or a standard transfer
export function handleTransfer(event: TransferEvent): void {
  let fromAccount = getOrCreateAccount(event.params.from.toHex()); // Get or create the account entity for the sender
  let toAccount = getOrCreateAccount(event.params.to.toHex()); // Get or create the account entity for the recipient

  // Determine if this event is a mint by checking if 'from' is the zero address
  let isMint = event.params.from.toHex() == ZERO_ADDRESS.toHex();

  // Use getOrCreateCovenToken to either retrieve the existing token or create a new one
  let covenToken = getOrCreateCovenToken(event); // Retrieve or create the CovenToken entity

  // If this is a mint event, update the mint count for the recipient account
  if (isMint) {
    toAccount.mintCount = toAccount.mintCount.plus(BIGINT_ONE); // Increment the mint count for the recipient
  } else {
    // Otherwise, update activity statistics for both sender and recipient accounts
    fromAccount.activityCount = fromAccount.activityCount.plus(BIGINT_ONE); // Increment activity count for the sender
    toAccount.activityCount = toAccount.activityCount.plus(BIGINT_ONE); // Increment activity count for the recipient
  }

  // Update the CovenToken entity with details from the transfer event.
  covenToken.owner = event.params.to;
  covenToken.tokenId = event.params.tokenId;
  covenToken.from = fromAccount.id;
  covenToken.to = toAccount.id;
  covenToken.txHash = event.transaction.hash;
  covenToken.blockNumber = event.block.number;
  covenToken.timestamp = event.block.timestamp;
  covenToken.save(); // Persist the CovenToken entity to the store.

  // Save the updated account entities to persist the changes
  fromAccount.save();
  toAccount.save();

  // Analyze historical data for both accounts to update their account types and history.
  analyzeAccountHistory(event, fromAccount.id);
  analyzeAccountHistory(event, toAccount.id);

  // Determine the type of transaction (Mint or Trade) and create/update a Transaction entity accordingly.
  let transactionType: TransactionType = isMint
    ? TransactionType.MINT
    : TransactionType.TRADE;

  let transaction = getOrCreateTransaction(event, transactionType);
  transaction.totalNFTsSold = transaction.totalNFTsSold.plus(BIGINT_ONE);
  transaction.save(); // Persist the Transaction entity to the store.
}

// Handles an OpenSea sale event.
export function handleOpenSeaSale(event: OrdersMatchedEvent): void {
  // Extract relevant information from the OrdersMatched event.
  let seller = event.params.maker; // Seller's address.
  let buyer = event.params.taker; // Buyer's address.
  let salePrice = event.params.price; // Sale price of the NFT.

  // Retrieve or create Account entities for both seller and buyer.
  let sellerAccount = getOrCreateAccount(seller.toHex());
  let buyerAccount = getOrCreateAccount(buyer.toHex());

  // Create or retrieve a Transaction entity for this trade.
  let transaction = getOrCreateTransaction(event, TransactionType.TRADE);

  // Initialize variables to track sale details.
  let totalSaleVolume = BIGINT_ZERO; // Total sale volume for this transaction.
  let highestSalePrice = BIGINT_ZERO; // Highest sale price of an NFT in this transaction.
  let lowestSalePrice = BIGINT_ZERO; // Lowest sale price of an NFT in this transaction.

  // Retrieve the tokenId from the OrdersMatchedEvent.
  let tokenId = getTokenId(event);

  if (tokenId) {
    // Update sale volume and price statistics.
    totalSaleVolume = totalSaleVolume.plus(salePrice);
    highestSalePrice = highestSalePrice.gt(salePrice)
      ? highestSalePrice
      : salePrice;
    lowestSalePrice = lowestSalePrice.lt(salePrice)
      ? lowestSalePrice
      : salePrice;
  }

  // Update the seller's and buyer's account details with trade information.
  sellerAccount.totalAmountSold =
    sellerAccount.totalAmountSold.plus(totalSaleVolume);
  sellerAccount.saleCount = sellerAccount.saleCount.plus(BIGINT_ONE);
  sellerAccount.activityCount = sellerAccount.activityCount.plus(
    transaction.totalNFTsSold
  );

  buyerAccount.totalAmountBought =
    buyerAccount.totalAmountBought.plus(totalSaleVolume);
  buyerAccount.buyCount = buyerAccount.buyCount.plus(BIGINT_ONE);
  buyerAccount.activityCount = buyerAccount.activityCount.plus(
    transaction.totalNFTsSold
  );

  // Save updated Account entities.
  sellerAccount.save();
  buyerAccount.save();

  // Analyze historical data for both seller and buyer accounts.
  analyzeAccountHistory(event, sellerAccount.id);
  analyzeAccountHistory(event, buyerAccount.id);

  // Update the transaction details with aggregated sale data.
  transaction.totalSalesVolume =
    transaction.totalSalesVolume.plus(totalSaleVolume);
  transaction.highestSalePrice = highestSalePrice;
  transaction.lowestSalePrice = lowestSalePrice;
  transaction.averageSalePrice = totalSaleVolume.div(transaction.totalNFTsSold);
  transaction.totalSalesCount = transaction.totalSalesCount.plus(BIGINT_ONE);
  transaction.transactionCount = transaction.transactionCount.plus(BIGINT_ONE);
  transaction.save(); // Persist the updated Transaction entity.
}
