// Import necessary event types and creation functions from respective paths
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven"; // Import event types from CryptoCoven contract schema
import {
  createTransfer,
  createOrdersMatched,
} from "../utils/transactionHelper"; // Import functions to create entities from tokenGov utilities
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";

// Event handler function for TransferEvent
export function handleTransfer(event: TransferEvent): void {
  createTransfer(event); // Call function to create Transfer entity
}

// Event handler function for OrdersMatchedEvent
export function handleOrdersMatched(event: OrdersMatchedEvent): void {
  createOrdersMatched(event); // Call function to create OrdersMatched entity
}
