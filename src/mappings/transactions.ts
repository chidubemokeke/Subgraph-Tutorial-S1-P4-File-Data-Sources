import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  getOrCreateAccount,
  analyzeAccountHistory,
} from "../utils/accountHelper";
import { getOrCreateCovenToken, fetchTransferEvents } from "../utils/helpers";
import { getOrCreateTransaction } from "../utils/transactionHelper";
import { ZERO_ADDRESS, BIGINT_ZERO, BIGINT_ONE } from "../utils/constant";

// Handles a transfer event which could be a mint or a standard transfer
export function handleTransfer(event: TransferEvent): void {
  // Extract data from the Transfer event
  // Load or create account entities for 'from' and 'to' addresses
  let fromAccount = getOrCreateAccount(event.params.from.toHex()); // Get or create the account entity for the sender
  let toAccount = getOrCreateAccount(event.params.to.toHex()); // Get or create the account entity for the recipient
  let tokenId = event.params.tokenId; // Extract token ID from the event parameters

  // Handle tokenTracker as either a single token or an array of tokens
  let tokenTracker: BigInt[];

  // Check if event.params.tokenId is an array
  if (Array.isArray(tokenId)) {
    tokenTracker = tokenId as BigInt[]; // Cast to BigInt array if it's an array
  } else {
    tokenTracker = [tokenId as BigInt]; // Treat as a single-item array if it's a single value
  }

  // Determine if this is a mint event by checking if 'from' is the zero address
  let isMint = ZERO_ADDRESS;

  // Iterate over each token ID (to handle multiple tokens minted in one transaction)
  for (let i = 0; i < tokenTracker.length; i++) {
    let currentTokenId = tokenTracker[i].toString(); // Convert current token ID to string

    // Use getOrCreateCovenToken to ensure a CovenToken entity exists
    let covenToken = getOrCreateCovenToken(event, currentTokenId);

    if (isMint) {
      // Handle minting event
      covenToken.owner = toAccount.id; // Set the owner of the minted token to the recipient
      covenToken.timestamp = event.block.timestamp; // Record the timestamp of the mint event
      covenToken.tokenId = tokenTracker[i]; // Set the token ID
    } else {
      // Handle standard transfer event
      covenToken.owner = toAccount.id; // Update the token's owner to the new address
    }

    // Save the updated CovenToken entity
    covenToken.save();

    if (isMint) {
      toAccount.mintCount = toAccount.mintCount.plus(BIGINT_ONE); // Increment mint count
    } else {
      fromAccount.activityCount = fromAccount.activityCount.plus(BIGINT_ONE); // Increment activity count for sender
      toAccount.activityCount = toAccount.activityCount.plus(BIGINT_ONE); // Increment activity count for receiver
    }

    fromAccount.save();
    toAccount.save();

    // Analyze the historical data for both accounts
    analyzeAccountHistory(event, fromAccount.id);
    analyzeAccountHistory(event, toAccount.id);
  }

  // Create or load the Transaction entity for the mint or transfer event
  let transactionType = isMint ? "MINT" : "TRANSFER"; // Set transaction type based on the event
  let transaction = getOrCreateTransaction(event, transactionType); // Retrieve or initialize the Transaction entity

  // Increment total NFTs sold in the transaction
  transaction.totalNFTsSold = transaction.totalNFTsSold.plus(
    BigInt.fromI32(tokenTracker.length)
  );
  transaction.save(); // Save the updated Transaction entity
}

// Handles an OpenSea sale event
export function handleOpenSeaSale(event: OrdersMatchedEvent): void {
  // Extract relevant data from the OrdersMatched event
  let seller = event.params.maker.toHex(); // Seller's address
  let buyer = event.params.taker.toHex(); // Buyer's address
  let salePrice = event.params.price; // Sale price per token

  // Retrieve or create Account entities for both seller and buyer
  let sellerAccount = getOrCreateAccount(seller); // Ensure seller account exists
  let buyerAccount = getOrCreateAccount(buyer); // Ensure buyer account exists

  // Create or retrieve a Transaction entity for this trade
  let transaction = getOrCreateTransaction(event, "TRADE"); // Initialize transaction record

  // Initialize variables to track sale details
  let totalSaleVolume = BIGINT_ZERO; // Total value of NFTs sold in this transaction
  let highestSalePrice = BIGINT_ZERO; // Highest price of a single NFT in this transaction
  let lowestSalePrice = BIGINT_ZERO; // Lowest price of a single NFT in this transaction

  // Array to store token IDs involved in the trade
  let tokenIds: string[] = [];

  // Fetch transfer events related to the current sale event
  // Note: Cast `event` to `ethereum.Event` to use with `fetchTransferEvents`
  let transferEvents = fetchTransferEvents(event as unknown as ethereum.Event);

  // Iterate through each transfer event to retrieve token IDs
  for (let i = 0; i < transferEvents.length; i++) {
    let transferEvent = transferEvents[i];
    let tokenIdFromTransfer = transferEvent.tokenId.toString(); // Convert token ID to string

    if (tokenIdFromTransfer) {
      tokenIds.push(tokenIdFromTransfer); // Add token ID to the list
    }
  }

  // Process each token ID involved in the transaction
  for (let i = 0; i < tokenIds.length; i++) {
    let tokenId = tokenIds[i]; // Token ID in string format
    let covenToken = getOrCreateCovenToken(event, tokenId); // Ensure a CovenToken entity exists

    if (covenToken) {
      covenToken.owner = buyer; // Update the token's owner to the buyer
      covenToken.save(); // Save the updated CovenToken entity
    }

    // Update transaction details with sale information
    transaction.totalNFTsSold = transaction.totalNFTsSold.plus(
      transaction.totalNFTsSold
    ); // Increment total NFTs sold
    totalSaleVolume = totalSaleVolume.plus(salePrice); // Add sale price to total sale volume

    // Update highest and lowest sale prices
    if (salePrice.gt(highestSalePrice)) {
      highestSalePrice = salePrice; // Set highest sale price
    }
    if (salePrice.lt(lowestSalePrice) || lowestSalePrice.equals(BIGINT_ZERO)) {
      lowestSalePrice = salePrice; // Set lowest sale price
    }
  }

  // Calculate average sale price
  transaction.totalSalesVolume = totalSaleVolume; // Set total sales volume
  transaction.averageSalePrice = totalSaleVolume.div(transaction.totalNFTsSold); // Compute average sale price
  transaction.highestSalePrice = highestSalePrice; // Set highest sale price
  transaction.lowestSalePrice = lowestSalePrice; // Set lowest sale price

  // Save the updated Transaction entity
  transaction.save();

  // Update seller's and buyer's account details with trade information
  sellerAccount.totalAmountSold =
    sellerAccount.totalAmountSold.plus(totalSaleVolume); // Increment total amount sold for seller
  buyerAccount.totalAmountBought =
    buyerAccount.totalAmountBought.plus(totalSaleVolume); // Increment total amount bought for buyer
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
  analyzeAccountHistory(event, sellerAccount.id); // Analyze seller's historical data
  analyzeAccountHistory(event, buyerAccount.id); // Analyze buyer's historical data
}
