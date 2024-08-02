import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Account, Transaction } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";

// Enum for Transaction Types
export enum TransactionType {
  SALE = "SALE", // Represents a sale transaction
  MINT = "MINT", // Represents a minting transaction
  BUY = "BUY", // Represents a buy transaction
}

// Helper function to load or create an Account entity
export function loadOrCreateAccount(accountAddress: Bytes): Account {
  let account = Account.load(accountAddress.toHex());

  if (!account) {
    account = new Account(accountAddress.toHex());
    account.buyCount = BigInt.fromI32(0);
    account.saleCount = BigInt.fromI32(0);
    account.mintCount = BigInt.fromI32(0);
    account.totalBought = BigInt.fromI32(0);
    account.totalSold = BigInt.fromI32(0);
    account.totalBalance = BigInt.fromI32(0);
    account.blockNumber = BigInt.fromI32(0);
    account.blockTimestamp = BigInt.fromI32(0);
    account.save();
  } else {
    // Provide default values if fields are null
    account.buyCount = account.buyCount || BigInt.fromI32(0);
    account.saleCount = account.saleCount || BigInt.fromI32(0);
    account.mintCount = account.mintCount || BigInt.fromI32(0);
    account.totalBought = account.totalBought || BigInt.fromI32(0);
    account.totalSold = account.totalSold || BigInt.fromI32(0);
    account.totalBalance = account.totalBalance || BigInt.fromI32(0);
    account.blockNumber = account.blockNumber || BigInt.fromI32(0);
    account.blockTimestamp = account.blockTimestamp || BigInt.fromI32(0);
  }

  return account as Account;
}

// Helper function to load or create a Transaction entity
export function loadOrCreateTransaction(
  id: string,
  accountId: string,
  type: TransactionType
): Transaction {
  let transaction = new Transaction(id);
  transaction.account = accountId;
  transaction.type = type;
  transaction.from = Bytes.empty();
  transaction.to = Bytes.empty();
  transaction.tokenId = BigInt.fromI32(0);
  transaction.buyer = Bytes.empty();
  transaction.seller = Bytes.empty();
  transaction.nft = "";
  transaction.nftSalePrice = BigInt.fromI32(0);
  transaction.totalSold = BigInt.fromI32(0);
  transaction.blockNumber = BigInt.fromI32(0);
  transaction.blockTimestamp = BigInt.fromI32(0);

  transaction.totalSalesVolume = BigInt.fromI32(0);
  transaction.averageSalePrice = BigInt.fromI32(0);
  transaction.totalSalesCount = BigInt.fromI32(0);
  transaction.highestSalePrice = BigInt.fromI32(0);
  transaction.lowestSalePrice = BigInt.fromI32(0);
  transaction.save();

  return transaction;
}

// Event handler for Transfer events
export function handleTransfer(event: TransferEvent): void {
  let fromAccount = loadOrCreateAccount(event.params.from);
  let toAccount = loadOrCreateAccount(event.params.to);
  let tokenId = event.params.tokenId.toHex();
  let transactionId = event.transaction.hash.toHex() + "-" + tokenId;

  let transactionType: TransactionType;

  // Check if the from address is a mint address (zero address)
  if (
    event.params.from.toHex() == "0x0000000000000000000000000000000000000000"
  ) {
    transactionType = TransactionType.MINT;
  } else {
    transactionType = TransactionType.SALE;
  }

  let transaction = loadOrCreateTransaction(
    transactionId,
    fromAccount.id,
    transactionType
  );
  transaction.from = event.params.from;
  transaction.to = event.params.to;
  transaction.tokenId = event.params.tokenId;
  transaction.blockNumber = event.block.number;
  transaction.blockTimestamp = event.block.timestamp;

  if (transactionType == TransactionType.MINT) {
    toAccount.mintCount = toAccount.mintCount.plus(BigInt.fromI32(1));
    toAccount.totalBalance = toAccount.totalBalance.plus(BigInt.fromI32(1));
  } else {
    fromAccount.totalBalance = fromAccount.totalBalance.minus(
      BigInt.fromI32(1)
    );
    toAccount.totalBalance = toAccount.totalBalance.plus(BigInt.fromI32(1));
  }

  fromAccount.save();
  toAccount.save();
  transaction.save();
}

// Event handler for OrdersMatched events
export function handleOrdersMatched(event: OrdersMatchedEvent): void {
  // Identify the buyer and seller based on the fee recipient
  let buyerAddress = event.params.taker;
  let sellerAddress = event.params.maker;

  if (
    event.params.feeRecipient.toHex() !=
    "0x0000000000000000000000000000000000000000"
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
    TransactionType.BUY
  );
  transaction.buyer = buyerAddress;
  transaction.seller = sellerAddress;
  transaction.tokenId = event.params.tokenId;
  transaction.nftSalePrice = salePrice;
  transaction.blockNumber = event.block.number;
  transaction.blockTimestamp = event.block.timestamp;

  buyerAccount.buyCount = buyerAccount.buyCount.plus(BigInt.fromI32(1));
  buyerAccount.totalBought = buyerAccount.totalBought.plus(salePrice);
  sellerAccount.saleCount = sellerAccount.saleCount.plus(BigInt.fromI32(1));
  sellerAccount.totalSold = sellerAccount.totalSold.plus(salePrice);

  transaction.totalSalesVolume = transaction.totalSalesVolume.plus(salePrice);
  transaction.totalSalesCount = transaction.totalSalesCount.plus(
    BigInt.fromI32(1)
  );

  if (salePrice.gt(transaction.highestSalePrice)) {
    transaction.highestSalePrice = salePrice;
  }
  if (
    salePrice.lt(transaction.lowestSalePrice) ||
    transaction.lowestSalePrice.equals(BigInt.fromI32(0))
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
