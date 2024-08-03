import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Account, Transaction, NFT } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import { loadOrCreateAccount } from "./logic";
import { BIGINT_ZERO, BIGINT_ONE } from "./constant";

// Enum for Transaction Types
export enum TransactionType {
  TRADE = "TRADE",
  MINT = "MINT",
}

// Helper function to load or create a Transaction entity
export function loadOrCreateTransaction(
  id: string,
  accountId: string,
  type: TransactionType
): Transaction {
  // Attempt to load the transaction entity by its ID
  let transaction = Transaction.load(id);

  if (!transaction) {
    // Create a new transaction entity if it does not exist
    transaction = new Transaction(id);
    transaction.account = accountId; // Set the account ID
    transaction.type = type; // Set the transaction type (MINT or TRADE)
    transaction.from = Bytes.empty(); // Initialize 'from' address
    transaction.to = Bytes.empty(); // Initialize 'to' address
    transaction.tokenId = BigInt.fromI32(0); // Initialize token ID
    transaction.buyer = Bytes.empty(); // Initialize buyer address
    transaction.seller = Bytes.empty(); // Initialize seller address
    transaction.nft = ""; // Initialize NFT information
    transaction.nftSalePrice = BigInt.fromI32(0); // Initialize sale price
    transaction.totalSold = BigInt.fromI32(0); // Initialize total sold amount
    transaction.blockNumber = BigInt.fromI32(0); // Initialize block number
    transaction.blockTimestamp = BigInt.fromI32(0); // Initialize block timestamp
    transaction.totalSalesVolume = BigInt.fromI32(0); // Initialize total sales volume
    transaction.averageSalePrice = BigInt.fromI32(0); // Initialize average sale price
    transaction.totalSalesCount = BigInt.fromI32(0); // Initialize total sales count
    transaction.highestSalePrice = BigInt.fromI32(0); // Initialize highest sale price
    transaction.lowestSalePrice = BigInt.fromI32(0); // Initialize lowest sale price
    transaction.save(); // Save the new transaction entity
  }

  return transaction; // Return the loaded or newly created transaction entity
}

// Event handler for Transfer events from the NFT contract
export function handleTransfer(event: TransferEvent): void {
  // Load or create account entities for 'from' and 'to' addresses
  let fromAccount = loadOrCreateAccount(event.params.from);
  let toAccount = loadOrCreateAccount(event.params.to);

  // Get the token ID from the event parameters
  let tokenId = event.params.tokenId.toHex();

  // Generate a unique transaction ID based on the transaction hash and token ID
  let transactionId = event.transaction.hash.toHex() + "-" + tokenId;

  // Determine the type of transaction (MINT if 'from' is zero address, otherwise TRADE)
  let transactionType: TransactionType = event.params.from.equals(
    Bytes.fromHexString("0x0000000000000000000000000000000000000000")
  )
    ? TransactionType.MINT
    : TransactionType.TRADE;

  // Create or update transaction entity
  let transaction = loadOrCreateTransaction(
    transactionId,
    toAccount.id,
    transactionType
  );

  // Set transaction details from event parameters
  transaction.from = event.params.from;
  transaction.to = event.params.to;
  transaction.tokenId = event.params.tokenId;
  transaction.blockNumber = event.block.number;
  transaction.blockTimestamp = event.block.timestamp;

  // Update account statistics based on transaction type
  if (transactionType == TransactionType.MINT) {
    toAccount.mintCount = (toAccount.mintCount || BigInt.fromI32(0)).plus(
      BigInt.fromI32(1)
    );
  }

  // Save the updated account and transaction entities
  fromAccount.save();
  toAccount.save();
  transaction.save();
}

// Event handler for OrdersMatched events
export function handleOrdersMatched(event: OrdersMatchedEvent): void {
  let buyerAddress = event.params.taker;
  let sellerAddress = event.params.maker;

  if (
    event.params.maker.toHex() != "0x0000000000000000000000000000000000000000"
  ) {
    buyerAddress = event.params.taker;
    sellerAddress = event.params.maker;
  }

  let buyerAccount = loadOrCreateAccount(buyerAddress);
  let sellerAccount = loadOrCreateAccount(sellerAddress);
  let tokenId = event.params.tokenId.toHex();
  let salePrice = event.params.price;
  let transactionId = event.transaction.hash.toHex() + "-" + tokenId;

  let transaction = loadOrCreateTransaction(
    transactionId,
    buyerAccount.id,
    TransactionType.TRADE
  );
  transaction.buyer = buyerAddress;
  transaction.seller = sellerAddress;
  transaction.tokenId = event.params.tokenId;
  transaction.nftSalePrice = salePrice;
  transaction.blockNumber = event.block.number;
  transaction.blockTimestamp = event.block.timestamp;

  transaction.totalSalesVolume = (
    transaction.totalSalesVolume || BigInt.fromI32(0)
  ).plus(salePrice);
  transaction.totalSalesCount = (
    transaction.totalSalesCount || BigInt.fromI32(0)
  ).plus(BigInt.fromI32(1));

  if (salePrice.gt(transaction.highestSalePrice || BigInt.fromI32(0))) {
    transaction.highestSalePrice = salePrice;
  }
  if (
    salePrice.lt(transaction.lowestSalePrice || BigInt.fromI32(0)) ||
    (transaction.lowestSalePrice || BigInt.fromI32(0)).equals(BigInt.fromI32(0))
  ) {
    transaction.lowestSalePrice = salePrice;
  }

  if (transaction.totalSalesCount.gt(BigInt.fromI32(0))) {
    transaction.averageSalePrice = transaction.totalSalesVolume.div(
      transaction.totalSalesCount
    );
  }

  buyerAccount.save();
  sellerAccount.save();
  transaction.save();
}
