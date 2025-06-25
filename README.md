# 📘 Smiley's NFT Market

This project is built with Next.js , Hardhat, Solidity.
Users can mint, buy, and sell the nft. And it supports both sepolia and scroll sepolia testnet. It also supports transfering from one blockchain to anoter which is bridge.


## 🧰 Features

- ✅ Mint NFT
- ✅ Manager your own nft assets, including list, change price, remove.
- ✅ NFT trading.
- ✅ NFT Brdige (Between scroll sepolia and seplolia)



## ✍️ About
- Product url: https://nft-market-demo-peach.vercel.app/
- Github: https://github.com/chakopht/NFT_MARKET_DEMO
- Author: chakopht@outlook.com

## 📦 Tech Stack
- Frontend: Next.js, Tailwind CSS ShadCN, Typescirpt, GraphQL
- Frontend(web3 lib): viem, wagmi, ether.js, rainbowkit
- Smart Contract: Hardhat, Solidity, Openzepplin, Axelar
- Data Storage: Pinata, TheGraph

## 🚀 Depolyment

 - Frontend:
    - Vercel: https://vercel.com
    - Set your own 
 - Graph:
    - Local test graph image: https://github.com/graphprotocol/graph-node
    - The Graph: https://thegraph.com/studio


    ``` bash
    # make sure you have finished your subgraph schema and subgraph.yaml and mapping.ts
    graph clean
    graph codegen && build
    # deploy to local
    docker compose -f docker-compose-1.yml -p service-a up -d
    graph create <subgraph name> --node http://127.0.0.1:8020
    graph deploy <subgraph name> --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020
    # deploy to the graph
    graph auth <your deploy key>
    graph deploy <subgraph slug>
    ```
 - Smart Contract:

    1. Set your target network in hardhat.config.js

    2. Write your deploy script

    3. Use hardhat run command

    ``` bash
    npx hardhat run scripts/<your-script> --network <network-name>
    ```


## 🗂️ Porject Structure
---
``` bash
smiley nft market/
├── contracts/                # Smart Contracts
│
├── fontend/app/              # Frontend Pages
│   ├── publics/
│   └── src/
├── subgraph
|   └── graph/
├── scripts/                  # Deploy
├── test/                     # Unit test contract
├── hardhat.config.js/        # Set network
└── README.md
```