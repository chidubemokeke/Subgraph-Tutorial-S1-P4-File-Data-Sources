import { BigInt, ethereum, Bytes } from "@graphprotocol/graph-ts";
import { TokenEvent, CovenToken } from "../../generated/schema";
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

// Helper function to get or create a MintEvent/TransferEvent entity in the CryptoCoven Contract
export function getOrCreateTokenEvent(event: ethereum.Event): TokenEvent {
  let id = getGlobalId(event);
  let tokenEvent = TokenEvent.load(id);
  if (!tokenEvent) {
    tokenEvent = new TokenEvent(id);
    tokenEvent.contractAddress = event.address;
    tokenEvent.tokenId = BigInt.zero(); // Initialize with zero, will be updated later
    tokenEvent.save();
  }
  return tokenEvent as TokenEvent;
}

// Helper function to get tokenId from MintEvent
export function getTokenId(event: ethereum.Event): BigInt | null {
  let previousLogIndex = event.logIndex.minus(BIGINT_ONE);
  let id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(previousLogIndex.toString());
  let tokenEvent = TokenEvent.load(id);
  return tokenEvent ? tokenEvent.tokenId : null;
}

// Load or create an NFT entity based on tokenId and contractAddress
export function getOrCreateCovenToken(
  tokenId: BigInt,
  contractAddress: Bytes
): CovenToken {
  let nft = CovenToken.load(tokenId.toHex()); // Load NFT entity using tokenId
  if (!nft) {
    nft = new CovenToken(tokenId.toHex()); // Create a new NFT entity if it doesn't exist
    nft.tokenId = tokenId;
    nft.contractAddress = contractAddress;
    nft.save(); // Save the new NFT entity
  }
  return nft;
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
