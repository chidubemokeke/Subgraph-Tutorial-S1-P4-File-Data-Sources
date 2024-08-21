import {
  BigDecimal,
  BigInt,
  ByteArray,
  Bytes,
  crypto,
} from "@graphprotocol/graph-ts";

// Define a constant representing the value zero as a BigInt object.
export const BIGINT_ZERO = BigInt.fromI32(0);

// Define a constant representing the value zero as a BigInt object.
export const BIGDECIMAL_ZERO = BigDecimal.fromString("0");

// Define a constant representing the value one as a BigInt object.
export const BIGINT_ONE = BigInt.fromI32(1);

// Define a constant representing the zero address (all zeros).
export const ZERO_ADDRESS = Bytes.fromHexString(
  "0x0000000000000000000000000000000000000000"
);

// Define a constant representing the address of the CryptoCoven contract.
export const CRYPTOCOVEN_ADDRESS = "0x5180db8F5c931aaE63c74266b211F580155ecac8";

export const COVEN_ADDRESS = Bytes.fromUTF8(CRYPTOCOVEN_ADDRESS);

export const OPENSEA_ADDRESS = Bytes.fromUTF8(
  "0x7f268357A8c2552623316e2562D90e642bB538E5"
);

export const ORDERS_MATCHED_EVENT_SIG = crypto.keccak256(
  ByteArray.fromUTF8(
    "OrdersMatched(bytes32,bytes32,address,address,uint256,bytes32)"
  )
);

// Define the event signature for the Transfer event
export const transferEventSignature =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f6e2a1be4d2d8e";

// The keccak256 signature of the Transfer event
export const TRANSFER_EVENT_SIG = crypto.keccak256(
  ByteArray.fromUTF8("Transfer(address,address,uint256)")
);

// Define the event signature for the ordersMatched event in OpenSea
export const ordersMatchedEventSignature = crypto
  .keccak256(
    Bytes.fromUTF8(
      "OrdersMatched(bytes32,bytes32,address,address,uint256,bytes32)"
    )
  )
  .toHexString();

// Convert the event signature to a Bytes object
/** let eventSignatureBytes = Bytes.fromUTF8(TRANSFER_EVENT_SIGNATURE);

// Compute the Keccak-256 (SHA3-256) hash of the event signature
export const TRANSFER_EVENT_SIGNATURE_HASH = crypto
  .keccak256(eventSignatureBytes)
  .toHexString();

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
