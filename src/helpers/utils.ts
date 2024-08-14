import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { CovenToken } from "../../generated/schema";
import { CRYPTOCOVEN_ADDRESS, BIGINT_ZERO } from "./constant";

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
    token.tokenMintCount = BigInt.fromI32(0); // Default value for newly minted tokens
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
 * Validates and returns the transaction type from a predefined set of types.
 * The allowed types are "TRADE", "MINT", and "TRANSFER".
 * If the provided type is not one of these, the function throws an error.
 *
 * @param type - The transaction type as a string.
 * @returns The validated transaction type.
 * @throws Error if the transaction type is invalid.
 */
export function getTransactionType(type: string): string {
  // Check if the provided type matches one of the predefined transaction types.
  if (type == "TRADE" || type == "MINT" || type == "TRANSFER") {
    return type; // Return the valid transaction type.
  } else {
    // Throw an error if the type is invalid, providing feedback on the mistake.
    throw new Error("Invalid transaction type: " + type);
  }
}

// Helper function to extract tokenId from logs using transaction receipt
export function getTokenIdFromReceipt(
  receipt: ethereum.TransactionReceipt
): string | null {
  for (let i = 0; i < receipt.logs.length; i++) {
    let log = receipt.logs[i];

    // Check if the log comes from the CryptoCoven contract (by comparing addresses)
    if (log.address.toHex() == CRYPTOCOVEN_ADDRESS) {
      // Parse the log to extract the tokenId (assuming the log contains this data)
      let decodedLog = ethereum.decode("(address,address,uint256)", log.data);
      if (decodedLog) {
        let tuple = decodedLog.toTuple();
        let tokenId = tuple[2].toBigInt();
        return tokenId.toString();
      }
    }
  }
  return null;
}

/**
 * Extracts the total NFTs involved in the transaction by analyzing logs in the transaction receipt.
 * The function loops through logs emitted by the specified contract and decodes the quantity of NFTs sold.
 *
 * @param event - The Ethereum event that triggered the transaction.
 * @returns The total number of NFTs in the transaction.
 */
export function extractNFTsFromLogs(event: ethereum.Event): BigInt {
  // Initialize the total NFTs sold (On the assumption that more than one NFT could be sold.)
  let totalNFTs = BIGINT_ZERO;

  // Retrieve the transaction receipt to access logs
  let receipt = event.receipt;

  if (receipt) {
    // Loop through each log in the receipt
    for (let i = 0; i < receipt.logs.length; i++) {
      let log = receipt.logs[i];

      // Check if the log comes from the CryptoCoven contract address
      if (log.address.toHex() == CRYPTOCOVEN_ADDRESS) {
        // Decode the log data
        let decodedData = ethereum.decode("(uint256[])", log.data);

        // Check if the decoded data is valid and has the expected type
        if (decodedData && Array.isArray(decodedData)) {
          // Extract the quantity from the decoded data
          let quantities = decodedData as BigInt[];
          for (let j = 0; j < quantities.length; j++) {
            totalNFTs = totalNFTs.plus(quantities[j]);
          }
        }
      }
    }
  }

  // Return the total number of NFTs sold
  return totalNFTs;
}
