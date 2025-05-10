const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
  let Marketplace, marketplace;
  let MockNFT, nft;
  let deployer, seller, buyer;

  beforeEach(async () => {
    [deployer, seller, buyer] = await ethers.getSigners();

    // Deploy mock ERC721 token
    Collection = await ethers.getContractFactory("SmilyCollection");
    nft = await Collection.connect(deployer).deploy(deployer.address);
    await nft.waitForDeployment();

    const tokenURI = "https://coffee-eldest-monkey-667.mypinata.cloud/ipfs/bafkreiaiy3tx7tjukzrh53h7pfwekx7gg4fqm5auvuixaghwpisgjj24hi";

    // Mint a token to the seller
    await nft.connect(seller).mint(tokenURI);

    // Deploy Marketplace
    Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy();
    await marketplace.waitForDeployment();
  });

  it("should allow seller to pack (list) an NFT", async () => {
    // Approve marketplace
    await nft.connect(seller).approve(await marketplace.getAddress(), 1);

    // Pack the NFT
    await expect(
      marketplace.connect(seller).takePack(await nft.getAddress(), 1, ethers.parseEther("1"))
    )
      .to.emit(marketplace, "Packed")
      .withArgs(await nft.getAddress(), 1, seller.address, ethers.parseEther("1"), 0);

    const pack = await marketplace.nfts(await nft.getAddress(), 1);
    expect(pack.seller).to.equal(seller.address);
  });

  it("should allow buyer to buy a packed NFT", async () => {
    // Approve & pack
    await nft.connect(seller).approve(await marketplace.getAddress(), 1);
    await marketplace.connect(seller).takePack(await nft.getAddress(), 1, ethers.parseEther("1"));

    // Buy
    await expect(
      marketplace.connect(buyer).buyNFT(await nft.getAddress(), 1, { value: ethers.parseEther("1") })
    )
      .to.emit(marketplace, "Purchased")
      .withArgs(await nft.getAddress(), 1, buyer.address, ethers.parseEther("1"));

    // Confirm ownership
    expect(await nft.ownerOf(1)).to.equal(buyer.address);
  });

  it("should allow seller to unPack", async () => {
    await nft.connect(seller).approve(await marketplace.getAddress(), 1);
    await marketplace.connect(seller).takePack(await nft.getAddress(), 1, ethers.parseEther("1"));

    await expect(marketplace.connect(seller).unPack(await nft.getAddress(), 1))
      .to.emit(marketplace, "Unpacked")
      .withArgs(await nft.getAddress(), 1);

    const pack = await marketplace.nfts(await nft.getAddress(), 1);
    expect(pack.price).to.equal(0n); // Empty mapping entry
  });
});
