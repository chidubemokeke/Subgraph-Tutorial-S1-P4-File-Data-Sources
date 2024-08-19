import { BigInt, log } from "@graphprotocol/graph-ts";
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
} from "../helpers/utils";
import { createOrUpdateTransaction } from "../helpers/transactionHelper";
import { BIGINT_ONE, BIGINT_ZERO } from "../helpers/constant";

// Define the enum with the three transaction types
export enum TransactionType {
  TRADE, // Represents a sale transaction where an NFT is sold
  MINT, // Represents a mint transaction where a new NFT is created
  TRANSFER, // Represents when an NFT is transferred without being sold on OpenSea
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
  // Create or update the Transaction entity based on the event's transaction details.
  // This function generates or updates a Transaction record to log the sale, capturing key details like transaction hash, log index, block number, and timestamp.
  let transaction = createOrUpdateTransaction(event);

  // Set the transaction type to TRADE (sale) for OrdersMatched events.
  // OrdersMatched indicates that an NFT sale occurred, so the transaction type should be set to TRADE.
  transaction.transactionType = "TRADE";

  // Retrieve the transaction receipt to access additional logs and details.
  // Transaction receipts contain logs that provide more context about the transaction, including events like OrdersMatched.
  let logs = event.receipt!.logs;

  // Find the log index of the OrdersMatched event.
  // This helps in identifying the position of the OrdersMatched event within the logs.
  let ordersMatchedLogIndex = event.logIndex;

  // Determine the index of the log just before the OrdersMatched event in the logs array.
  // The log just before the OrdersMatched event is expected to contain the tokenId, so it's important to find this index to extract the tokenId.
  let targetLogIndex = -1;
  for (let i = 0; i < logs.length; i++) {
    if (logs[i].logIndex.equals(ordersMatchedLogIndex)) {
      targetLogIndex = i - 1; // Set the index of the previous log.
      break;
    }
  }

  // Validate the log index to ensure it's within bounds.
  // This check prevents errors if the log index is out of bounds.
  if (targetLogIndex < 0 || targetLogIndex >= logs.length) {
    log.warning(
      "[handleOpenSea] OrdersMatched event log index out of bounds",
      []
    );
    return;
  }

  // Extract the tokenId from the logs preceding the OrdersMatched event.
  // The tokenId is expected to be present in the logs before the OrdersMatched event.
  let tokenId: BigInt = BIGINT_ZERO;
  const tokenLog = logs[targetLogIndex];
  const topics = tokenLog.topics;

  // Assuming tokenId is passed as a topic in the log.
  // TokenId extraction logic depends on the structure of the log topics. Adjust if necessary based on actual log data.
  if (topics.length > 1) {
    tokenId = BigInt.fromString(topics[1].toHexString()); // Extract tokenId from log topics.
  }

  // If tokenId is valid, create or update the CovenToken entity.
  // Update the token's ownership to reflect the new owner as indicated by the OrdersMatched event.
  if (!tokenId.equals(BIGINT_ZERO)) {
    let token = createOrUpdateCovenToken(tokenId);
    token.owner = event.params.taker; // Update the token's owner to the 'to' address from the OrdersMatched event.
    token.save(); // Save the updated token entity.
  } else {
    log.warning("[handleOpenSea] TokenId extraction failed", []);
  }

  let salePrice = event.params.price;
  let previousHighestSalePrice = transaction.highestSalePrice;
  let previousLowestSalePrice = transaction.lowestSalePrice;

  // Step 8: Calculate various statistics related to the sale, such as average, highest, and lowest prices
  let totalSalesVolume = salePrice.times(transaction.totalNFTsSold); // Calculate total sales volume

  // Update transaction fields based on the OrdersMatched event.
  transaction.account = transaction.id;
  transaction.referenceId = tokenId.toHex();
  transaction.totalSalesCount = BIGINT_ONE;
  // Set fields like totalNFTsSold and totalSalesVolume to reflect the sale.
  transaction.nftSalePrice = salePrice;
  transaction.totalNFTsSold = BIGINT_ONE; // Increment as needed based on actual data.
  transaction.totalSalesVolume = totalSalesVolume; // Example: Adjust as needed based on actual data.
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

  transaction.save(); // Save the updated transaction entity.

  // Load or create Account entities for the buyer and seller involved in the transaction.
  // Ensure that both accounts exist or are created, as they are affected by the transaction.
  let buyerAccount = loadOrCreateAccount(event.params.taker);
  let sellerAccount = loadOrCreateAccount(event.params.maker);

  // Initialize or update transaction details for both accounts.
  // This ensures that transaction details such as log index, transaction hash, block number, and timestamp are recorded for both the buyer and seller.
  buyerAccount.logIndex = event.logIndex;
  buyerAccount.txHash = event.transaction.hash;
  buyerAccount.blockNumber = event.block.number;
  buyerAccount.blockTimestamp = event.block.timestamp;

  sellerAccount.logIndex = event.logIndex;
  sellerAccount.txHash = event.transaction.hash;
  sellerAccount.blockNumber = event.block.number;
  sellerAccount.blockTimestamp = event.block.timestamp;

  // Update transaction counts for both buyer and seller.
  // Since this is a sale, both accounts should be updated with a TRADE transaction count.
  updateTransactionCounts(buyerAccount, "TRADE");
  updateTransactionCounts(sellerAccount, "TRADE");

  // Update account types and histories for both buyer and seller.
  // This step ensures that account types are accurate and that transaction history is recorded.
  updateAccountType(buyerAccount);
  updateAccountType(sellerAccount);

  createAccountHistory(buyerAccount, determineAccountType(buyerAccount));
  createAccountHistory(sellerAccount, determineAccountType(sellerAccount));

  // Save the updated account entities.
  // Persist all changes to the buyer and seller accounts to reflect the latest transaction details.
  buyerAccount.save();
  sellerAccount.save();
}
