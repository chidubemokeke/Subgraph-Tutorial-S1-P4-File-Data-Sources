import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  getOrCreateAccount,
  analyzeHistoricalData,
} from "../utils/accountHelper";
import {
  getOrCreateCovenToken,
  getTokenId,
  fetchTransferEvents,
} from "../utils/helpers";
import { getOrCreateTransaction } from "../utils/transactionHelper";
import { ZERO_ADDRESS, BIGINT_ZERO, BIGINT_ONE } from "../utils/constant";

// Handles a transfer event which could be a mint or a standard transfer
export function handleTransfer(event: TransferEvent): void {
  // Extract data from the Transfer event
  // Load or create account entities for 'from' and 'to' addresses
  let fromAccount = getOrCreateAccount(event.params.from.toHex()); // Get or create the account entity for the sender
  let toAccount = getOrCreateAccount(event.params.to.toHex()); // Get or create the account entity for the recipient
  //let tokenTracker = event.params.tokenId; // Array of token IDs being transferred

  // Handle tokenTracker as either a single token or an array of tokens
  let tokenTracker: BigInt[];

  // Check if event.params.tokenId is an array
  if (Array.isArray(event.params.tokenId)) {
    tokenTracker = event.params.tokenId as BigInt[]; // Cast to BigInt array if it's an array
  } else {
    tokenTracker = [event.params.tokenId as BigInt]; // Treat as a single-item array if it's a single value
  }
  // Determine if this is a mint event by checking if 'from' is the zero address
  let isMint = ZERO_ADDRESS;

  // Iterate over each token ID (To keep track of multiple tokens minted in one transaction)
  for (let i = 0; i < tokenTracker.length; i++) {
    let tokenId = tokenTracker[i].toString(); // Convert token ID to string format

    // Use getOrCreateCovenToken to ensure a CovenToken entity exists
    let covenToken = getOrCreateCovenToken(event, tokenId);

    if (isMint) {
      // Handle minting event
      covenToken.owner = toAccount.id; // After minting, the token's owner is the recipient
      covenToken.timestamp = event.block.timestamp; // Record the timestamp of the mint event
      covenToken.tokenId = tokenTracker[i];
    } else {
      // Handle standard transfer event
      covenToken.owner = toAccount.id; // Update the token's owner to the new address
    }

    // Save the updated Token and CovenToken entities to the subgraph
    covenToken.save(); // Ensure the CovenToken entity is saved

    if (isMint) {
      toAccount.mintCount = toAccount.mintCount.plus(toAccount.mintCount); // Increment mint count
    } else {
      fromAccount.activityCount = fromAccount.activityCount.plus(BIGINT_ONE); // Increment activity count for sender
      toAccount.activityCount = toAccount.activityCount.plus(BIGINT_ONE); // Increment activity count for receiver
    }

    fromAccount.save();
    toAccount.save();

    analyzeHistoricalData(fromAccount.id);
    analyzeHistoricalData(toAccount.id);
  }

  // Create or load the Transaction entity for the mint or transfer event
  let transactionType = isMint ? "MINT" : "TRANSFER";
  let transaction = getOrCreateTransaction(event, transactionType);
  transaction.totalNFTsSold = transaction.totalNFTsSold.plus(
    BigInt.fromI32(tokenTracker.length)
  ); // Increment total NFTs sold
  transaction.save();
}

// Handles a trade event (e.g., OrdersMatched from OpenSea)
export function handleOpenSeaSale(event: OrdersMatchedEvent): void {
  // Extract data from the OrdersMatched event
  let seller = event.params.maker.toHex(); // The address of the seller
  let buyer = event.params.taker.toHex(); // The address of the buyer
  let salePrice = event.params.price; // Sale price per token

  // Get or create Account entities for both seller and buyer
  let sellerAccount = getOrCreateAccount(seller);
  let buyerAccount = getOrCreateAccount(buyer);

  // Create or load the Transaction entity
  let transaction = getOrCreateTransaction(event, "TRADE");

  // Initialize variables to track the sale details
  let totalSaleVolume = BIGINT_ZERO; // Total value of NFTs sold in this transaction
  let highestSalePrice = BIGINT_ZERO; // Highest price of a single NFT sold in this transaction
  let lowestSalePrice = BIGINT_ZERO; // Lowest price of a single NFT sold in this transaction

  // Initialize an array to hold token IDs involved in the trade
  let tokenIds: string[] = []; // Array to store token IDs involved in the trade

  // Since event.transaction.logs doesn't exist, process relevant events directly
  // Check for TransferEvents related to the current event (you need to know how you receive these logs)
  // Note: This is just a placeholder; adjust as needed based on your actual event structure.
  // Access relevant logs for this event
  let transferEvents = fetchTransferEvents(event); // Adjust this based on how you access transfer events

  // Process each transfer event to retrieve token IDs
  for (let i = 0; i < transferEvents.length; i++) {
    let transferEvent = transferEvents[i];

    // Retrieve the token ID from the TransferEvent
    let tokenIdFromTransfer = getTokenId(event, seller);

    // If a token ID is found, add it to the array of token IDs
    if (tokenIdFromTransfer) {
      tokenIds.push(tokenIdFromTransfer);
    }
  }

  // Process each token ID involved in the transaction
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenId = tokenIds[i]; // Token ID in string format

    // Ensure that a CovenToken entity exists for this token ID
    let covenToken = getOrCreateCovenToken(event, tokenId);

    // If the CovenToken entity exists, update its ownership to the buyer
    if (covenToken) {
      covenToken.owner = buyer; // Set the new owner of the token
      covenToken.save(); // Save the updated CovenToken entity
    }
    // Update transaction details
    transaction.totalNFTsSold = transaction.totalNFTsSold.plus(BIGINT_ONE); // Increment total NFTs sold
    totalSaleVolume = totalSaleVolume.plus(salePrice); // Accumulate total sale volume

    // Update highest and lowest sale prices
    if (salePrice.gt(highestSalePrice)) {
      highestSalePrice = salePrice; // Update highest sale price
    }
    if (salePrice.lt(lowestSalePrice) || lowestSalePrice.equals(BIGINT_ZERO)) {
      lowestSalePrice = salePrice; // Update lowest sale price
    }
  }

  // Calculate average sale price
  transaction.totalSalesVolume = totalSaleVolume;
  transaction.averageSalePrice = totalSaleVolume.div(transaction.totalNFTsSold);
  transaction.highestSalePrice = highestSalePrice;
  transaction.lowestSalePrice = lowestSalePrice;

  // Save the updated Transaction entity
  transaction.save();

  // Update the seller's and buyer's accounts with the trade details
  sellerAccount.totalAmountSold =
    sellerAccount.totalAmountSold.plus(totalSaleVolume); // Increment totalAmountSold for seller
  buyerAccount.totalAmountBought =
    buyerAccount.totalAmountBought.plus(totalSaleVolume); // Increment totalAmountBought for buyer
  sellerAccount.activityCount = sellerAccount.activityCount.plus(
    transaction.totalNFTsSold
  ); // Increment activity count for seller
  buyerAccount.activityCount = buyerAccount.activityCount.plus(
    transaction.totalNFTsSold
  ); // Increment activity count for buyer

  // Save the updated Account entities
  sellerAccount.save();
  buyerAccount.save();

  // Analyze historical data for the seller and buyer accounts
  analyzeHistoricalData(sellerAccount.id);
  analyzeHistoricalData(buyerAccount.id);
}
