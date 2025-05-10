import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { formatEther, parseEther, parseEventLogs, slice } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { rainbowConfig, marketplaceABI, marketplaceAddress, collectionABI, collectionsAddress } from "./config";
import { writeContract, getAccount, simulateContract, waitForTransactionReceipt } from "@wagmi/core";
import { skaleEuropa } from "viem/chains";

export type MarketItem = {
  id: string;
  seller: `0x${string}`;
  price: bigint;
  nft: `0x${string}`;
  uri: string;
};

interface ItemGridProps {
  items: MarketItem[];
  reFetchItems: () => void;
  flag: boolean;
}


export default function ItemGrid({items, reFetchItems, flag = true}: ItemGridProps) {

  const [loading, setLoading] = useState(false);
  // to change the items info independently

  const checkAccount = (seller: `0x${string}`, flag: boolean=true) => {
    const account = getAccount(rainbowConfig);
    console.log(`seller: ${seller}  address: ${account.address?.toLowerCase()}`)
    const pattern = flag ? seller == account.address?.toLowerCase() : seller != account.address?.toLowerCase()
    if (pattern || !account.isConnected) {
      // disable button
      return true;
    } else {
      return false;
    }
  }

  async function buyNFT(nft: `0x${string}`, tokenId: bigint, price: string) {
    // buying a nft
    setLoading(true);
        const account = getAccount(rainbowConfig);
        if (account.isConnected) {
          try {
              const res = await simulateContract(rainbowConfig, {
                abi: marketplaceABI,
                address: marketplaceAddress,
                functionName: 'buyNFT',
                args: [
                  nft, 
                  tokenId
                ],
                value: parseEther(price),
                connector: account.connector
              })
    
              const buy_hash = await writeContract(rainbowConfig, res.request);

              // approve the item
              const approve_res = await simulateContract(rainbowConfig, {
                abi: collectionABI,
                address: collectionsAddress,
                functionName: 'approve',
                args: [
                  marketplaceAddress,
                  tokenId
                ],
                connector: account.connector
              })
              
              const approve_hash = await writeContract(rainbowConfig, approve_res.request);
              console.log(`approve_hash: ${approve_hash}`)

              // reFetch the items
              await reFetchItems();
    
              // get mint tokenid
              // const buy_receipt = await waitForTransactionReceipt(rainbowConfig, {
              //   hash: buy_hash
              // });
    
            console.log("buying finished")
          } catch (error) {
            console.log(`Buying Failure ${error} !`)
          }
        }
        setLoading(false);
  };

  async function unPack(nft: `0x${string}`, tokenId: bigint){
    
    const account = getAccount(rainbowConfig);
    if (account.isConnected) {
      // delete the nft
      try {
        setLoading(true);
        const res = await simulateContract(rainbowConfig, {
          abi: marketplaceABI,
          address: marketplaceAddress,
          functionName: 'unPack',
          args: [
            nft, 
            tokenId
          ],
          connector: account.connector
        })
  
        const unpack_hash = await writeContract(rainbowConfig, res.request);
        // reFetch the items
        setTimeout(async() => {await reFetchItems(); setLoading(false);}, 1500);
      } catch (error) {
        console.log(`UnPack Failure ${error} !`);
        setLoading(false);
      }
    }
    
  }

  return (
    <div className="h-[calc(100vh+10px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((item) => (
            <Dialog>
              <DialogTrigger asChild>
                <Card key={item.id} className="transition hover:shadow-2xl w-55 h-60 pt-0 pb-3 mb-3 gap-0">
                  <CardHeader className="relative w-full h-50 overflow-hidden">
                      <Image
                        src={item.uri}
                        alt={item.id}
                        fill
                        className="rounded-t-xl object-cover"
                      />
                  </CardHeader>
                  <CardContent className="flex flex-row justify-center items-center gap-4">
                  <CardTitle className="text-lg mt-3"># {item.id}</CardTitle>
                    <div className="text-gray-500 mt-3">{formatEther(item.price)} ETH</div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-180">
                <DialogHeader>
                  <DialogTitle>{flag ? ("Buying Token:") : ("Token:")} # {item.id}</DialogTitle>
                  <DialogDescription>
                    Collections Address - {item.nft}
                  </DialogDescription>
                  </DialogHeader>
                    <div className="grid items-center w-full gap-5">
                      <div className="relative grid w-full h-50 items-center">
                        <Image src={item.uri} alt={item.id} fill className="rounded-xl object-cover"/>
                      </div>
                      <div className="grid grid-rows-1 grid-cols-2 items-center w-70">
                        <Label className="font-bold text-left">
                          {flag ? ("Seller") : ("Owner")}: 
                        </Label>
                        <Label className="text-cyan-400">{item.seller}</Label>
                      </div>
                      <div className="grid grid-rows-1 grid-cols-2 items-center w-70">
                        <Label className="font-bold text-left">
                          Price
                        </Label>
                        <Label className="font-bold text-violet-800">
                        {formatEther(item.price)} ETH
                        </Label>
                      </div>
                    </div>
                  <DialogFooter>
                    { flag ? (
                      <Button className="mr-2.5" onClick={()=>buyNFT(item.nft, BigInt(item.id), formatEther(item.price))} 
                    disabled={loading || checkAccount(item.seller)}>
                      {loading ? (<Loader2 className="animate-spin" />) : ''}
                      {loading ? 'Waiting...' : 'BUY IT !'}
                    </Button>
                  ) : (
                    <Button className="mr-2.5" onClick={()=>unPack(item.nft, BigInt(item.id))} 
                    disabled={loading || checkAccount(item.seller, false)}>
                      {loading ? (<Loader2 className="animate-spin" />) : ''}
                      {loading ? 'Waiting...' : 'REMOVE IT !'}
                    </Button>
                  ) }
                  </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
      </div>
    </div>
  );
}
