import { createWalletClient, createPublicClient, parseEventLogs, WalletClient, PublicClient, parseUnits, padHex, stringToHex } from "viem";
import { privateKeyToAccount } from 'viem/accounts';
import { collection_abi, bridge_abi, market_abi, gateway_abi, gasservice_abi, collection_c2_abi } from "./test_abi";
import { http } from 'wagmi';
import { hardhat } from "viem/chains";
import { defineChain, encodeAbiParameters } from "viem";
import { AxelarQueryAPI, Environment, CHAINS } from "@axelar-network/axelarjs-sdk";


const anvil = defineChain({
  id: 1338,
  name: 'Anvil Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8546'] },
  },
  blockExplorers: undefined, // No explorer for local chain
  contracts: {}, // Add if needed
});


const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')


const anvilPubClient = createPublicClient({
  chain: anvil,
  transport: http('http://127.0.0.1:8546'),
})

const hardhatPubClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
})

const anvilClient = createWalletClient({
  account,
  chain: anvil,
  transport: http('http://127.0.0.1:8546'),
})

const hardhatClient = createWalletClient({
  account,
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
})

type ClientPair = [WalletClient, PublicClient];

type ClientMap = {
  anvil: ClientPair,
  hardhat: ClientPair
}

const client: ClientMap = {
  anvil: [anvilClient, anvilPubClient],
  hardhat: [hardhatClient, hardhatPubClient]
}


// anvil address
const collectionsAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const marketplaceAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
const gatewayAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
const gasfeeAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const bridgeAddress = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853';


// hardhat address
const hardhatCollectionsAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const hardhatMarketplaceAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
const hardhatGatewayAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
const hardhatGasfeeAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const hardhatBridgeAddress = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853';



const PINATA = 'coffee-eldest-monkey-667.mypinata.cloud';
const cid = 'bafybeihhn4sy5eorydznoz2iv3v3lscjbyleqqjkkko7xoz2em4d6x65sq';


const mint = async (client: ClientPair) => {
  // mint
    const mint_res = await client[1].simulateContract({
        account,
        abi: collection_abi,
        address: hardhatCollectionsAddress,
        functionName: 'mint',
        args: [
            `https://${PINATA}/ipfs/${cid}`
        ],
    })
    console.log("mint_res: %s", mint_res.request);
    const mint_hash = await client[0].writeContract(mint_res.request);

    // get mint tokenid
    const mint_receipt = await client[1].waitForTransactionReceipt({hash: mint_hash});
    
    const eventLogs = parseEventLogs({
      abi: collection_abi,
      logs: mint_receipt.logs
    })
    const tokenId = eventLogs[1].args._tokenId;
    console.log("tokeId: %s", tokenId);
}

const pack = async (client: ClientPair, tokenId: any) => {
    // marketplace pack
    const parse_price = parseUnits("0.07", 18);
    console.log("parse_price: %s", parse_price);
        
    const pack_res = await client[1].simulateContract({
      abi: market_abi,
      address: hardhatMarketplaceAddress,
      functionName: 'takePack',
      args: [
        hardhatCollectionsAddress,
        tokenId,
        parse_price
      ],
      account
    })
  const pack_hash = await client[0].writeContract(pack_res.request);
  const pack_receipt = await client[1].waitForTransactionReceipt({
    hash: pack_hash
  });
  
  const packLogs = parseEventLogs({
    abi: market_abi,
    logs: pack_receipt.logs
  })

  console.log(packLogs)
}


const start_bridge_anvil = async (tokenId: bigint) => {
  // start taking bridge
  // anvil
  const parse_price = parseUnits("0.07", 18);
  const resp = await anvilPubClient.simulateContract({
    account,
    abi: bridge_abi,
    address: bridgeAddress,
    functionName: 'sendNFT',
    args: [
        'hardhat',
        hardhatBridgeAddress,
        tokenId,
        parse_price
    ],
  })
  console.log("anvil bridge sendNFT: %s", resp.request);
  const hash = await anvilClient.writeContract(resp.request);
  const receipt = await anvilPubClient.waitForTransactionReceipt({hash: hash});
  console.log("anvil bridge receipt: %s", receipt);
} 

const start_bridge_hardhat = async (tokenId: bigint) => {
  // start taking bridge
  // hardhat
  const parse_price = parseUnits("0.07", 18);
  const resp = await hardhatPubClient.simulateContract({
    account,
    abi: bridge_abi,
    address: hardhatBridgeAddress,
    functionName: 'sendNFT',
    args: [
        'anvil',
        bridgeAddress,
        tokenId,
        parse_price
    ],
  })
  console.log("hardhat bridge sendNFT: %s", resp.request);
  const hash = await hardhatClient.writeContract(resp.request);
  const receipt = await hardhatPubClient.waitForTransactionReceipt({hash: hash});
  console.log("hardhat bridge receipt: %s", receipt);
} 


const estimate_1 = async (tokenId: bigint, uri: string) => {
    
    console.log("begin");

    // gas estimate
    const payload = encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'uint256' },
        { type: 'string' },
      ],
      [account.address, tokenId, uri]
    )
    const axeApi = new AxelarQueryAPI({environment: Environment.TESTNET});
    const response = await axeApi.estimateGasFee(
      CHAINS.TESTNET.SEPOLIA,
      CHAINS.TESTNET.POLYGON_SEPOLIA,
      700000, // gas limit
      1.1,
      undefined,
      undefined,
      payload
    )
    console.log(typeof(response));
}

const check_token_exist = async (client: PublicClient, tokenId: bigint, abi: any, addr: `0x${string}`) => {
  //verify bridge result
  // get nft token to take a check
  const resp = await client.readContract({
    abi,
    address: addr,
    functionName: 'tokenURI',
    args: [
      tokenId
    ]});
    console.log("tokenuri is %s", resp);
}

const set_gateway_recivier = async (client: WalletClient, pubclient: PublicClient, addr: `0x${string}`, 
  bridge_addr: `0x${string}`, abi: any) => {
    // set recevier for gateway
    const resp = await pubclient.simulateContract({
      account,
      abi: abi,
      address: addr,
      functionName: 'setReceiver',
      args: [
          bridge_addr
      ],
    })
    console.log("setReciver: %s", resp.request);
    const hash = await client.writeContract(resp.request);
    const receipt = await pubclient.waitForTransactionReceipt({hash: hash});
}

const set_collection_bridge = async (client: WalletClient, pubclient: PublicClient, addr: `0x${string}`, 
  bridge_addr: `0x${string}`, abi: any) => {
    // set bridge addr for collection
    const resp = await pubclient.simulateContract({
      account,
      abi: abi,
      address: addr,
      functionName: 'setBridge',
      args: [
          bridge_addr
      ],
    })
    console.log("setBridge: %s", resp.request);
    const hash = await client.writeContract(resp.request);
    const receipt = await pubclient.waitForTransactionReceipt({hash: hash});
}

const set_approve = async (client: WalletClient, pubclient: PublicClient, tokenId: bigint, abi: any, addr: `0x${string}`) => {
   const approve_res = await pubclient.simulateContract({
    account,
    abi: abi,
    address: collectionsAddress,
    functionName: 'approve',
    args: [
      addr,
      tokenId
    ]
  })

  const approve_hash = await client.writeContract(approve_res.request);
  await pubclient.waitForTransactionReceipt({
    hash: approve_hash
  });
}

const main = async () => {
    // set gateway receiver as bridge address

    await set_gateway_recivier(anvilClient, anvilPubClient, gatewayAddress, bridgeAddress, gateway_abi);
    await set_gateway_recivier(hardhatClient, hardhatPubClient, hardhatGatewayAddress, hardhatBridgeAddress, gateway_abi);

    //set collection bridge

    await set_collection_bridge(anvilClient, anvilPubClient, collectionsAddress, bridgeAddress, collection_c2_abi);
    await set_collection_bridge(hardhatClient, hardhatPubClient, hardhatCollectionsAddress, hardhatBridgeAddress, collection_abi);

    // mint pack estimate
    // mint(client.hardhat);
    // pack(client.hardhat, 1);
    // chain1(BigInt(4), `https://${PINATA}/ipfs/${cid}`);

    // test hardhat bridge
    // set_approve(hardhatClient, hardhatPubClient, BigInt(1), collection_abi, hardhatBridgeAddress);
    // start_bridge_hardhat(BigInt(1));

    // test anvil bridge
    // set_approve(anvilClient, anvilPubClient, BigInt(1), collection_c2_abi, bridgeAddress);
    // start_bridge_anvil(BigInt(1));

    // verify is bridge success
    // check_token_exist(hardhatPubClient, BigInt(2), collection_abi, hardhatCollectionsAddress);
    // check_token_exist(anvilPubClient, BigInt(2), collection_c2_abi, collectionsAddress);


  // const payload = '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000f8b0a10e4700000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000007068747470733a2f2f636f666665652d656c646573742d6d6f6e6b65792d3636372e6d7970696e6174612e636c6f75642f697066732f6261667962656968686e34737935656f7279647a6e6f7a3269763376336c73636a62796c6571716a6b6b6b6f37786f7a32656d346436783635737100000000000000000000000000000000';
    
  // const execute_resp = await anvilPubClient.simulateContract({
  //     account,
  //     abi: bridge_abi,
  //     address: bridgeAddress,
  //     functionName: 'execute',
  //     args: [
  //         padHex(stringToHex("1"), {size: 32}),
  //         'anvil',
  //         '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  //         payload
  //     ],
  // })
//   const token_hash = await anvilClient.writeContract({
//     account,
//     abi: collection_c2_abi,
//     address: collectionsAddress,
//     functionName: 'bridge_mint',
//     args: [
//         '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
//         BigInt('2'),
//         `https://${PINATA}/ipfs/${cid}`
//     ],
// });
//   console.log("anvil nft execute hash: %s", token_hash);


//   const execute_hash = await anvilClient.writeContract({
//     account,
//     abi: bridge_abi,
//     address: bridgeAddress,
//     functionName: 'execute',
//     args: [
//         padHex(stringToHex("1"), {size: 32}),
//         'anvil',
//         '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
//         payload
//     ],
// });
//   console.log("anvil bridge execute hash: %s", execute_hash);
// estimate_1(BigInt(1), `https://${PINATA}/ipfs/${cid}`);
}

main();