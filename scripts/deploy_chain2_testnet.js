const { deploy } = require("@openzeppelin/hardhat-upgrades/dist/utils");
const { ethers } = require("hardhat");

async function main() {
    // Get the ContractFactory and Signers
    const [deployer] = await ethers.getSigners();
    const gateway_addr = "0xe432150cce91c13a887f7D836923d5597adD8E31";
    const gas_addr = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";

    console.log("Deploying contracts with the account:", deployer.address);
  
    // Get the ContractFactory
    const Collection = await ethers.getContractFactory("SmilyCollectionC2");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const Bridge = await ethers.getContractFactory("SMLBridge");

    
  
    // Deploy the collection
    console.log("Deploying SmilyCollectionV2...");
    const nft = await upgrades.deployProxy(Collection, [deployer.address], {
            initializer: "init",
            kind: "uups"
    })
    await nft.waitForDeployment();
    const nft_addr = await nft.getAddress();
    console.log("SmilyCollection deployed to:", nft_addr);


    // Initial Marketplace proxy
    console.log("Deploying Marketplace...");
    const market_proxy = await upgrades.deployProxy(Marketplace, [deployer.address], {
            initializer: "init",
            kind: "uups"
        })
    await market_proxy.waitForDeployment();
    const market_addr = await market_proxy.getAddress();
    console.log("Marketplace deployed to:", market_addr);

    // Deploy bridge
    console.log("Deploying Bridge...");
    const bridge_proxy =  await upgrades.deployProxy(Bridge, 
      [deployer.address, gateway_addr, gas_addr, nft_addr, market_addr], {
      initializer: "init",
      kind: "uups"
    })
    await bridge_proxy.waitForDeployment();
    const bridge_proxy_addr = await bridge_proxy.getAddress();
    console.log("Bridge deployed to:", bridge_proxy_addr);

  }
  
// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  