const { ethers } = require("hardhat");

async function main() {
    // Get the ContractFactory and Signers
    // const [deployer] = await ethers.getSigners();
    // Connect to Anvil
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const deployer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);

    console.log("Deploying contracts with the account:", deployer.address);
  
    // Get the ContractFactory
    const Collection = await ethers.getContractFactory("SmilyCollection");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const Gateway = await ethers.getContractFactory("MockAxelarGateway");
    const GasService = await ethers.getContractFactory("MockAxelarGasService");
    const Bridge = await ethers.getContractFactory("SMLBridge");

    // Deploy the collection
    console.log("Deploying SmilyCollection...");
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


    // Initial Gateway
    console.log("Deploying Gateway...");
    const gateway_proxy = await Gateway.connect(deployer).deploy(ethers.ZeroAddress)
    await gateway_proxy.waitForDeployment();
    const gateway_addr = await gateway_proxy.getAddress();
    console.log("Gateway deployed to:", gateway_addr);

    // Initial GasService
    console.log("Deploying GasService...");
    const gas_proxy = await GasService.connect(deployer).deploy()
    await gas_proxy.waitForDeployment();
    const gas_addr = await gas_proxy.getAddress();
    console.log("Gas deployed to:", gas_addr);

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
  