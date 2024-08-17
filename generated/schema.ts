// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";

export class Account extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Account entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Account must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("Account", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Account | null {
    return changetype<Account | null>(store.get_in_block("Account", id));
  }

  static load(id: string): Account | null {
    return changetype<Account | null>(store.get("Account", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get sent(): CovenTokenLoader {
    return new CovenTokenLoader("Account", this.get("id")!.toString(), "sent");
  }

  get received(): CovenTokenLoader {
    return new CovenTokenLoader(
      "Account",
      this.get("id")!.toString(),
      "received",
    );
  }

  get transactionCount(): BigInt {
    let value = this.get("transactionCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set transactionCount(value: BigInt) {
    this.set("transactionCount", Value.fromBigInt(value));
  }

  get mintCount(): BigInt {
    let value = this.get("mintCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set mintCount(value: BigInt) {
    this.set("mintCount", Value.fromBigInt(value));
  }

  get buyCount(): BigInt {
    let value = this.get("buyCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set buyCount(value: BigInt) {
    this.set("buyCount", Value.fromBigInt(value));
  }

  get saleCount(): BigInt {
    let value = this.get("saleCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set saleCount(value: BigInt) {
    this.set("saleCount", Value.fromBigInt(value));
  }

  get isOG(): boolean {
    let value = this.get("isOG");
    if (!value || value.kind == ValueKind.NULL) {
      return false;
    } else {
      return value.toBoolean();
    }
  }

  set isOG(value: boolean) {
    this.set("isOG", Value.fromBoolean(value));
  }

  get isCollector(): boolean {
    let value = this.get("isCollector");
    if (!value || value.kind == ValueKind.NULL) {
      return false;
    } else {
      return value.toBoolean();
    }
  }

  set isCollector(value: boolean) {
    this.set("isCollector", Value.fromBoolean(value));
  }

  get isHunter(): boolean {
    let value = this.get("isHunter");
    if (!value || value.kind == ValueKind.NULL) {
      return false;
    } else {
      return value.toBoolean();
    }
  }

  set isHunter(value: boolean) {
    this.set("isHunter", Value.fromBoolean(value));
  }

  get isFarmer(): boolean {
    let value = this.get("isFarmer");
    if (!value || value.kind == ValueKind.NULL) {
      return false;
    } else {
      return value.toBoolean();
    }
  }

  set isFarmer(value: boolean) {
    this.set("isFarmer", Value.fromBoolean(value));
  }

  get isTrader(): boolean {
    let value = this.get("isTrader");
    if (!value || value.kind == ValueKind.NULL) {
      return false;
    } else {
      return value.toBoolean();
    }
  }

  set isTrader(value: boolean) {
    this.set("isTrader", Value.fromBoolean(value));
  }

  get totalAmountBought(): BigInt {
    let value = this.get("totalAmountBought");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set totalAmountBought(value: BigInt) {
    this.set("totalAmountBought", Value.fromBigInt(value));
  }

  get totalAmountSold(): BigInt {
    let value = this.get("totalAmountSold");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set totalAmountSold(value: BigInt) {
    this.set("totalAmountSold", Value.fromBigInt(value));
  }

  get totalAmountBalance(): BigInt {
    let value = this.get("totalAmountBalance");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set totalAmountBalance(value: BigInt) {
    this.set("totalAmountBalance", Value.fromBigInt(value));
  }

  get transactions(): TransactionLoader {
    return new TransactionLoader(
      "Account",
      this.get("id")!.toString(),
      "transactions",
    );
  }

  get history(): AccountHistoryLoader {
    return new AccountHistoryLoader(
      "Account",
      this.get("id")!.toString(),
      "history",
    );
  }

  get logIndex(): BigInt {
    let value = this.get("logIndex");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set logIndex(value: BigInt) {
    this.set("logIndex", Value.fromBigInt(value));
  }

  get txHash(): Bytes {
    let value = this.get("txHash");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set txHash(value: Bytes) {
    this.set("txHash", Value.fromBytes(value));
  }

  get blockNumber(): BigInt {
    let value = this.get("blockNumber");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockNumber(value: BigInt) {
    this.set("blockNumber", Value.fromBigInt(value));
  }

  get blockTimestamp(): BigInt {
    let value = this.get("blockTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockTimestamp(value: BigInt) {
    this.set("blockTimestamp", Value.fromBigInt(value));
  }
}

export class AccountHistory extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save AccountHistory entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type AccountHistory must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("AccountHistory", id.toString(), this);
    }
  }

  static loadInBlock(id: string): AccountHistory | null {
    return changetype<AccountHistory | null>(
      store.get_in_block("AccountHistory", id),
    );
  }

  static load(id: string): AccountHistory | null {
    return changetype<AccountHistory | null>(store.get("AccountHistory", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get history(): string {
    let value = this.get("history");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set history(value: string) {
    this.set("history", Value.fromString(value));
  }

  get owner(): Bytes {
    let value = this.get("owner");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set owner(value: Bytes) {
    this.set("owner", Value.fromBytes(value));
  }

  get mintCount(): BigInt {
    let value = this.get("mintCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set mintCount(value: BigInt) {
    this.set("mintCount", Value.fromBigInt(value));
  }

  get buyCount(): BigInt {
    let value = this.get("buyCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set buyCount(value: BigInt) {
    this.set("buyCount", Value.fromBigInt(value));
  }

  get saleCount(): BigInt {
    let value = this.get("saleCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set saleCount(value: BigInt) {
    this.set("saleCount", Value.fromBigInt(value));
  }

  get accountType(): string {
    let value = this.get("accountType");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set accountType(value: string) {
    this.set("accountType", Value.fromString(value));
  }

  get logIndex(): BigInt {
    let value = this.get("logIndex");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set logIndex(value: BigInt) {
    this.set("logIndex", Value.fromBigInt(value));
  }

  get txHash(): Bytes {
    let value = this.get("txHash");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set txHash(value: Bytes) {
    this.set("txHash", Value.fromBytes(value));
  }

  get blockNumber(): BigInt {
    let value = this.get("blockNumber");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockNumber(value: BigInt) {
    this.set("blockNumber", Value.fromBigInt(value));
  }

  get blockTimestamp(): BigInt {
    let value = this.get("blockTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockTimestamp(value: BigInt) {
    this.set("blockTimestamp", Value.fromBigInt(value));
  }
}

export class CovenToken extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save CovenToken entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type CovenToken must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("CovenToken", id.toString(), this);
    }
  }

  static loadInBlock(id: string): CovenToken | null {
    return changetype<CovenToken | null>(store.get_in_block("CovenToken", id));
  }

  static load(id: string): CovenToken | null {
    return changetype<CovenToken | null>(store.get("CovenToken", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get from(): string {
    let value = this.get("from");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set from(value: string) {
    this.set("from", Value.fromString(value));
  }

  get to(): string {
    let value = this.get("to");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set to(value: string) {
    this.set("to", Value.fromString(value));
  }

  get owner(): Bytes {
    let value = this.get("owner");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set owner(value: Bytes) {
    this.set("owner", Value.fromBytes(value));
  }

  get tokenId(): BigInt {
    let value = this.get("tokenId");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set tokenId(value: BigInt) {
    this.set("tokenId", Value.fromBigInt(value));
  }

  get tokenMintCount(): BigInt {
    let value = this.get("tokenMintCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set tokenMintCount(value: BigInt) {
    this.set("tokenMintCount", Value.fromBigInt(value));
  }

  get logIndex(): BigInt {
    let value = this.get("logIndex");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set logIndex(value: BigInt) {
    this.set("logIndex", Value.fromBigInt(value));
  }

  get txHash(): Bytes {
    let value = this.get("txHash");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set txHash(value: Bytes) {
    this.set("txHash", Value.fromBytes(value));
  }

  get blockNumber(): BigInt {
    let value = this.get("blockNumber");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockNumber(value: BigInt) {
    this.set("blockNumber", Value.fromBigInt(value));
  }

  get blockTimestamp(): BigInt {
    let value = this.get("blockTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockTimestamp(value: BigInt) {
    this.set("blockTimestamp", Value.fromBigInt(value));
  }
}

export class Transaction extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Transaction entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Transaction must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("Transaction", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Transaction | null {
    return changetype<Transaction | null>(
      store.get_in_block("Transaction", id),
    );
  }

  static load(id: string): Transaction | null {
    return changetype<Transaction | null>(store.get("Transaction", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get account(): string {
    let value = this.get("account");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set account(value: string) {
    this.set("account", Value.fromString(value));
  }

  get referenceId(): BigInt {
    let value = this.get("referenceId");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set referenceId(value: BigInt) {
    this.set("referenceId", Value.fromBigInt(value));
  }

  get transactionType(): string {
    let value = this.get("transactionType");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set transactionType(value: string) {
    this.set("transactionType", Value.fromString(value));
  }

  get buyer(): Bytes {
    let value = this.get("buyer");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set buyer(value: Bytes) {
    this.set("buyer", Value.fromBytes(value));
  }

  get seller(): Bytes {
    let value = this.get("seller");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set seller(value: Bytes) {
    this.set("seller", Value.fromBytes(value));
  }

  get nftSalePrice(): BigInt {
    let value = this.get("nftSalePrice");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set nftSalePrice(value: BigInt) {
    this.set("nftSalePrice", Value.fromBigInt(value));
  }

  get totalNFTsSold(): BigInt {
    let value = this.get("totalNFTsSold");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set totalNFTsSold(value: BigInt) {
    this.set("totalNFTsSold", Value.fromBigInt(value));
  }

  get totalSalesVolume(): BigInt {
    let value = this.get("totalSalesVolume");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set totalSalesVolume(value: BigInt) {
    this.set("totalSalesVolume", Value.fromBigInt(value));
  }

  get averageSalePrice(): BigDecimal {
    let value = this.get("averageSalePrice");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigDecimal();
    }
  }

  set averageSalePrice(value: BigDecimal) {
    this.set("averageSalePrice", Value.fromBigDecimal(value));
  }

  get totalSalesCount(): BigInt {
    let value = this.get("totalSalesCount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set totalSalesCount(value: BigInt) {
    this.set("totalSalesCount", Value.fromBigInt(value));
  }

  get highestSalePrice(): BigInt {
    let value = this.get("highestSalePrice");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set highestSalePrice(value: BigInt) {
    this.set("highestSalePrice", Value.fromBigInt(value));
  }

  get lowestSalePrice(): BigInt {
    let value = this.get("lowestSalePrice");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set lowestSalePrice(value: BigInt) {
    this.set("lowestSalePrice", Value.fromBigInt(value));
  }

  get logIndex(): BigInt {
    let value = this.get("logIndex");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set logIndex(value: BigInt) {
    this.set("logIndex", Value.fromBigInt(value));
  }

  get txHash(): Bytes {
    let value = this.get("txHash");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set txHash(value: Bytes) {
    this.set("txHash", Value.fromBytes(value));
  }

  get blockNumber(): BigInt {
    let value = this.get("blockNumber");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockNumber(value: BigInt) {
    this.set("blockNumber", Value.fromBigInt(value));
  }

  get blockTimestamp(): BigInt {
    let value = this.get("blockTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockTimestamp(value: BigInt) {
    this.set("blockTimestamp", Value.fromBigInt(value));
  }
}

export class CovenTokenLoader extends Entity {
  _entity: string;
  _field: string;
  _id: string;

  constructor(entity: string, id: string, field: string) {
    super();
    this._entity = entity;
    this._id = id;
    this._field = field;
  }

  load(): CovenToken[] {
    let value = store.loadRelated(this._entity, this._id, this._field);
    return changetype<CovenToken[]>(value);
  }
}

export class TransactionLoader extends Entity {
  _entity: string;
  _field: string;
  _id: string;

  constructor(entity: string, id: string, field: string) {
    super();
    this._entity = entity;
    this._id = id;
    this._field = field;
  }

  load(): Transaction[] {
    let value = store.loadRelated(this._entity, this._id, this._field);
    return changetype<Transaction[]>(value);
  }
}

export class AccountHistoryLoader extends Entity {
  _entity: string;
  _field: string;
  _id: string;

  constructor(entity: string, id: string, field: string) {
    super();
    this._entity = entity;
    this._id = id;
    this._field = field;
  }

  load(): AccountHistory[] {
    let value = store.loadRelated(this._entity, this._id, this._field);
    return changetype<AccountHistory[]>(value);
  }
}
