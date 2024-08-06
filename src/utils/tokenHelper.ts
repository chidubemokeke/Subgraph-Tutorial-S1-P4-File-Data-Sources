import { BigInt, ethereum, Bytes, bigInt } from "@graphprotocol/graph-ts";
import { TokenEvent } from "../../generated/schema";
import { BIGINT_ONE } from "./constant";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";

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

// Helper function to get or create a MintEvent/TransferEvent entity in the CryptoCoven Contract
export function getOrCreateToken(event: TransferEvent): TokenEvent {
  let id = getGlobalId(event);
  let tokenEvent = TokenEvent.load(id);

  if (!tokenEvent) {
    tokenEvent = new TokenEvent(id);
    tokenEvent.contractAddress = event.address;
    tokenEvent.tokenId = BigInt.fromI32(0); // Initialize with zero, will be updated later
    tokenEvent.save();
  }
  return tokenEvent;
}

// Helper function to get tokenId from MintEvent
export function getTokenId(event: OrdersMatchedEvent): BigInt | null {
  let previousLogIndex = event.logIndex.minus(BIGINT_ONE);
  let id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(previousLogIndex.toString());
  let tokenEvent = TokenEvent.load(id);
  return tokenEvent ? tokenEvent.tokenId : null;
}

// Helper function to get owner from previous TransferEvent
export function getTokenOwner(event: ethereum.Event): Bytes | null {
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
  return transferEvent ? transferEvent as MintEvent : null;
}