/**import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import {
  NFT,
  NFTMetadata,
  Coven,
  Description,
  Skills,
  BirthChart,
  Attribute,
  Style,
} from "../../generated/schema";

// Initialize NFT entity
// Creates a new NFT entity with default values
export function initializeNFT(id: string, ownerId: string): NFT {
  let nft = new NFT(id);
  nft.currentOwner = ownerId; // Current owner of the NFT
  nft.tokenID = BigInt.fromI32(0); // NFT token ID
  nft.tokenURI = ""; // URI pointing to NFT metadata
  nft.ipfsURI = ""; // URI pointing to IPFS metadata (NFTMetadata reference)
  nft.saleCount = BigInt.fromI32(0); // Number of times the NFT has been sold
  nft.buyCount = BigInt.fromI32(0); // Number of times the NFT has been bought
  nft.mintCount = BigInt.fromI32(0); // Number of times the NFT has been minted
  nft.blockNumber = BigInt.fromI32(0); // Block number where the NFT is recorded
  nft.blockTimestamp = BigInt.fromI32(0); // Timestamp when the NFT is recorded
  nft.save(); // Save the entity to the store
  return nft;
}

// Initialize NFTMetadata entity
// Creates a new NFTMetadata entity with default values
export function initializeNFTMetadata(id: string): NFTMetadata {
  let nftMetadata = new NFTMetadata(id);
  nftMetadata.description = ""; // Description of the NFT
  nftMetadata.externalURL = ""; // External URL for additional information
  nftMetadata.image = ""; // URL for the image of the NFT
  nftMetadata.name = ""; // Name of the NFT
  nftMetadata.backgroundColor = ""; // Background color for visual representation
  nftMetadata.save(); // Save the entity to the store
  return nftMetadata;
}

// Initialize Coven entity
// Creates a new Coven entity with default values
export function initializeCoven(id: string): Coven {
  let coven = new Coven(id);
  coven.name = ""; // Name of the Coven
  coven.type = ""; // Type of the Coven
  coven.description = ""; // Description (referencing Description entity)
  coven.skills = ""; // Skills (referencing Skills entity)
  coven.birthChart = ""; // Birth chart (referencing BirthChart entity)
  coven.hash = ""; // Hash associated with the Coven
  coven.save(); // Save the entity to the store
  return coven;
}

// Initialize Description entity
// Creates a new Description entity with default values
export function initializeDescription(id: string): Description {
  let description = new Description(id);
  description.intro = ""; // Introduction text
  description.hobby = ""; // Hobbies related to the description
  description.magic = ""; // Magic-related content
  description.typeSpecific = ""; // Type-specific details
  description.exclamation = ""; // Exclamation or notable highlight
  description.save(); // Save the entity to the store
  return description;
}

// Initialize Skills entity
// Creates a new Skills entity with default values
export function initializeSkills(id: string): Skills {
  let skills = new Skills(id);
  skills.will = 0; // Willpower skill value
  skills.wit = 0; // Wit skill value
  skills.wiles = 0; // Wiles skill value
  skills.wisdom = 0; // Wisdom skill value
  skills.wonder = 0; // Wonder skill value
  skills.woe = 0; // Woe skill value
  skills.save(); // Save the entity to the store
  return skills;
}

// Initialize BirthChart entity
// Creates a new BirthChart entity with default values
export function initializeBirthChart(id: string): BirthChart {
  let birthChart = new BirthChart(id);
  birthChart.sun = ""; // Sun sign in the birth chart
  birthChart.moon = ""; // Moon sign in the birth chart
  birthChart.rising = ""; // Rising sign in the birth chart
  birthChart.save(); // Save the entity to the store
  return birthChart;
}

// Initialize Attribute entity
// Creates a new Attribute entity with default values
export function initializeAttribute(id: string): Attribute {
  let attribute = new Attribute(id);
  attribute.traitType = ""; // Type of attribute
  attribute.value = ""; // Value of the attribute
  attribute.displayType = ""; // Display type for the attribute
  attribute.maxValue = BigInt.fromI32(0); // Maximum value for the attribute
  attribute.save(); // Save the entity to the store
  return attribute;
}

// Initialize Style entity
// Creates a new Style entity with default values
export function initializeStyle(id: string): Style {
  let style = new Style(id);
  style.attribute = ""; // Reference to Attribute entity
  style.name = ""; // Name of the style
  style.color = ""; // Color associated with the style
  style.coven = ""; // Reference to Coven entity
  style.save(); // Save the entity to the store
  return style;
}**/
