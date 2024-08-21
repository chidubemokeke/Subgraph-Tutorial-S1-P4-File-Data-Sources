import { log } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import {
  loadOrCreateAccount,
  createAccountHistory,
  updateTransactionCounts,
  updateAccountType,
  determineAccountType,
} from "../helpers/accountHelper";
import {
  checkForOrdersMatched,
  createOrUpdateCovenToken,
} from "../helpers/utils";
import { ZERO_ADDRESS } from "../helpers/constant";

export @enum {
  MINT
  TRADE
  TRANSFER
}


/**
 * Handles Transfer events from the smart contract.
 *
 * This function manages the entire lifecycle of a token transfer event. It handles
 * the creation and updating of account and token entities, determines the type of
 * transaction (mint, transfer, or trade), and updates transaction counts accordingly.
 *
 * @param event - The Transfer event object containing information about the token transfer.
 */
export function handleTransfer(event: TransferEvent): void {
  // Step 1: Load or create Account entities for the 'from' and 'to' addresses involved in the transfer.
  // This ensures that both accounts exist in the subgraph, even if they haven't interacted before.
  let fromAccount = loadOrCreateAccount(event.params.from);
  let toAccount = loadOrCreateAccount(event.params.to);

  // Step 2: Initialize transaction details for both accounts.
  // This includes setting the log index, transaction hash, block number, and timestamp
  // to capture the most recent transaction details for these accounts.
  fromAccount.logIndex = event.logIndex;
  fromAccount.txHash = event.transaction.hash;
  fromAccount.blockNumber = event.block.number;
  fromAccount.blockTimestamp = event.block.timestamp;

  toAccount.logIndex = event.logIndex;
  toAccount.txHash = event.transaction.hash;
  toAccount.blockNumber = event.block.number;
  toAccount.blockTimestamp = event.block.timestamp;

  // Step 3: Load or create the CovenToken entity associated with this tokenId.
  // This ensures that the token entity is properly initialized and can be updated with new data.
  let token = createOrUpdateCovenToken(event.params.tokenId);

  // Step 4: Update the token's fields based on the event data.
  // The token entity is updated with the latest transaction details to ensure accurate tracking
  // of its ownership and transaction history.
  token.logIndex = event.logIndex;
  token.txHash = event.transaction.hash;
  token.blockNumber = event.block.number;
  token.blockTimestamp = event.block.timestamp;
  token.owner = event.params.to; // Update the owner of the token to the 'to' address.

  // Step 5: Determine if the transaction is a mint operation.
  // A mint operation occurs when the 'from' address is the zero address, indicating that
  // the token is being created rather than transferred.
  let isMint = event.params.from == ZERO_ADDRESS;

  // Save the updated CovenToken entity.
  // It's important to save the token entity after updating its fields to persist these changes.
  token.save();

  // Step 6: Determine the transaction type using the checkForOrdersMatched function.
  // If it's a mint, we classify the transaction as "MINT".
  // Otherwise, we check if it's a trade by using checkForOrdersMatched function. If a trade
  // is detected, the transaction type is set to "TRADE". If not, it's classified as a "TRANSFER".
  let transactionType = isMint
    ? "MINT"
    : checkForOrdersMatched(event)
      ? "TRADE"
      : "TRANSFER";

  // Step 7: Update transaction counts based on the determined transaction type.
  // This step ensures that the appropriate counters are incremented based on the type of transaction.
  if (transactionType === "MINT") {
    // For mint transactions, we update the transaction counts for the recipient account.
    updateTransactionCounts(toAccount, "MINT");
  } else if (transactionType === "TRADE") {
    // For trade transactions, we update the transaction counts for both the sender and recipient accounts.
    updateTransactionCounts(fromAccount, "TRADE");
    updateTransactionCounts(toAccount, "TRADE");
  } else {
    // For transfer transactions, we update the transaction counts for both the sender and recipient accounts.
    updateTransactionCounts(fromAccount, "TRANSFER");
    updateTransactionCounts(toAccount, "TRANSFER");
  }

  // Step 8: Update account types and histories.
  // This step involves updating the account types (e.g., whether the account is a buyer, seller, etc.)
  // and creating account history entities to track past transactions.
 determineAccountType(fromAccount);
  determineAccountType(toAccount);

  updateAccountType(fromAccount);
  updateAccountType(toAccount);

  // Creating account history records for both accounts involved in the transaction.
  createAccountHistory(fromAccount);
  createAccountHistory(toAccount);
}