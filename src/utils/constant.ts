import { BigInt, Bytes } from "@graphprotocol/graph-ts";

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const ZERO_ADDRESS = Bytes.fromHexString(
  "0x0000000000000000000000000000000000000000"
);
// Define the Transfer event signature constant to help when looping through events
export const TRANSFER_EVENT_SIGNATURE = "0xddf252ad";

export const CRYPTOCOVEN_ADDRESS = "0x5180db8F5c931aaE63c74266b211F580155ecac8";

// Thresholds for determining account types
/**const OG_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 mint required for OG status
const COLLECTOR_MINT_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 mint required for Collector status
const COLLECTOR_BUY_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 purchase required for Collector status
const HUNTER_MINT_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 mint required for Hunter status
const HUNTER_SALE_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 sale required for Hunter status
const FARMER_MINT_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 mint required for Farmer status
const FARMER_SALE_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 sale required for Farmer status
const FARMER_BUY_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 purchase required for Farmer status
const TRADER_BUY_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 purchase required for Trader status
const TRADER_SALE_THRESHOLD: BigInt = BigInt.fromI32(1); // Minimum of 1 sale required for Trader status**/
