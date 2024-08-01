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

  get buyCount(): BigInt | null {
    let value = this.get("buyCount");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set buyCount(value: BigInt | null) {
    if (!value) {
      this.unset("buyCount");
    } else {
      this.set("buyCount", Value.fromBigInt(<BigInt>value));
    }
  }

  get saleCount(): BigInt | null {
    let value = this.get("saleCount");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set saleCount(value: BigInt | null) {
    if (!value) {
      this.unset("saleCount");
    } else {
      this.set("saleCount", Value.fromBigInt(<BigInt>value));
    }
  }

  get mintCount(): BigInt | null {
    let value = this.get("mintCount");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set mintCount(value: BigInt | null) {
    if (!value) {
      this.unset("mintCount");
    } else {
      this.set("mintCount", Value.fromBigInt(<BigInt>value));
    }
  }

  get totalBalance(): BigInt | null {
    let value = this.get("totalBalance");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set totalBalance(value: BigInt | null) {
    if (!value) {
      this.unset("totalBalance");
    } else {
      this.set("totalBalance", Value.fromBigInt(<BigInt>value));
    }
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

  get nfts(): NFTLoader {
    return new NFTLoader("Account", this.get("id")!.toString(), "nfts");
  }

  get transactions(): TransactionLoader {
    return new TransactionLoader(
      "Account",
      this.get("id")!.toString(),
      "transactions",
    );
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

  get from(): Bytes {
    let value = this.get("from");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set from(value: Bytes) {
    this.set("from", Value.fromBytes(value));
  }

  get to(): Bytes {
    let value = this.get("to");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set to(value: Bytes) {
    this.set("to", Value.fromBytes(value));
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

  get type(): string {
    let value = this.get("type");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set type(value: string) {
    this.set("type", Value.fromString(value));
  }

  get buyer(): Bytes | null {
    let value = this.get("buyer");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set buyer(value: Bytes | null) {
    if (!value) {
      this.unset("buyer");
    } else {
      this.set("buyer", Value.fromBytes(<Bytes>value));
    }
  }

  get seller(): Bytes | null {
    let value = this.get("seller");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set seller(value: Bytes | null) {
    if (!value) {
      this.unset("seller");
    } else {
      this.set("seller", Value.fromBytes(<Bytes>value));
    }
  }

  get nft(): string {
    let value = this.get("nft");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set nft(value: string) {
    this.set("nft", Value.fromString(value));
  }

  get amountSold(): BigInt | null {
    let value = this.get("amountSold");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set amountSold(value: BigInt | null) {
    if (!value) {
      this.unset("amountSold");
    } else {
      this.set("amountSold", Value.fromBigInt(<BigInt>value));
    }
  }

  get totalAmountSold(): BigInt | null {
    let value = this.get("totalAmountSold");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set totalAmountSold(value: BigInt | null) {
    if (!value) {
      this.unset("totalAmountSold");
    } else {
      this.set("totalAmountSold", Value.fromBigInt(<BigInt>value));
    }
  }

  get totalAmountBought(): BigInt | null {
    let value = this.get("totalAmountBought");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set totalAmountBought(value: BigInt | null) {
    if (!value) {
      this.unset("totalAmountBought");
    } else {
      this.set("totalAmountBought", Value.fromBigInt(<BigInt>value));
    }
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

export class NFT extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save NFT entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type NFT must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("NFT", id.toString(), this);
    }
  }

  static loadInBlock(id: string): NFT | null {
    return changetype<NFT | null>(store.get_in_block("NFT", id));
  }

  static load(id: string): NFT | null {
    return changetype<NFT | null>(store.get("NFT", id));
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

  get currentOwner(): string {
    let value = this.get("currentOwner");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set currentOwner(value: string) {
    this.set("currentOwner", Value.fromString(value));
  }

  get tokenID(): BigInt {
    let value = this.get("tokenID");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set tokenID(value: BigInt) {
    this.set("tokenID", Value.fromBigInt(value));
  }

  get tokenURI(): string {
    let value = this.get("tokenURI");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set tokenURI(value: string) {
    this.set("tokenURI", Value.fromString(value));
  }

  get ipfsURI(): string | null {
    let value = this.get("ipfsURI");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set ipfsURI(value: string | null) {
    if (!value) {
      this.unset("ipfsURI");
    } else {
      this.set("ipfsURI", Value.fromString(<string>value));
    }
  }

  get firstOwner(): Bytes {
    let value = this.get("firstOwner");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set firstOwner(value: Bytes) {
    this.set("firstOwner", Value.fromBytes(value));
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

  get transfers(): TransactionLoader {
    return new TransactionLoader(
      "NFT",
      this.get("id")!.toString(),
      "transfers",
    );
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
}

export class NFTMetadata extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save NFTMetadata entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type NFTMetadata must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("NFTMetadata", id.toString(), this);
    }
  }

  static loadInBlock(id: string): NFTMetadata | null {
    return changetype<NFTMetadata | null>(
      store.get_in_block("NFTMetadata", id),
    );
  }

  static load(id: string): NFTMetadata | null {
    return changetype<NFTMetadata | null>(store.get("NFTMetadata", id));
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

  get description(): string {
    let value = this.get("description");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set description(value: string) {
    this.set("description", Value.fromString(value));
  }

  get externalURL(): string | null {
    let value = this.get("externalURL");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set externalURL(value: string | null) {
    if (!value) {
      this.unset("externalURL");
    } else {
      this.set("externalURL", Value.fromString(<string>value));
    }
  }

  get image(): string {
    let value = this.get("image");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set image(value: string) {
    this.set("image", Value.fromString(value));
  }

  get name(): string {
    let value = this.get("name");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set name(value: string) {
    this.set("name", Value.fromString(value));
  }

  get backgroundColor(): string | null {
    let value = this.get("backgroundColor");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set backgroundColor(value: string | null) {
    if (!value) {
      this.unset("backgroundColor");
    } else {
      this.set("backgroundColor", Value.fromString(<string>value));
    }
  }

  get coven(): string | null {
    let value = this.get("coven");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set coven(value: string | null) {
    if (!value) {
      this.unset("coven");
    } else {
      this.set("coven", Value.fromString(<string>value));
    }
  }

  get attributes(): AttributeLoader {
    return new AttributeLoader(
      "NFTMetadata",
      this.get("id")!.toString(),
      "attributes",
    );
  }
}

export class Coven extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Coven entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Coven must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("Coven", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Coven | null {
    return changetype<Coven | null>(store.get_in_block("Coven", id));
  }

  static load(id: string): Coven | null {
    return changetype<Coven | null>(store.get("Coven", id));
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

  get name(): string {
    let value = this.get("name");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set name(value: string) {
    this.set("name", Value.fromString(value));
  }

  get type(): string {
    let value = this.get("type");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set type(value: string) {
    this.set("type", Value.fromString(value));
  }

  get description(): string {
    let value = this.get("description");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set description(value: string) {
    this.set("description", Value.fromString(value));
  }

  get skills(): string {
    let value = this.get("skills");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set skills(value: string) {
    this.set("skills", Value.fromString(value));
  }

  get birthChart(): string {
    let value = this.get("birthChart");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set birthChart(value: string) {
    this.set("birthChart", Value.fromString(value));
  }

  get styles(): StyleLoader {
    return new StyleLoader("Coven", this.get("id")!.toString(), "styles");
  }

  get hash(): string {
    let value = this.get("hash");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set hash(value: string) {
    this.set("hash", Value.fromString(value));
  }
}

export class Description extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Description entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Description must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("Description", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Description | null {
    return changetype<Description | null>(
      store.get_in_block("Description", id),
    );
  }

  static load(id: string): Description | null {
    return changetype<Description | null>(store.get("Description", id));
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

  get intro(): string {
    let value = this.get("intro");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set intro(value: string) {
    this.set("intro", Value.fromString(value));
  }

  get hobby(): string {
    let value = this.get("hobby");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set hobby(value: string) {
    this.set("hobby", Value.fromString(value));
  }

  get magic(): string {
    let value = this.get("magic");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set magic(value: string) {
    this.set("magic", Value.fromString(value));
  }

  get typeSpecific(): string {
    let value = this.get("typeSpecific");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set typeSpecific(value: string) {
    this.set("typeSpecific", Value.fromString(value));
  }

  get exclamation(): string {
    let value = this.get("exclamation");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set exclamation(value: string) {
    this.set("exclamation", Value.fromString(value));
  }
}

export class Skills extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Skills entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Skills must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("Skills", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Skills | null {
    return changetype<Skills | null>(store.get_in_block("Skills", id));
  }

  static load(id: string): Skills | null {
    return changetype<Skills | null>(store.get("Skills", id));
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

  get will(): i32 {
    let value = this.get("will");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set will(value: i32) {
    this.set("will", Value.fromI32(value));
  }

  get wit(): i32 {
    let value = this.get("wit");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set wit(value: i32) {
    this.set("wit", Value.fromI32(value));
  }

  get wiles(): i32 {
    let value = this.get("wiles");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set wiles(value: i32) {
    this.set("wiles", Value.fromI32(value));
  }

  get wisdom(): i32 {
    let value = this.get("wisdom");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set wisdom(value: i32) {
    this.set("wisdom", Value.fromI32(value));
  }

  get wonder(): i32 {
    let value = this.get("wonder");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set wonder(value: i32) {
    this.set("wonder", Value.fromI32(value));
  }

  get woe(): i32 {
    let value = this.get("woe");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set woe(value: i32) {
    this.set("woe", Value.fromI32(value));
  }
}

export class BirthChart extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save BirthChart entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type BirthChart must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("BirthChart", id.toString(), this);
    }
  }

  static loadInBlock(id: string): BirthChart | null {
    return changetype<BirthChart | null>(store.get_in_block("BirthChart", id));
  }

  static load(id: string): BirthChart | null {
    return changetype<BirthChart | null>(store.get("BirthChart", id));
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

  get sun(): string {
    let value = this.get("sun");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set sun(value: string) {
    this.set("sun", Value.fromString(value));
  }

  get moon(): string {
    let value = this.get("moon");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set moon(value: string) {
    this.set("moon", Value.fromString(value));
  }

  get rising(): string {
    let value = this.get("rising");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set rising(value: string) {
    this.set("rising", Value.fromString(value));
  }
}

export class Attribute extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Attribute entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Attribute must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("Attribute", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Attribute | null {
    return changetype<Attribute | null>(store.get_in_block("Attribute", id));
  }

  static load(id: string): Attribute | null {
    return changetype<Attribute | null>(store.get("Attribute", id));
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

  get traitType(): string {
    let value = this.get("traitType");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set traitType(value: string) {
    this.set("traitType", Value.fromString(value));
  }

  get value(): string {
    let value = this.get("value");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set value(value: string) {
    this.set("value", Value.fromString(value));
  }

  get displayType(): string | null {
    let value = this.get("displayType");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set displayType(value: string | null) {
    if (!value) {
      this.unset("displayType");
    } else {
      this.set("displayType", Value.fromString(<string>value));
    }
  }

  get maxValue(): i32 {
    let value = this.get("maxValue");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set maxValue(value: i32) {
    this.set("maxValue", Value.fromI32(value));
  }

  get nftMetadata(): string {
    let value = this.get("nftMetadata");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set nftMetadata(value: string) {
    this.set("nftMetadata", Value.fromString(value));
  }
}

export class Style extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Style entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Style must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("Style", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Style | null {
    return changetype<Style | null>(store.get_in_block("Style", id));
  }

  static load(id: string): Style | null {
    return changetype<Style | null>(store.get("Style", id));
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

  get attribute(): string {
    let value = this.get("attribute");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set attribute(value: string) {
    this.set("attribute", Value.fromString(value));
  }

  get name(): string {
    let value = this.get("name");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set name(value: string) {
    this.set("name", Value.fromString(value));
  }

  get color(): string {
    let value = this.get("color");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set color(value: string) {
    this.set("color", Value.fromString(value));
  }

  get coven(): string {
    let value = this.get("coven");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set coven(value: string) {
    this.set("coven", Value.fromString(value));
  }
}

export class NFTLoader extends Entity {
  _entity: string;
  _field: string;
  _id: string;

  constructor(entity: string, id: string, field: string) {
    super();
    this._entity = entity;
    this._id = id;
    this._field = field;
  }

  load(): NFT[] {
    let value = store.loadRelated(this._entity, this._id, this._field);
    return changetype<NFT[]>(value);
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

export class AttributeLoader extends Entity {
  _entity: string;
  _field: string;
  _id: string;

  constructor(entity: string, id: string, field: string) {
    super();
    this._entity = entity;
    this._id = id;
    this._field = field;
  }

  load(): Attribute[] {
    let value = store.loadRelated(this._entity, this._id, this._field);
    return changetype<Attribute[]>(value);
  }
}

export class StyleLoader extends Entity {
  _entity: string;
  _field: string;
  _id: string;

  constructor(entity: string, id: string, field: string) {
    super();
    this._entity = entity;
    this._id = id;
    this._field = field;
  }

  load(): Style[] {
    let value = store.loadRelated(this._entity, this._id, this._field);
    return changetype<Style[]>(value);
  }
}
