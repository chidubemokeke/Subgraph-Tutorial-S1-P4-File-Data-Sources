import {
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { CovenToken } from "../../generated/schema";
import { BIGINT_ZERO, BIGDECIMAL_ZERO, TRANSFER_EVENT_SIG } from "./constant";

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
 * Function to calculate the highest sale price.
 *
 * This function checks whether the current sale price is higher than the previous
 * highest sale price. If it is, it updates the highest sale price. If this is the
 * first transaction and there is no previous highest sale price (i.e., `previousHighestPrice` is null),
 * the current sale price is set as the highest sale price.
 *
 * @param currentPrice - The price of the current sale.
 * @param previousHighestPrice - The previously recorded highest sale price, or null if this is the first transaction.
 * @returns - The updated highest sale price.
 */
export function calculateHighestSalePrice(
  currentPrice: BigInt,
  previousHighestPrice: BigInt | null
): BigInt {
  // If there's no previous highest sale price (i.e., first transaction), set the current sale price as the highest.
  if (previousHighestPrice == null) {
    return currentPrice;
  }
  // Compare the current sale price with the previous highest sale price and return the higher value.
  // If the current sale price is higher, it becomes the new highest sale price.
  return currentPrice.gt(previousHighestPrice)
    ? currentPrice
    : previousHighestPrice;
}

/**
 * Function to calculate the lowest sale price.
 *
 * This function checks whether the current sale price is lower than the previous
 * lowest sale price. If it is, it updates the lowest sale price. If this is the
 * first transaction and there is no previous lowest sale price (i.e., `previousLowestPrice` is null),
 * the current sale price is set as the lowest sale price.
 *
 * @param currentPrice - The price of the current sale.
 * @param previousLowestPrice - The previously recorded lowest sale price, or null if this is the first transaction.
 * @returns - The updated lowest sale price.
 */
export function calculateLowestSalePrice(
  currentPrice: BigInt,
  previousLowestPrice: BigInt | null
): BigInt {
  // If there's no previous lowest sale price (i.e., first transaction), set the current sale price as the lowest.
  if (previousLowestPrice == null) {
    return currentPrice;
  }
  // Compare the current sale price with the previous lowest sale price and return the lower value.
  // If the current sale price is lower, it becomes the new lowest sale price.
  return currentPrice.lt(previousLowestPrice)
    ? currentPrice
    : previousLowestPrice;
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
    token.tokenId = tokenId.toHex();

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

/**
 * Extracts the tokenId from the event logs associated with a specific Ethereum event.
 *
 * This function processes the logs of an Ethereum event to locate and extract the tokenId
 * from a Transfer event. It verifies that the log is from the specified token contract
 * and that it contains valid tokenId information.
 *
 * @param event - The Ethereum event object containing the logs from which to extract the tokenId.
 * @param tokenContract - The address of the token contract to verify against.
 * @returns The extracted tokenId if found, otherwise null.
 */
export function extractTokenId(
  event: ethereum.Event,
  tokenContract: string
): BigInt | null {
  // Step 1: Check if the event receipt contains logs.
  // If no logs are found, log a warning and return null.
  if (!event.receipt || event.receipt.logs.length === 0) {
    log.warning("[extractTokenId] No logs found in event receipt", []);
    return null;
  }

  // Step 2: Extract logs from the event receipt.
  // Retrieve the list of logs associated with the event.
  const logs = event.receipt!.logs;

  // Step 3: Find the log index of the OrdersMatched event.
  // Determine the index of the log that corresponds to the OrdersMatched event.
  const ordersMatchedLogIndex = event.logIndex;
  let targetLogIndex = -1;

  // Loop through the logs to find the log preceding the OrdersMatched event.
  for (let i = 0; i < logs.length; i++) {
    // Compare each log index with the OrdersMatched event log index.
    if (logs[i].logIndex.equals(ordersMatchedLogIndex)) {
      // Set the target index to the log immediately before the OrdersMatched event.
      targetLogIndex = i - 1;
      break;
    }
  }

  // Step 4: Validate the target log index.
  // Ensure that the target log index is within valid bounds.
  if (targetLogIndex < 0 || targetLogIndex >= logs.length) {
    log.warning(
      "[extractTokenId] OrdersMatched event log index out of bounds",
      []
    );
    return null;
  }

  // Step 5: Extract the token log using the target log index.
  // Retrieve the log that contains the tokenId data.
  const tokenLog = logs[targetLogIndex];
  const topics = tokenLog.topics;

  // Step 6: Verify if the log corresponds to a Transfer event.
  // Check the topics to determine if this log is for a Transfer event.
  if (topics.length > 0 && topics[0].equals(TRANSFER_EVENT_SIG)) {
    // Decode the 'from' and 'to' addresses from the log topics.
    const from = ethereum
      .decode("address", topics[1])!
      .toAddress()
      .toHexString();
    const to = ethereum.decode("address", topics[2])!.toAddress().toHexString();

    // Step 7: Verify that the log is from the specified token contract.
    // Ensure that the log's contract address matches the provided token contract address.
    if (tokenLog.address.toHexString() === tokenContract) {
      // Decode the tokenId from the log data.
      const dataValue = ethereum.decode("uint256", tokenLog.data);
      if (dataValue) {
        const tokenId = dataValue.toBigInt();

        // Step 8: Ensure tokenId is valid before returning.
        // Ensure that the tokenId is not null before proceeding.
        if (tokenId) {
          // Create or update the CovenToken entity with the new tokenId.
          // The tokenId is valid, so we call createOrUpdateCovenToken to handle it.
          createOrUpdateCovenToken(tokenId);
          return tokenId;
        }
      }
    }
  }

  // Step 9: Log a warning if tokenId extraction fails.
  // If the function reaches this point, it means the extraction was unsuccessful.
  log.warning("[extractTokenId] TokenId extraction failed", []);
  return null;
}

/*export function getTokenIdFromReceipt(event: ethereum.Event): BigInt | null {
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
}*/
