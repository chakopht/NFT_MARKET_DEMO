"use client";

import ItemGrid from "@/components/itemGrid";
import { MarketItem } from "@/components/itemGrid";
import { useState, useEffect, useRef } from "react";
import { gql, GraphQLClient } from "graphql-request"
import { readContract, getAccount } from "@wagmi/core";
import { erc721Abi } from "viem";
import { rainbowConfig, bridgeConfig } from "@/components/config";
import { PacksQueryResponse } from "@/components/itemGrid";
import { useChainId } from "wagmi";


export default function Home() {
  // mock item
  // const mock_item: MarketItem = {
  //     id: "1",
  //     seller: `0x120e6427A7bCC9Aa57c45facff03B83b9E983d47`,
  //     price: BigInt(700000000000000),
  //     nft: `0x001`,
  //     uri: `https://${process.env.NEXT_PUBLIC_PINATA_GW}/ipfs/bafybeihhn4sy5eorydznoz2iv3v3lscjbyleqqjkkko7xoz2em4d6x65sq`,
  //     tokenId: "test",
  //     lock: BigInt(0),
  //     flag: BigInt(0)
  // };
  const onceEffect = useRef(false);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const chainId = useChainId();
  const perPage = 12;
  let graphQLClient = new GraphQLClient(bridgeConfig[chainId].graph);


  const fetchItems = async (skip: number = 0) => {
    // fetch nfts 
    console.log("fetch now");
    setLoading(true);
    const account = getAccount(rainbowConfig)
    // need fetch data from graphql
    const doc = gql`
      query GetPacks($first: Int!, $skip: Int!, $where: Pack_filter) 
        {
            packs(
              first: $first,
              skip: $skip,
              where: $where,
              orderBy: id,
              orderDirection: asc
            ) {
              id
              tokenId
              seller
              price
              nft
              flag
              status
              lock
            }
        }`;

    // request Pack enetity
    console.log(`items length: ${items.length}`);
    try {
      const req = await graphQLClient.request<PacksQueryResponse>(
        doc, {
          first: perPage,
          skip: skip,
          where: {
            seller: account.address,
            status: 1,
            lock: 0
          }
        }
      );
      const newItems = req.packs;
      
      if (newItems.length > 0) {
        for (let i=0; i < newItems.length; i++){
          // get the tokenURI
          newItems[i].uri = await readContract(rainbowConfig, {
            abi: erc721Abi,
            address: newItems[i].nft,
            functionName: 'tokenURI',
            args: [
              BigInt(newItems[i].tokenId)
            ]
          })
        }
        // if there is newItems then add page and set items
        setItems((prev) => [...prev, ...newItems]);
        
      }

    } catch (error) {
      console.log(`Query Failure: ${error}`);
    }
      setLoading(false);
  }

  const reFetchItems = async () => {
    // refetch the items
    console.log("reFetch");
    setItems([]);
    await fetchItems();
  }

  // scroll to fetch new data
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.target as HTMLDivElement;
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5 && !loading) {
      fetchItems(items.length);
    }
  };

  useEffect(() => {
    // fetch first page
    if (onceEffect.current == false) {
      onceEffect.current = true;
    } else {
      console.log("chain effect called");
      graphQLClient = new GraphQLClient(bridgeConfig[chainId].graph);
      reFetchItems();
    }
  }, [chainId]);

  return (
    <div onScroll={handleScroll} className="h-screen super-scrollbar">
      <ItemGrid items={items} reFetchItems={reFetchItems} flag={false}/>
    </div>
  );
}
