import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import {
  loadOrCreateAccount,
  createAccountHistory,
  updateTransactionCounts,
  updateAccountType,
} from "../helpers/accountHelper";
import { createOrUpdateCovenToken } from "../helpers/utils";
import { ZERO_ADDRESS } from "../helpers/constant";
import { processTransactionReceipt } from "../helpers/transactionHelper";

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
    // For non-mint transactions, determine if the transaction is a sale or a transfer.

    // Use the processTransactionReceipt function to check for an OrdersMatched event.
    let isOrdersMatched = processTransactionReceipt(event);

    if (isOrdersMatched) {
      // If OrdersMatched event is found, update transaction counts as a 'TRADE' for both accounts.
      updateTransactionCounts(fromAccount, "TRADE");
      updateTransactionCounts(toAccount, "TRADE");
    } else {
      // If OrdersMatched event is not found, update transaction counts as a 'TRANSFER'.
      updateTransactionCounts(fromAccount, "TRANSFER");
      updateTransactionCounts(toAccount, "TRANSFER");
    }
  }

  // Update account types and histories.
  updateAccountType(fromAccount);
  updateAccountType(toAccount);

  createAccountHistory(fromAccount);
  createAccountHistory(toAccount);

  // Save the updated account entities.
  fromAccount.save();
  toAccount.save();
}
