import { ethers, network } from "hardhat";

async function main() {
  const chainId = await ethers.provider.send("eth_chainId", []);
  console.log("Chain ID:", parseInt(chainId)); // Or keep hex
}

main();