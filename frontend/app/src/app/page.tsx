"use client";

import ItemGrid from "@/components/itemGrid";
import { MarketItem } from "@/components/itemGrid";
import { useState, useEffect, useRef } from "react";
import { gql, GraphQLClient } from "graphql-request"
import { readContract } from "@wagmi/core";
import { erc721Abi } from "viem";
import { rainbowConfig, graphNode } from "@/components/config";
import { PacksQueryResponse } from "@/components/itemGrid";

const graphQLClient = new GraphQLClient(graphNode);


export default function Home() {
  //to make sure useEffect wont be called twice
  const onceEffect = useRef(false);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const perPage = 12;


  const fetchItems = async (skip: number = 0) => {
    // fetch nfts 
    setLoading(true);
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
              seller
              price
              nft
              flag
              status
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
            flag: 0,
            status: 1
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
              BigInt(newItems[i].id)
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
      console.log("effect called");
      onceEffect.current = true;
      fetchItems();
    }
  }, []);

  return (
    <div onScroll={handleScroll} className="h-screen super-scrollbar">
      <ItemGrid items={items} reFetchItems={reFetchItems} flag={true}/>
    </div>
  );
}
