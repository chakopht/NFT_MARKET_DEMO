const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("UpgradeMarketplace", function () {
  let Marketplace, marketplace;
  let MockNFT, nft;
  let deployer, seller, buyer;
  let proxy;

  beforeEach(async () => {
    [deployer, seller, buyer] =  await ethers.getSigners();
    // Deploy mock ERC721 token
    Collection = await ethers.getContractFactory("SmilyCollection");
    nft = await Collection.connect(deployer).deploy(deployer.address);
    await nft.waitForDeployment();

    const tokenURI = "https://coffee-eldest-monkey-667.mypinata.cloud/ipfs/bafkreiaiy3tx7tjukzrh53h7pfwekx7gg4fqm5auvuixaghwpisgjj24hi";

    // Mint a token to the seller
    await nft.connect(seller).mint(tokenURI);
  })

  it("first_deploy", async () => {
    const Market = await ethers.getContractFactory("Marketplace");
    proxy = await upgrades.deployProxy(Market, [deployer.address], {
        initializer: "init",
        kind: "uups"
    })
    console.log("proxy address: ", proxy.target)
  })

  it("second_deploy", async () => {
    // deploy proxy
    const Market = await ethers.getContractFactory("Marketplace");
    proxy = await upgrades.deployProxy(Market, [deployer.address], {
        initializer: "init",
        kind: "uups"
    })
    console.log("proxy address: ", proxy.target);

    // Approve marketplace
    await nft.connect(seller).approve(await proxy.getAddress(), 1);

    // Pack the NFT
    await expect(
      proxy.connect(seller).takePack(await nft.getAddress(), 1, ethers.parseEther("1"))
    )
      .to.emit(proxy, "Packed")
      .withArgs(await nft.getAddress(), 1, seller.address, ethers.parseEther("1"), 0);

    // expect(await proxy.takeTest()).to.equal(1);

    // upgrade proxy
    console.log(proxy.target)
    const MarketV2 = await ethers.getContractFactory("MarketplaceV2");
    const ImplV2 = await upgrades.upgradeProxy(proxy.target, MarketV2, {
        kind: "uups"
    })
    console.log("v2 proxy address: ", ImplV2.target);
    expect(await ImplV2.takeTest()).to.equal(1);
  })
});
