async function main() {
    // Get the ContractFactory and Signers
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
  
    // Get the ContractFactory
    const Collection = await ethers.getContractFactory("SmilyCollection");
    const Marketplace = await ethers.getContractFactory("Marketplace");
  
    // Deploy the contract
    console.log("Deploying SmilyCollection...");
    const nft = await Collection.connect(deployer).deploy(deployer.address);
    await nft.waitForDeployment();
    console.log("SmilyCollection deployed to:", nft.address);

    console.log("Deploying Marketplace...");
    const market = await Marketplace.connect(deployer).deploy();
    await market.waitForDeployment();
    console.log("Marketplace deployed to:", market.address);
  }
  
  // Run the script
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  