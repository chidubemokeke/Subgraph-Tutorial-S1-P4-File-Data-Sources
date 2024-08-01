// Importing necessary types and classes from the @graphprotocol/graph-ts library
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
