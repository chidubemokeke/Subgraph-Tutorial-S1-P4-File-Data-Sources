import { BigInt, Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { CovenToken, Transaction } from "../../generated/schema";
import { BIGINT_ONE, TRANSFER_EVENT_SIGNATURE_HASH } from "./constant";

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

// Function to fetch Transfer events from a given Ethereum event
export function fetchTransferEvents(event: ethereum.Event): CovenToken[] {
  // Initialize an empty array to store transfer event objects
  let transferEvents: CovenToken[] = [];

  // Loop through all logs associated with the transaction
  for (let i = 0; i < event.receipt!.logs.length; i++) {
    // Access each log entry in the transaction receipt
    let log = event.receipt!.logs[i];

    // Check if the log corresponds to a Transfer event
    // The first topic of the log contains the event signature hash
    // Compare it with the known Transfer event signature hash
    if (log.topics[0].toHexString() == TRANSFER_EVENT_SIGNATURE_HASH) {
      // Decode the log's topics and data into the parameters needed for CovenToken
      // Extract 'from' address from the first topic (index 1)
      let from = Address.fromHexString(log.topics[1].toHexString());

      // Extract 'to' address from the second topic (index 2)
      let to = Address.fromHexString(log.topics[2].toHexString());

      // Extract the tokenId from the log's data
      // Assume tokenId is the first 32 bytes of the log data
      let tokenIdBytes = log.data.subarray(0, 32) as Bytes; // Extract the first 32 bytes
      let tokenId = BigInt.fromUnsignedBytes(tokenIdBytes); // Convert bytes to BigInt

      // Extract additional data from the log's data
      // Assume amount is the next 32 bytes after tokenId
      let amount = log.data.subarray(32, 64) as Bytes; // Extract the next 32 bytes for amount
      // Convert the amount bytes to a BigInt if necessary
      let amountBigInt = BigInt.fromUnsignedBytes(amount); // Convert bytes to BigInt
      // Extract referenceId as a hexadecimal string (example handling)
      let referenceId = log.data.toHexString(); // Convert entire log data to hex string

      // Create a unique ID for this transfer event using the transaction hash and log index
      let uniqueId = event.transaction.hash
        .toHexString()
        .concat("-")
        .concat(i.toString()); // Combine transaction hash and log index to form unique ID

      // Create a new CovenToken entity with the unique ID
      let transferEvent = new CovenToken(uniqueId);

      // Set the fields of the CovenToken entity
      transferEvent.from = from.toHex(); // Set the 'from' address as hex string
      transferEvent.to = to.toHex(); // Set the 'to' address as hex string
      transferEvent.owner = to.toHexString(); // Set the new owner address (receiver)
      transferEvent.tokenId = tokenId; // Set the tokenId of the transferred token
      transferEvent.amount = amountBigInt; // Set the amount of tokens transferred
      transferEvent.referenceId = referenceId; // Set a reference ID for the transaction
      transferEvent.blockNumber = event.block.number; // Record the block number of the transaction
      transferEvent.blockHash = event.block.hash; // Record the block hash of the transaction
      transferEvent.txHash = event.transaction.hash; // Record the transaction hash
      transferEvent.timestamp = event.block.timestamp; // Record the block timestamp

      // Add the decoded CovenToken object to the transferEvents array
      transferEvents.push(transferEvent);
    }
  }

  // Return the array of CovenToken objects containing all extracted transfer events
  return transferEvents;
}

// Function to fetch Transfer events from a given Ethereum event
/**export function fetchTransferEvents(event: ethereum.Event): CovenToken[] {
  let transferEvents: CovenToken[] = [];

  // Loop through all logs associated with the transaction
  for (let i = 0; i < event.receipt!.logs.length; i++) {
    let log = event.receipt!.logs[i];

    // Check if the log corresponds to a Transfer event
    // Compare the log's topic[0] with the computed event signature hash
    if (log.topics[0].toHexString() == TRANSFER_EVENT_SIGNATURE_HASH) {
      // Decode the log's topics and data into the parameters needed for CovenToken
      // Extract 'from' address from the first topic
      let from = Address.fromHexString(log.topics[1].toHexString());
      // Extract 'to' address from the second topic
      let to = Address.fromHexString(log.topics[2].toHexString());

      // Extract the tokenId from the log's data
      // Assuming tokenId is the first 32 bytes of the log data
      let tokenIdBytes = log.data.subarray(0, 32) as Bytes; // Cast to Bytes type
      let tokenId = BigInt.fromUnsignedBytes(tokenIdBytes);

      // Extract additional data if required (example handling)
      // Assuming amount is the next 32 bytes after tokenId
      let amount = log.data.subarray(32, 64) as Bytes; // Cast to Bytes type
      // Extract referenceId as a hexadecimal string (for example purposes)
      let referenceId = log.data.toHexString();

      // Create a unique ID for this transfer event using the transaction hash and log index
      let uniqueId = event.transaction.hash
        .toHexString()
        .concat("-")
        .concat(i.toString());

      // Create or update the CovenToken entity
      let transferEvent = new CovenToken(uniqueId);
      transferEvent.from = from.toHex(); // Set the 'from' address
      transferEvent.to = to.toHex(); // Set the 'to' address
      transferEvent.owner = to.toHexString(); // Set the new owner address (receiver)
      transferEvent.tokenId = tokenId; // Set the tokenId
      transferEvent.amount = BigInt.fromUnsignedBytes(amount); // Example handling of amount
      transferEvent.referenceId = referenceId; // Example handling of referenceId
      transferEvent.blockNumber = event.block.number; // Set the block number
      transferEvent.blockHash = event.block.hash; // Set the block hash
      transferEvent.txHash = event.transaction.hash; // Set the transaction hash
      transferEvent.timestamp = event.block.timestamp; // Set the block timestamp

      // Add the decoded CovenToken object to the transferEvents array
      transferEvents.push(transferEvent);
    }
  }

  // Return the array of CovenToken objects
  return transferEvents;
}

// Function to fetch Transfer events related to a specific transaction
/**export function fetchTransferEvents(event: ethereum.Event): TransferEvent[] {
  let transferEvents: TransferEvent[] = [];

  // Loop through all logs associated with the transaction
  for (let i = 0; i < event.receipt!.logs.length; i++) {
    let log = event.receipt!.logs[i];

    // Check if the log corresponds to a Transfer event (based on the event signature)
    if (log.topics[0].toHexString() == CRYPTOCOVEN_ADDRESS) {
      // Decode the log into the parameters needed for TransferEvent
      let from = Address.fromHexString(log.topics[1].toHexString());
      let to = Address.fromHexString(log.topics[2].toHexString());

      //The subarray method returns a TypedArray, which isn't directly compatible with The Graph's Bytes type.
      // By casting log.data.subarray(0, 32) to Bytes, we make it compatible with BigInt.fromUnsignedBytes.
      // Extract the tokenId from the log data, assuming it occupies the first 32 bytes
      let tokenIdBytes = log.data.subarray(0, 32) as Bytes; // Cast to Bytes type
      let tokenId = BigInt.fromUnsignedBytes(tokenIdBytes);

      // Create a new TransferEvent object
      let transferEvent = new TransferEvent(
        event.address, // Contract address
        from!, // Sender address
        to!, // Recipient address
        tokenId // Token ID
      );

      // Push the decoded TransferEvent object to the transferEvents array
      transferEvents.push(transferEvent);
    }
  }

  // Return the array of TransferEvent objects
  return transferEvents;
}
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
