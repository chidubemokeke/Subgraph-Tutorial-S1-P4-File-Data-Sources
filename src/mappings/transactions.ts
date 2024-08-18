import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
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
  extractNFTsFromLogs,
  getTokenIdFromReceipt,
  createOrUpdateCovenToken,
} from "../helpers/utils";
import { createOrUpdateTransaction } from "../helpers/transactionHelper";
import {
  BIGINT_ONE,
  ordersMatchedSig,
  ZERO_ADDRESS,
} from "../helpers/constant";

// Define the enum with the three transaction types
export enum TransactionType {
  TRADE, // Represents a sale transaction where an NFT is sold
  MINT, // Represents a mint transaction where a new NFT is created
  TRANSFER, // Represents when an NFT is transferred without being sold on OpenSea
}

/**
 * Handles Transfer events from the smart contract.
 *
 * This function handles the core logic for processing token transfers. It manages
 * the creation and updating of both account and token entities, determines the type
 * of transaction (mint, transfer, or sale), and updates the transaction counts accordingly.
 *
 * @param event - The Transfer event object containing information about the token transfer.
 */
export function handleTransfer(event: TransferEvent): void {
  // Load or create Account entities for the 'from' and 'to' addresses involved in the transfer.
  // This step ensures that entities exist for both accounts involved in the transfer.
  let fromAccount = loadOrCreateAccount(event.params.from);
  let toAccount = loadOrCreateAccount(event.params.to);

  // Initialize transaction details for both accounts.
  // These details are updated to track the latest transaction associated with each account.
  fromAccount.logIndex = event.logIndex; // Set log index for 'from' account.
  fromAccount.txHash = event.transaction.hash; // Set transaction hash for 'from' account.
  fromAccount.blockNumber = event.block.number; // Set block number for 'from' account.
  fromAccount.blockTimestamp = event.block.timestamp; // Set block timestamp for 'from' account.

  toAccount.logIndex = event.logIndex; // Set log index for 'to' account.
  toAccount.txHash = event.transaction.hash; // Set transaction hash for 'to' account.
  toAccount.blockNumber = event.block.number; // Set block number for 'to' account.
  toAccount.blockTimestamp = event.block.timestamp; // Set block timestamp for 'to' account.

  // Load or create the CovenToken entity associated with this tokenId.
  // This step ensures that the token entity is properly initialized and can be updated.
  let token = createOrUpdateCovenToken(event.params.tokenId);

  // Update the token's fields based on the event data.
  // These fields are crucial for tracking the token's transaction history and ownership.
  token.logIndex = event.logIndex; // Update log index for the token.
  token.txHash = event.transaction.hash; // Update transaction hash for the token.
  token.blockNumber = event.block.number; // Update block number for the token.
  token.blockTimestamp = event.block.timestamp; // Update block timestamp for the token.
  token.owner = event.params.to; // Set the owner of the token to the 'to' address.

  // Determine if the transaction is a mint operation.
  // A mint occurs when the 'from' address is empty (indicating the token is being created).
  let isMint = event.params.from == ZERO_ADDRESS;

  // Save the updated CovenToken entity.
  // This step ensures that the entity is stored with all the updated information.
  token.save();

  // Determine transaction type and update transaction counts.
  if (isMint) {
    // If it's a mint, update transaction counts as 'MINT' for the recipient account.
    // Mints are treated as a special type of transaction where new tokens are created.
    updateTransactionCounts(toAccount, "MINT");
  } else {
    // If it's not a mint, handle it as a transfer or sale.

    // Check if the event has a receipt (i.e., if there are any logs associated with this event).
    if (!event.receipt) {
      log.warning("[handleTransfer][{}] has no event.receipt", [
        event.transaction.hash.toHexString(),
      ]);

      // No receipt available; handle by updating account types and histories only.
      // This ensures that even without additional log data, the accounts are correctly updated.
      updateAccountType(fromAccount);
      updateAccountType(toAccount);

      createAccountHistory(fromAccount, determineAccountType(fromAccount));
      createAccountHistory(toAccount, determineAccountType(toAccount));

      // Save the updated account entities.
      fromAccount.save();
      toAccount.save();

      return; // Exit early as there's no additional log data to process.
    }

    // Retrieve logs from the event receipt.
    // This allows us to inspect additional events that may be part of the same transaction.
    const currentEventLogIndex = event.logIndex; // Index of the current Transfer event log.
    const logs = event.receipt!.logs; // Array of logs associated with the transaction.

    // Variable to track the position of the first log after the current Transfer event.
    let foundIndex: i32 = -1;
    let isOrdersMatched = false; // Flag to indicate if an OrdersMatched event is detected.

    // Loop through logs to find the index of the first log after the current Transfer event.
    for (let i = 0; i < logs.length; i++) {
      const currLog = logs.at(i);

      // Identify the position of the current Transfer event log within the logs array.
      if (currLog.logIndex.equals(currentEventLogIndex)) {
        foundIndex = i;
        break; // Stop looping once the index of the current Transfer event is found.
      }
    }

    // Check if there are sufficient logs after the Transfer event to potentially find the OrdersMatched event.
    // The +5 offset is based on the assumption that the OrdersMatched event may follow after the Transfer event.
    if (foundIndex >= 0 && foundIndex + 5 < logs.length) {
      const nextLog = logs.at(foundIndex + 5); // Log after the current Transfer event.
      const topic0Sig = nextLog.topics.at(0); // First topic of the next log.

      // Check if the next log contains the OrdersMatched signature.
      if (topic0Sig.equals(ordersMatchedSig)) {
        isOrdersMatched = true; // Flag indicating that OrdersMatched event is found.
      }
    }

    // Determine the type of transaction based on whether OrdersMatched is found.
    if (isOrdersMatched) {
      // If OrdersMatched event is found, update transaction counts as a 'SALE' for both accounts.
      // Sales involve the exchange of tokens for some value and are treated differently than transfers.
      updateTransactionCounts(fromAccount, "TRADE");
      updateTransactionCounts(toAccount, "TRADE");
    } else {
      // If OrdersMatched event is not found, update transaction counts as a 'TRANSFER'.
      // Regular transfers involve the movement of tokens without additional value exchange.
      updateTransactionCounts(fromAccount, "TRANSFER");
      updateTransactionCounts(toAccount, "TRANSFER");
    }
  }

  // Update account types and histories.
  // This step ensures that account types are accurate and that transaction history is recorded.
  updateAccountType(fromAccount);
  updateAccountType(toAccount);

  createAccountHistory(fromAccount, determineAccountType(fromAccount));
  createAccountHistory(toAccount, determineAccountType(toAccount));

  // Save the updated account entities.
  // This step ensures that the accounts are stored with all the updated information.
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
