import { ethereum } from "@graphprotocol/graph-ts";
import { CovenToken } from "../../generated/schema";
import { BIGINT_ONE } from "./constant";

// Helper function to generate a unique ID for tracking log indices
export function getGlobalId(event: ethereum.Event): string {
  // Get the transaction hash as a hexadecimal string
  let globalId = event.transaction.hash
    .toHexString()
    // Concatenate a hyphen to the hexadecimal string
    .concat("-")
    // Concatenate the log index of the event to the resulting string
    .concat(event.logIndex.toString());
  return globalId; // Return the generated globalId
}

// This function creates or loads the CovenToken entity on demand.
// We need it to carry values over to events where those values don't exist.
export function getOrCreateCovenToken(event: ethereum.Event): CovenToken {
  let covenToken = CovenToken.load(getGlobalId(event));

  if (!covenToken) {
    covenToken = new CovenToken(getGlobalId(event));
    covenToken.referenceId = covenToken.id;
    covenToken.blockNumber = event.block.number;
    covenToken.blockHash = event.block.hash;
    covenToken.txHash = event.transaction.hash;
    covenToken.timestamp = event.block.timestamp;
  }
  return covenToken as CovenToken;
}

// Helper function to get tokenId from TransferEvent
// We need the tokenID to validate the sale in OrderMatched() event in OpenSea's Contract
// TokenId should exist with the given ID in the same transaction at the time it's being called in OrderMatched() event.
// The transfer always come first, so we need to provide the correct logIndex
export function getTokenId(event: ethereum.Event): string | null {
  let covenLogIndex = event.logIndex.minus(BIGINT_ONE);

  let id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(covenLogIndex.toString());

  //  We only care about transactions concerning CryptoCoven contract, should exist with the given ID.

  let covenToken = CovenToken.load(id);

  // if it doesn't then it's not a CryptoCoven transaction
  if (!covenToken) {
    return null;
  }

  // if it does, then return the contract Address to enable us validate the transaction in handleBuy()
  let tokenId = covenToken.referenceId;
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
