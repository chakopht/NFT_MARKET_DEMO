require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
console.log(`${ALCHEMY_API_KEY},, ${SEPOLIA_PRIVATE_KEY}`);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY]
    },
    scrollSepolia: {
      url: `https://scroll-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY]
    },
    chainA: {
      url: "http://127.0.0.1:8545", // Chain A
      chainId: 31337
    },
    chainB: {
      url: "http://127.0.0.1:8546", // Chain B
      chainId: 1338
    },
  }
};
