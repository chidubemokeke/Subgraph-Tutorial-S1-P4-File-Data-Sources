import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  loadOrCreateAccount,
  createAccountHistory,
  updateTransactionCounts,
  updateAccountType,
} from "../helpers/accountHelper";
import {
  calculateAverageSalePrice,
  calculateHighestSalePrice,
  calculateLowestSalePrice,
  createOrUpdateCovenToken,
  extractTokenId,
} from "../helpers/utils";
import { createOrUpdateTransaction } from "../helpers/transactionHelper";
import { BIGINT_ONE, CRYPTOCOVEN_ADDRESS } from "../helpers/constant";

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
  // This function either creates a new Transaction entity or updates an existing one, capturing
  // details like the transaction hash, log index, block number, and timestamp.

  let buyerAccount = loadOrCreateAccount(event.params.taker);
  let sellerAccount = loadOrCreateAccount(event.params.maker);
  let transaction = createOrUpdateTransaction(event);

  // Step 2: Set the transaction type to TRADE (sale) for OrdersMatched events.
  // The OrdersMatched event signifies a successful sale of an NFT, so we set the transaction type to TRADE.
  transaction.transactionType = "TRADE";

  // Step 3: Retrieve the transaction receipt to access additional logs and details.
  // We need to extract the tokenId from the logs associated with the OrdersMatched event.
  let tokenId = extractTokenId(event, CRYPTOCOVEN_ADDRESS);

  // Step 4: Check if the tokenId is valid before proceeding.
  // Ensure the tokenId is not null or undefined before using it.
  if (tokenId) {
    // Step 5: Create or update the CovenToken entity.
    // This function creates or updates the CovenToken entity with the specified tokenId.
    let token = createOrUpdateCovenToken(tokenId);

    // Step 6: Set the new owner of the token.
    // Update the CovenToken entity to reflect the new owner, which is the 'taker' address from the event.
    token.owner = event.params.taker;

    // Save the updated CovenToken entity.
    token.save();

    // Step 7: Update the Transaction entity with the tokenId as the referenceId.
    // The referenceId field in the Transaction entity is set to the tokenId, linking the transaction to the specific token.
    transaction.referenceId = tokenId.toHex();

    // Save the updated Transaction entity with the new referenceId.
    transaction.save();
  }

  // Step 8: Calculate various statistics related to the sale.
  // Extract the sale price from the event and update the transaction statistics accordingly.
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

  // Step 9: Load or create Account entities for the buyer and seller involved in the transaction.
  // Ensure that both the buyer and seller accounts exist or are created if they do not already exist.

  // Step 10: Initialize or update transaction details for both accounts.
  // Set transaction details such as log index, transaction hash, block number, and timestamp for both the buyer and seller.
  buyerAccount.logIndex = event.logIndex;
  buyerAccount.txHash = event.transaction.hash;
  buyerAccount.blockNumber = event.block.number;
  buyerAccount.blockTimestamp = event.block.timestamp;

  sellerAccount.logIndex = event.logIndex;
  sellerAccount.txHash = event.transaction.hash;
  sellerAccount.blockNumber = event.block.number;
  sellerAccount.blockTimestamp = event.block.timestamp;

  // Step 11: Update transaction counts for both buyer and seller.
  // Increment transaction counts for both buyer and seller since this event is a sale (TRADE).
  updateTransactionCounts(buyerAccount, "TRADE");
  updateTransactionCounts(sellerAccount, "TRADE");

  // Step 12: Update account types and histories for both buyer and seller.
  // Update the account types and transaction history for both accounts to reflect their new status and activities.
  updateAccountType(buyerAccount);
  updateAccountType(sellerAccount);

  createAccountHistory(buyerAccount);
  createAccountHistory(sellerAccount);

  // Save the updated account entities to persist changes.
  buyerAccount.save();
  sellerAccount.save();
}
