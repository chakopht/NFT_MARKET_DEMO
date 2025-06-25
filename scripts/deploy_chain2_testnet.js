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

  async function v2_upgrade_main() {
    const BridgeV2 = await ethers.getContractFactory("SMLBridgeV2");
        const ImplV2 = await upgrades.upgradeProxy("0x49DB0f417a4764EeB3909De8160333a0D76aA9fE", BridgeV2, {
            kind: "uups"
        })
        console.log("v2 proxy address: ", ImplV2.target);
   }
  
// Run the script
// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });


// v2_upgrade_main().then(() => process.exit(0))
// .catch((error) => {
//   console.error(error);
//   process.exit(1);
// });

async function depoly_new_bridge() {
  const [deployer] = await ethers.getSigners();
  const gateway_addr = "0xe432150cce91c13a887f7D836923d5597adD8E31";
  const gas_addr = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
  const nft_addr = "0xe93D1bcfd27123bD0233FfABfA4BdE4B62a802A8";
  const market_addr = "0x4D5f022BFd7986B80a76AA1c2A3A2277EC86f909";
  const Bridge = await ethers.getContractFactory("SMLBridge");
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


 depoly_new_bridge().then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });