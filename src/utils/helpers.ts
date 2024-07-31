import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Account, NFT, Transaction } from "../../generated/schema";

// Helper function to load or create an Account entity
export function loadOrCreateAccount(accountAddress: Bytes): Account {
  let account = Account.load(accountAddress.toHex());

  if (!account) {
    account = new Account(accountAddress.toHex());
    account.buyCount = BigInt.fromI32(0);
    account.saleCount = BigInt.fromI32(0);
    account.mintCount = BigInt.fromI32(0);
    account.totalBalance = BigInt.fromI32(0);
    account.blockNumber = BigInt.fromI32(0);
    account.blockTimestamp = BigInt.fromI32(0);
  }

  return account as Account;
}

// Helper function to load or create a Transaction entity
export function loadOrCreateTransaction(
  transactionId: Bytes,
  accountAddress: Bytes,
  nft: NFT,
  type: TransactionType
): Transaction {
  let transaction = Transaction.load(transactionId.toHex());

  if (transaction == null) {
    transaction = new Transaction(transactionId.toHex());
    transaction.account = loadOrCreateAccount(accountAddress);
    transaction.from = Bytes.empty();
    transaction.to = Bytes.empty();
    transaction.tokenId = nft.tokenID;
    transaction.nft = nft;
    transaction.type = type;
    transaction.amountSold = BigInt.fromI32(0);
    transaction.totalAmountSold = BigInt.fromI32(0);
    transaction.totalAmountBought = BigInt.fromI32(0);
    transaction.blockNumber = BigInt.fromI32(0);
    transaction.blockTimestamp = BigInt.fromI32(0);
  }

  return transaction as Transaction;
}
