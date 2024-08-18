import {
  Address,
  BigDecimal,
  BigInt,
  ByteArray,
  Bytes,
  ethereum,
  log,
  crypto,
} from "@graphprotocol/graph-ts";
import { CovenToken } from "../../generated/schema";
import {
  OPENSEA_ADDRESS,
  ordersMatchedEventSignature,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  ZERO_ADDRESS,
  TRANSFER_EVENT_SIG,
} from "./constant";

/**
 * Generates a unique identifier for a Transaction entity.
 * The identifier is based on the transaction hash and log index.
 *
 * @param txHash - The hash of the transaction.
 * @param logIndex - The index of the log within the transaction.
 * @returns A unique string identifier for the Transaction entity.
 */
export function getTransactionId(txHash: Bytes, logIndex: BigInt): string {
  // Convert the transaction hash to a hex string and append the log index as a string.
  let id = txHash.toHex() + "-" + logIndex.toString();
  return id;
}

/**
 * Calculates the average sale price from a list of sale prices.
 *
 * @param totalSalesVolume - The total sales volume (sum of all sale prices).
 * @param totalSalesCount - The total number of sales.
 * @returns The average sale price as a BigDecimal.
 */
export function calculateAverageSalePrice(
  totalSalesVolume: BigInt,
  totalSalesCount: BigInt
): BigDecimal {
  // Check if there have been any sales
  if (totalSalesCount.equals(BIGINT_ZERO)) {
    // If no sales, return 0 as the average price
    return BIGDECIMAL_ZERO;
  }

  // Convert the total sales volume and count to BigDecimal for division
  let totalSalesVolumeDecimal = totalSalesVolume.toBigDecimal();
  let totalSalesCountDecimal = totalSalesCount.toBigDecimal();

  // Calculate the average sale price by dividing total sales volume by total sales count
  return totalSalesVolumeDecimal.div(totalSalesCountDecimal);
}

/**
 * Determines the highest sale price from a list of sale prices.
 *
 * @param salePrices - An array of sale prices.
 * @returns The highest sale price as a BigInt.
 */
export function calculateHighestSalePrice(salePrices: BigInt[]): BigInt {
  // Check if there are any sale prices in the array
  if (salePrices.length === 0) {
    // If no sale prices, return 0 as the highest price
    return BIGINT_ZERO;
  }

  // Initialize the highest price with a starting value of 0
  let highestPrice = BIGINT_ZERO;

  // Loop through the list of sale prices to find the highest one
  for (let i = 0; i < salePrices.length; i++) {
    // Check if the current sale price is greater than the current highest price
    if (salePrices[i].gt(highestPrice)) {
      // If it is, update the highest price to the current sale price
      highestPrice = salePrices[i];
    }
  }

  // Return the highest sale price found in the array
  return highestPrice;
}

/**
 * Determines the lowest sale price from a list of sale prices.
 *
 * @param salePrices - An array of sale prices.
 * @returns The lowest sale price as a BigInt.
 */
export function calculateLowestSalePrice(salePrices: BigInt[]): BigInt {
  // Check if there are any sale prices in the array
  if (salePrices.length === 0) {
    // If no sale prices, return 0 as the lowest price
    return BIGINT_ZERO;
  }

  // Initialize the lowest price with the first sale price in the array
  let lowestPrice = salePrices[0];

  // Loop through the rest of the sale prices to find the lowest one
  for (let i = 1; i < salePrices.length; i++) {
    // Check if the current sale price is less than the current lowest price
    if (salePrices[i].lt(lowestPrice)) {
      // If it is, update the lowest price to the current sale price
      lowestPrice = salePrices[i];
    }
  }

  // Return the lowest sale price found in the array
  return lowestPrice;
}

/**
 * Creates or updates a CovenToken entity using the tokenId as the primary parameter.
 *
 * @param tokenId - The unique ID of the token being transferred.
 */
export function createOrUpdateCovenToken(tokenId: BigInt): CovenToken {
  // Convert the tokenId to a hex string to use as the ID for the CovenToken entity.
  let id = tokenId.toHex();

  // Attempt to load an existing CovenToken entity using the generated ID.
  let token = CovenToken.load(id);

  if (token == null) {
    // If the entity does not exist, create a new one.
    token = new CovenToken(id);

    // Set the tokenId field on the newly created entity.
    token.tokenId = tokenId;

    // Initialize the tokenMintCount to zero since this is a new entity.
    token.tokenMintCount = BIGINT_ZERO;

    // Initialize transaction-related fields with zero values.
    token.logIndex = BIGINT_ZERO;
    token.txHash = Bytes.empty();
    token.blockNumber = BigInt.zero();
    token.blockTimestamp = BigInt.zero();

    // Placeholder for `from`, `to`, and `owner` fields, to be set later.
    // token.from = ...; // To be set based on event data.
    // token.to = ...;   // To be set based on event data.
    // token.owner = ...; // To be set based on event data.
  }

  // Save the entity to the store.
  token.save();
  return token as CovenToken;
}

export function getTokenIdFromReceipt(event: ethereum.Event): BigInt | null {
  // Ensure the event has a receipt
  if (!event.receipt) {
    log.warning("[getTokenIdFromReceipt][{}] has no event.receipt", [
      event.transaction.hash.toHexString(),
    ]);
    return null;
  }

  // Extract the log index of the current event
  const currentEventLogIndex = event.logIndex;
  // Retrieve the logs from the transaction receipt
  const logs = event.receipt!.logs;
  // Compute the Keccak-256 hash of the OrdersMatched event signature
  const ordersMatchedSig = crypto.keccak256(
    ByteArray.fromUTF8(
      "OrdersMatched(bytes32,bytes32,address,address,uint256,uint256,uint256,uint256,address,uint8,uint8,uint8,bytes32)"
    )
  );

  // Initialize a variable to keep track of the index where the OrdersMatched event is found
  let foundIndex: i32 = -1;
  // Loop through the logs to find the log with the same log index as the current event
  for (let i = 0; i < logs.length; i++) {
    const currLog = logs.at(i);

    // Check if the current log index matches the index of the current event
    if (currLog.logIndex.equals(currentEventLogIndex)) {
      // Record the index where the OrdersMatched event is found
      foundIndex = i;
      // Exit the loop as we have found the target log
      break;
    }
  }

  // If a log with the OrdersMatched event was found
  if (foundIndex > 0) {
    // Retrieve the previous log (one index before the OrdersMatched event)
    const prevLog = logs.at(foundIndex - 1);
    // Extract the topic0 from the previous log to identify the event signature
    const topic0Sig = prevLog.topics.at(0); // topic0 is used to identify the event type
    // Check if the event signature matches the OrdersMatched event signature
    if (topic0Sig.equals(ordersMatchedSig)) {
      // Decode the tokenId from the previous log's data
      // Assuming tokenId is encoded as uint256 and is at the start of the data
      const tokenId = ethereum
        .decode("uint256", Bytes.fromUint8Array(prevLog.data.subarray(0, 32)))!
        .toBigInt();
      // Return the decoded tokenId
      return tokenId;
    }
  }

  // Return null if no matching tokenId was found
  return null;
}
/**
 * Extracts the tokenId from logs in a transaction receipt.
 * This function assumes the logs are from the CryptoCoven contract and contains the tokenId in its data.
 *
 * @param receipt - The Ethereum transaction receipt containing logs.
 * @returns The tokenId extracted from the logs as a BigInt, or null if not found.
 */
/**export function getTokenIdFromReceipt(
  receipt: ethereum.TransactionReceipt
): BigInt | null {
  // Define the event signature for the Transfer event

  // Iterate over the logs in the receipt
  for (let i = 0; i < receipt.logs.length; i++) {
    let eventLog = receipt.logs[i];

    // Check if the log is from the CryptoCoven contract and matches the Transfer event signature
    if (
      eventLog.address == OPENSEA_ADDRESS &&
      eventLog.topics[0].toHexString() == TRANSFER_EVENT_SIG
    ) {
      // The Transfer event has 3 topics (indexed parameters) and 1 data field (non-indexed parameter)
      // topics[1] = from (address)
      // topics[2] = to (address)
      // topics[3] = tokenId (uint256)

      // Decode the tokenId from the second topic (it’s indexed)
      let tokenId = BigInt.fromUnsignedBytes(eventLog.topics[2]);

      log.info("Token ID extracted: {}", [tokenId.toString()]);

      return tokenId;
    }
  }

  // If no tokenId is found, return null
  log.warning("No tokenId found in the logs for the CryptoCoven contract.", []);
  return null;
}**/

/**
 * Extracts the total number of NFTs involved in the transaction from the logs.
 * This function assumes that logs from the OpenSea contract contain NFT quantities in their data.
 *
 * @param event - The Ethereum event containing the transaction receipt.
 * @returns An array of BigInt representing the token IDs of NFTs involved in the transaction, or an empty array if not found.
 */
export function extractNFTsFromLogs(event: ethereum.Event): Array<BigInt> {
  // Ensure the event has a receipt
  if (!event.receipt) {
    log.warning("[extractNFTsFromLogs][{}] has no event.receipt", [
      event.transaction.hash.toHexString(),
    ]);
    return [];
  }

  // Extract the log index of the current event
  const currentEventLogIndex = event.logIndex;
  // Retrieve the logs from the transaction receipt
  const logs = event.receipt!.logs;
  // Compute the Keccak-256 hash of the OrdersMatched event signature
  const ordersMatchedSig = crypto.keccak256(
    ByteArray.fromUTF8(
      "OrdersMatched(bytes32,bytes32,address,address,uint256,uint256,uint256,uint256,address,uint8,uint8,uint8,bytes32)"
    )
  );

  // Initialize an array to store the extracted NFT token IDs
  let nftTokenIds: Array<BigInt> = [];
  // Flag to start processing logs after the current event's log index
  let processLogs = false;

  // Iterate through all logs in the receipt
  for (let i = 0; i < logs.length; i++) {
    const currLog = logs.at(i);

    // Set the flag to start processing when reaching the log index of the current event
    if (currLog.logIndex.equals(currentEventLogIndex)) {
      processLogs = true;
    }

    // Only process logs after the current event's log index
    if (processLogs) {
      // Check if the current log's topic0 matches the OrdersMatched event signature
      const topic0Sig = currLog.topics.at(0);
      if (topic0Sig.equals(ordersMatchedSig)) {
        // Extract data from the log
        // Assuming the log data contains NFT token IDs starting from byte 32 onwards
        // Log data format: [32 bytes of extra data][32 bytes of token ID]
        const data = currLog.data;
        // Determine the number of NFTs by examining the length of data
        const numNFTs = (data.length - 32) / 32; // each token ID is 32 bytes

        // Extract each token ID from the log data
        for (let j = 0; j < numNFTs; j++) {
          // Extract the token ID from the data
          const start = 32 + j * 32;
          const end = start + 32;
          const tokenId = ethereum
            .decode("uint256", Bytes.fromUint8Array(data.subarray(start, end)))!
            .toBigInt();

          // Add the extracted token ID to the array
          nftTokenIds.push(tokenId);
        }
      }
    }
  }

  // Return the array of extracted NFT token IDs
  return nftTokenIds;
}
