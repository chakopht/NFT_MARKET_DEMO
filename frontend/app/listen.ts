import { createWalletClient, createPublicClient, parseEventLogs, WalletClient, PublicClient, parseUnits } from "viem";
import { privateKeyToAccount } from 'viem/accounts';
import { collection_abi, bridge_abi, market_abi, gateway_abi, gasservice_abi, collection_c2_abi } from "./test_abi";
import { http } from 'wagmi';
import { hardhat } from "viem/chains";
import { defineChain } from "viem";


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




const axelar_serv_dev = () => {
  // listening the event from axelar
  const unwatch1 = anvilPubClient.watchContractEvent({
      address: gasfeeAddress,
      abi: gasservice_abi,
      eventName: 'NativeGasPaid',
      onLogs: (logs) => {
          const latestLog = logs.at(-1); // dont do anything
          console.log("anvil NativeGasPaid %s", latestLog?.args);
      },
    });


  const unwatch = anvilPubClient.watchContractEvent({
    address: gatewayAddress,
    abi: gateway_abi,
    eventName: 'ContractCalled',
    onLogs: async (logs) => {
      const latestLog = logs.at(-1); 
      console.log("anvil ContractCalled %s", latestLog.args);
      // call hardhat gateway and use gas fee from estimated api
      const execute_resp = await hardhatPubClient.simulateContract({
        account,
        abi: gateway_abi,
        address: hardhatGatewayAddress,
        functionName: 'execute',
        args: [
            latestLog?.args.destinationChain,
            latestLog?.args.destinationAddress,
            latestLog?.args.payload
        ],
      })
      const execute_hash = await hardhatClient.writeContract(execute_resp.request);
      console.log("hardhat bridge hash: %s", execute_hash);
      const execute_receipt = await hardhatPubClient.waitForTransactionReceipt({hash: execute_hash});
      console.log("hardhat bridge receipt: %s", execute_receipt);
      
    },
  });

  const unwatch3 = hardhatPubClient.watchContractEvent({
    address: gasfeeAddress,
    abi: gasservice_abi,
    eventName: 'NativeGasPaid',
    onLogs: (logs) => {
    
      const latestLog = logs.at(-1); // dont do anything
      
    },
  });


  const unwatch2 = hardhatPubClient.watchContractEvent({
    address: hardhatGatewayAddress,
    abi: gateway_abi,
    eventName: 'ContractCalled',
    onLogs: async (logs) => {
  
      const latestLog = logs.at(-1); // call chain2 bridge and use gas fee from estimated api
        console.log("hardhat ContractCalled %s", latestLog.args);
        // call hardhat gateway and use gas fee from estimated api
        const execute_resp = await anvilPubClient.simulateContract({
          account,
          abi: gateway_abi,
          address: gatewayAddress,
          functionName: 'execute',
          args: [
              latestLog?.args.destinationChain,
              latestLog?.args.destinationAddress,
              latestLog?.args.payload
          ],
        })
        const execute_hash = await anvilClient.writeContract(execute_resp.request);
        console.log("anvil bridge execute hash: %s", execute_hash);
        const execute_receipt = await anvilPubClient.waitForTransactionReceipt({hash: execute_hash});
        // console.log("anvil bridge execute receipt: %s", execute_receipt);
      
    },
  });

  const unwatch9 = anvilPubClient.watchContractEvent({
    address: bridgeAddress,
    abi: bridge_abi,
    eventName: 'SMLMintFailed',
    onLogs: async (logs) => {

      const latestLog = logs.at(-1);
      console.log("anvil gateway SMLMintFailed: %s", latestLog?.args);
      
    }
  });

  const unwatch10 = anvilPubClient.watchContractEvent({
    address: bridgeAddress,
    abi: bridge_abi,
    eventName: 'MarketCallRecvFailed',
    onLogs: async (logs) => {
  
        const latestLog = logs.at(-1);
        console.log("anvil gateway SMLMintFailed: %s", latestLog?.args);
      
    }
  });
}

const marketplace_serv_dev = () => {
  const k = [0, 0];
  // Capture Lock event
  const unwatch1 = anvilPubClient.watchContractEvent({
    address: marketplaceAddress,
    abi: market_abi,
    eventName: 'Lock',
    onLogs: (logs) => {
    
      const latestLog = logs.at(-1);
      console.log("anvil Lock %s", latestLog?.args);
      
    },
  });

const unwatch3 = hardhatPubClient.watchContractEvent({
  address: hardhatMarketplaceAddress,
  abi: market_abi,
  eventName: 'Lock',
  onLogs: (logs) => {

    const latestLog = logs.at(-1);
    console.log("hardhat Lock %s", latestLog?.args);
    
  },
});

}


const main = () => {
    // capture event
    axelar_serv_dev();
    marketplace_serv_dev();
}

main();