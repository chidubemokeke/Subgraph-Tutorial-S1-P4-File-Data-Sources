import { BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { Account, CovenToken, Transaction } from "../../generated/schema";
import { Transfer as TransferEvent } from "../../generated/CryptoCoven/CryptoCoven";
import { OrdersMatched as OrdersMatchedEvent } from "../../generated/Opensea/Opensea";
import {
  createOrUpdateAccount,
  determineAccountType,
  updateAccountHistory,
} from "../helpers/accountHelper";
import {
  extractNFTsFromLogs,
  getGlobalId,
  getTokenIdFromReceipt, 
  getTransactionType,
  updateTokenOwner,
} from "../helpers/utils";
import { initializeTransaction } from "../helpers/transactionHelper";
import { ZERO_ADDRESS, BIGINT_ZERO, BIGINT_ONE } from "../helpers/constant";


/// Handles a transfer event which could be a mint, trade, or standard transfer
export function handleTransfer(event: TransferEvent): void {
  // Determine if this event is a mint by checking if 'from' is the zero address
  let isMint = event.params.from.toHex() == ZERO_ADDRESS.toHex();

  // Extract total NFTs in this transaction from the logs
  let totalNFTs = extractNFTsFromLogs(event);

  // Log airdrop detection if it's a mint event or if multiple NFTs are sold
  if (isMint || totalNFTs > BIGINT_ONE) {
    log.info("Airdrop or multiple NFT purchase detected", [
      totalNFTs.toString(),
    ]);
  }

  // Determine the transaction type (MINT, TRADE, or TRANSFER)
  let transactionType: string = isMint
    ? getTransactionType("MINT")
    : getTransactionType("TRANSFER");

  // Update the CovenToken entity with details from the transfer event
  updateTokenOwner(
    event.params.tokenId,
    event.params.to,
    event.logIndex,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp
  );

  // Get or create the account entities for the sender and recipient
  let fromAccount = createOrUpdateAccount(event.params.from);
  let toAccount = createOrUpdateAccount(event.params.to);

  // Determine if this is a sale (assume sale if not a mint and the sender is not the zero address)
  let isSale = !isMint && event.params.from.toHex() != ZERO_ADDRESS.toHex();

  // Update account history for both sender and recipient based on transaction type
  updateAccountHistory(fromAccount, transactionType, totalNFTs, isSale);
  updateAccountHistory(toAccount, transactionType, totalNFTs, !isSale);

  // Determine the account type based on historical transactions
  determineAccountType(fromAccount);
  determineAccountType(toAccount);

  // Save the updated account entities to persist the changes
  fromAccount.save();
  toAccount.save();
}

export function handleOpenSeaSale(event: OrdersMatchedEvent): void {
  // Retrieve or create Account entities for both seller and buyer.
  let seller = createOrUpdateAccount(event.params.maker); // Seller's address.
  let buyer = createOrUpdateAccount(event.params.taker); // Buyer's address.

  // Step 3: Extract the tokenId from the event receipt 
  let tokenId = getTokenIdFromReceipt(event.receipt!);

}

  /**let transaction = initializeTransaction(event);

  // Transaction type is a "TRADE" for an OpenSea sale.
  let transactionType: string = getTransactionType("TRADE");

  // Access the transaction receipt to get the logs
  let receipt = event.receipt;
  if (receipt) {
    let tokenId = getTokenIdFromReceipt(receipt);
    if (tokenId != null) {
      // Do something with the tokenId, such as loading the token entity
      let token = CovenToken.load(tokenId);
      if (!token) {
        token = new CovenToken(tokenId);
      }

      // Update the token with sale details, such as the new owner
      token.owner = event.params.taker; 
      token.tokenId = eveve
      token.save();
    } else {
      log.warning("Token ID not found in receipt logs for transaction: {}", [
        transaction.id,
      ]);
    }
  }

  // Update account history for both seller and buyer based on transaction type.
  updateAccountHistory(seller, transactionType, totalNFTs, true);
  updateAccountHistory(buyer, transactionType, totalNFTs, false);

  // Determine the account type based on historical transactions.
  determineAccountType(seller);
  determineAccountType(buyer);

  // Save the updated account entities to persist the changes.
  seller.save();
  buyer.save();

  // Initialize and save Transaction entities for both seller and buyer.
  let sellerTransaction = initializeTransaction(event, seller, transactionType);
  sellerTransaction.totalNFTsSold = totalNFTs;
  sellerTransaction.nftSalePrice = event.params.price; // Assuming price is available in the event
  sellerTransaction.save();

  let buyerTransaction = initializeTransaction(event, buyer, transactionType);
  buyerTransaction.totalNFTsSold = totalNFTs;
  buyerTransaction.nftSalePrice = event.params.price; // Assuming price is available in the event
  buyerTransaction.save();
}
