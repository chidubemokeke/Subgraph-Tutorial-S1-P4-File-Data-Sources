import { BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { CovenToken } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  CRYPTOCOVEN_ADDRESS,
  OPENSEA_ADDRESS,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
} from "./constant";

/**
 * Generates a unique identifier for a specific event in a transaction.
 * This identifier is a combination of the transaction hash and the log index,
 * ensuring that each event within a transaction can be uniquely identified.
 *
 * @param event - The Ethereum event object containing transaction details.
 * @returns A unique string identifier for the event.
 */
export function getGlobalId(event: ethereum.Event): string {
  // Concatenate the transaction hash (converted to a hexadecimal string)
  // with the log index (converted to a string) using a hyphen as a separator.
  let globalId = event.transaction.hash
    .toHexString() // Convert transaction hash to a hexadecimal string.
    .concat("-") // Add a hyphen for separation.
    .concat(event.logIndex.toString()); // Convert log index to a string and concatenate.

  // Return the combined string as the unique identifier for the event.
  return globalId;
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

// Helper function to update or create a CovenToken
export function updateTokenOwner(
  tokenId: BigInt,
  newOwner: Bytes,
  logIndex: BigInt,
  txHash: Bytes,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  // Load the token entity or create a new one if it doesn't exist
  let token = CovenToken.load(tokenId.toString());

  if (!token) {
    // Initialize a new CovenToken entity if it does not exist
    token = new CovenToken(tokenId.toString());
    token.tokenId = tokenId;
    token.tokenMintCount = BIGINT_ZERO; // Default value for newly minted tokens
  }

  // Update token details
  token.owner = newOwner;
  token.logIndex = logIndex;
  token.txHash = txHash;
  token.blockNumber = blockNumber;
  token.blockTimestamp = blockTimestamp;

  // Save the token entity to the store
  token.save();
}

/**
 * Extracts the tokenId from logs in a transaction receipt.
 * This function assumes the logs are from the CryptoCoven contract and contains the tokenId in its data.
 *
 * @param receipt - The Ethereum transaction receipt containing logs.
 * @returns The tokenId extracted from the logs as a BigInt, or null if not found.
 */
export function getTokenIdFromReceipt(
  receipt: ethereum.TransactionReceipt
): BigInt | null {
  // Iterate through each log in the transaction receipt
  for (let i = 0; i < receipt.logs.length; i++) {
    let log = receipt.logs[i];

    // Check if the log is from the CryptoCoven contract
    if (log.address.toHex() == CRYPTOCOVEN_ADDRESS) {
      // Decode the log data to extract the tokenId
      let decodedLog = ethereum.decode("(address,address,uint256)", log.data);
      if (decodedLog) {
        let tuple = decodedLog.toTuple();
        let tokenId = tuple[2].toBigInt(); // Extract tokenId from the decoded log
        return tokenId; // Return the tokenId as a BigInt
      }
    }
  }
  return null; // Return null if no tokenId is found
}

/**
 * Extracts the total number of NFTs involved in the transaction from the logs.
 * This function assumes that logs from the CryptoCoven contract contain NFT quantities in their data.
 *
 * @param receipt - The Ethereum transaction receipt containing logs.
 * @returns The total number of NFTs involved in the transaction as a BigInt.
 */
export function extractNFTsFromLogs(
  receipt: ethereum.TransactionReceipt
): BigInt {
  // Initialize the total number of NFTs
  let totalNFTs = BIGINT_ZERO;

  // Check if the receipt is valid
  if (receipt) {
    // Iterate through each log in the transaction receipt
    for (let i = 0; i < receipt.logs.length; i++) {
      let log = receipt.logs[i];

      // Check if the log is from the CryptoCoven contract
      if (log.address.toHex() == CRYPTOCOVEN_ADDRESS) {
        // Decode the log data to extract NFT quantities
        let decodedData = ethereum.decode("(uint256[])", log.data);

        // Check if the decoded data is valid
        if (decodedData) {
          let quantities = decodedData.toBigIntArray(); // Convert decoded data to BigInt array
          // Sum up all NFT quantities
          for (let j = 0; j < quantities.length; j++) {
            totalNFTs = totalNFTs.plus(quantities[j]);
          }
        }
      }
    }
  }

  return totalNFTs; // Return the total number of NFTs
}
