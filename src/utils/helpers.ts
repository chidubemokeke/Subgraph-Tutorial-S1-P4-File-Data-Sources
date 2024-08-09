import { ethereum } from "@graphprotocol/graph-ts";
import { CovenToken } from "../../generated/schema";
import { BIGINT_ONE } from "./constant";

// Helper function to generate a unique ID for tracking log indices and account-specific history
export function getGlobalId(event: ethereum.Event, accountId: string): string {
  // Get the transaction hash as a hexadecimal string
  let globalId = event.transaction.hash
    .toHexString()
    // Concatenate a hyphen to the hexadecimal string
    .concat("-")
    // Concatenate the log index of the event to the resulting string
    .concat(event.logIndex.toString())
    // Concatenate the account ID to ensure uniqueness across different accounts
    .concat("-")
    .concat(accountId);
  return globalId; // Return the generated globalId
}

// This function creates or loads the CovenToken entity on demand.
// We need it to carry values over to events where those values don't exist (ordersMatched on OpenSea).
export function getOrCreateCovenToken(
  event: ethereum.Event,
  accountId: string
): CovenToken {
  // Generate the unique ID using the updated getGlobalId function that includes the account ID
  let covenTokenId = getGlobalId(event, accountId);

  // Try to load the CovenToken entity with this ID
  let covenToken = CovenToken.load(covenTokenId);

  // If it doesn't exist, create a new CovenToken entity with this ID
  if (!covenToken) {
    covenToken = new CovenToken(covenTokenId);
    covenToken.referenceId = covenToken.id; // Reference ID for potential cross-referencing
    covenToken.blockNumber = event.block.number; // Set the block number
    covenToken.blockHash = event.block.hash; // Set the block hash
    covenToken.txHash = event.transaction.hash; // Set the transaction hash
    covenToken.timestamp = event.block.timestamp; // Set the timestamp of the event
  }

  // Return the CovenToken entity, either loaded or newly created
  return covenToken as CovenToken;
}

// Helper function to get tokenId from TransferEvent
// We need the tokenID to validate the sale in OrderMatched() event in OpenSea's Contract
// TokenId should exist with the given ID in the same transaction at the time it's being called in OrderMatched() event.
// The transfer always comes first, so we need to provide the correct logIndex
export function getTokenId(
  event: ethereum.Event,
  accountId: string
): string | null {
  // Calculate the previous log index (since TransferEvent comes first)
  let covenLogIndex = event.logIndex.minus(BIGINT_ONE);

  // Generate a unique ID using the event and accountId, incorporating covenLogIndex manually
  let id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(covenLogIndex.toString())
    .concat("-")
    .concat(accountId);

  // Load the CovenToken entity using this ID
  let covenToken = CovenToken.load(id);

  // If the CovenToken doesn't exist, it means it's not a relevant transaction (not a CryptoCoven transaction)
  if (!covenToken) {
    return null;
  }

  // If it exists, return the tokenId to validate the transaction in handleBuy()
  let tokenId = covenToken.id;
  return tokenId as string;
}

// Helper function to get owner from previous TransferEvent
/**export function getTokenOwner(event: ethereum.Event): Bytes | null {
  let previousLogIndex = event.logIndex.minus(BigInt.fromI32(1));
  let id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(previousLogIndex.toString());
  let tokenEvent = TokenEvent.load(id);
  return tokenEvent ? tokenEvent.contractAddress : null;
}

// Helper function to get a specific TransferEvent
export function getTransferEventById(event: ethereum.Event): MintEvent | null {
  // Generate a unique ID for the event
  let id = getGlobalId(event);

  // Load the TransferEvent from the store using the generated ID
  let transferEvent = MintEvent.load(id);

  // Return the TransferEvent if found, otherwise null
  return transferEvent ? (transferEvent as MintEvent) : null;
}**/
