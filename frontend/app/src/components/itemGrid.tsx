import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { formatEther, parseEther, parseUnits } from "viem";
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
import { ChangeEvent, useState } from "react";
import { rainbowConfig,  bridgeConfig } from "./config";
import { writeContract, getAccount, simulateContract, waitForTransactionReceipt, readContract } from "@wagmi/core";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { useChainId } from "wagmi";
import { sleep } from "./utils";

export type MarketItem = {
  id: string;
  seller: `0x${string}`;
  price: bigint;
  nft: `0x${string}`;
  uri: string;
  tokenId: string;
  lock: bigint;
  flag: bigint;
};

export interface PacksQueryResponse {
  packs: {
    id: string;
    seller: `0x${string}`;
    price: bigint;
    nft: `0x${string}`;
    uri: string;
    tokenId: string;
    lock: bigint;
    flag: bigint;
    status: bigint;
  }[];
}

interface ItemGridProps {
  items: MarketItem[];
  reFetchItems: () => void;
  flag: boolean;
}


export default function ItemGrid({items, reFetchItems, flag = true}: ItemGridProps) {

  const [loading, setLoading] = useState<boolean>(false);
  const [inputFlag, setInputFlag] = useState<boolean>(false);
  const [price, setPrice] = useState<string | null>(null);
  const [priceErr, setPriceErr] = useState<string | null>(null);
  const [listed, setListed] = useState<bigint | null>(null);
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});
  const chainId = useChainId();
  // to change the items info independently

  const checkAccount = (seller: `0x${string}`, flag: boolean=true) => {
    // flag is true: market mode
    // flag is false: collection mode
    const account = getAccount(rainbowConfig);
    const pattern = flag ? seller.toLowerCase() == account.address?.toLowerCase() : seller.toLowerCase() != account.address?.toLowerCase();
    if (pattern || !account.isConnected) {
      // disable button
      return true;
    } else {
      return false;
    }
  }

  const handleDialog = (open: boolean, flag: bigint) => {
    // capture dialog window status
    // disable input after open dialog
    if (open){
      console.log(flag);
      setInputFlag(open);
      setPrice(null);
      setListed(flag);
    }
  }

  const handleFlag = (flag: boolean) => {
    // capture Listed switch
    if (flag) {
      setListed(BigInt('1'));
    } else {
      setListed(BigInt('0'));
    }
  }

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    // capture the price change
      const price = event.target.value;
      if (price) {
        if (parseFloat(price) > 0) {
          setPriceErr(null);
          setPrice(price);
        }else{
          setPriceErr('price must greater than 0 ETH');
          setPrice(null);
        }
      }
    };

  async function buyNFT(nft: `0x${string}`, tokenId: bigint, price: string) {
    // buying a nft
    setLoading(true);
    const account = getAccount(rainbowConfig);
    if (account.isConnected) {
      try {
          const colIndex = bridgeConfig[chainId].collection.findIndex((item: `0x${string}`) => item.toLowerCase() === nft.toLowerCase());
          if (colIndex == -1) { throw new Error("NFT abi is invalid."); }
          const res = await simulateContract(rainbowConfig, {
            abi: bridgeConfig[chainId].abi.marketplace,
            address: bridgeConfig[chainId].market,
            functionName: 'buyNFT',
            args: [
              nft, 
              tokenId
            ],
            value: parseEther(price),
            connector: account.connector
          })

          await writeContract(rainbowConfig, res.request);
          await sleep(1500);

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
          abi: bridgeConfig[chainId].abi.marketplace,
          address: bridgeConfig[chainId].market,
          functionName: 'unPack',
          args: [
            nft, 
            tokenId
          ],
          connector: account.connector
        })
  
        await writeContract(rainbowConfig, res.request);
        // reFetch the items
        setTimeout(async() => {await reFetchItems(); setLoading(false);}, 1500);
      } catch (error) {
        console.log(`UnPack Failure ${error} !`);
        setLoading(false);
      }
    }  
  }

  const cancelParam = (oldFlag: bigint) => {
    console.log(oldFlag);
    setListed(oldFlag);
    setInputFlag(true);
  }

  async function saveParam(nft: `0x${string}`, tokenId: bigint, oldPrice: bigint, oldListed: bigint) {
    setLoading(true);
    let refetchFlag = false;
    // one worked refetch
    if (price){
      // save price
      const parse_price = parseUnits(price, 18);
      if (parse_price != oldPrice){
        const flag1 = await savePrice(nft, tokenId, parse_price);
        refetchFlag =  refetchFlag || flag1;
      }
    }

    if (listed != null && listed != oldListed){
      // save flag
      const flag2 = await saveFlag(nft, tokenId, listed);
      refetchFlag = refetchFlag || flag2;
    }

    // refetch the items
    if (refetchFlag) { await sleep(1500); reFetchItems();}

    setLoading(false);
    // setTimeout(async() => {await reFetchItems(); setLoading(false);}, 1500);
    setInputFlag(true);
  }

  async function savePrice(nft: `0x${string}`, tokenId: bigint, price: bigint){
    const account = getAccount(rainbowConfig);
    if (account.isConnected) {
      // change nft price
      try {
        const res = await simulateContract(rainbowConfig, {
          abi: bridgeConfig[chainId].abi.marketplace,
          address: bridgeConfig[chainId].market,
          functionName: 'setPrice',
          args: [
            nft, 
            tokenId,
            price
          ],
          connector: account.connector
        })
  
        await writeContract(rainbowConfig, res.request);
        const hash = await writeContract(rainbowConfig, res.request);
        await waitForTransactionReceipt(rainbowConfig, {
          hash
        });
        return true;
      } catch (error) {
        console.log(`SetPrice Failure ${error} !`);
        return false;
      }
    }
    return false; 
  }

  async function saveFlag(nft: `0x${string}`, tokenId: bigint, flag: bigint){
    const account = getAccount(rainbowConfig);
    if (account.isConnected) {
      // change nft price
      try {
        if (flag == BigInt(1)){
          // check approve to market
          const approve = await readContract(rainbowConfig, {
            abi: bridgeConfig[chainId].abi.collection[0],
            address: bridgeConfig[chainId].collection[0],
            functionName: 'getApproved',
            args: [
              tokenId
            ]
          });
          if (typeof(approve) != 'string') throw Error('approve type error');
          if (bridgeConfig[chainId].market.toLowerCase() != approve.toLowerCase()){
            // set approve
            const approve_res = await simulateContract(rainbowConfig, {
              abi: bridgeConfig[chainId].abi.collection[0],
              address: bridgeConfig[chainId].collection[0],
              functionName: 'approve',
              args: [
                bridgeConfig[chainId].market,
                tokenId
              ],
              connector: account.connector
            })
  
            const approve_hash = await writeContract(rainbowConfig, approve_res.request);
            await waitForTransactionReceipt(rainbowConfig, {
              hash: approve_hash
            });
          }
        }
        const res = await simulateContract(rainbowConfig, {
          abi: bridgeConfig[chainId].abi.marketplace,
          address: bridgeConfig[chainId].market,
          functionName: 'setFlag',
          args: [
            nft, 
            tokenId,
            flag
          ],
          connector: account.connector
        })
        const hash = await writeContract(rainbowConfig, res.request);
        await waitForTransactionReceipt(rainbowConfig, {
          hash
        });
        return true;
      } catch (error) {
        console.log(`SetFlag Failure ${error} !`);
        return false;
      }
    }  
    return false;
  }

  return (
    <div className="h-[calc(100vh+10px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((item) => (
            <Dialog key={item.tokenId} onOpenChange={(open: boolean) => handleDialog(open, item.flag)}>
              <DialogTrigger asChild>
                <Card key={item.tokenId} className={ item.flag == BigInt(1) ? 
                  "transition hover:shadow-2xl w-55 h-60 pt-0 pb-3 mb-3 gap-0" : 
                  "transition hover:shadow-2xl w-55 h-60 pt-0 pb-3 mb-3 gap-0 bg-muted text-muted-foreground opacity-60"}>
                  <CardHeader className="relative w-full h-50 overflow-hidden">
                      <Image
                        src={item.uri}
                        alt={item.tokenId}
                        fill
                        onLoadingComplete={() =>
                          setLoadedMap((prev) => ({ ...prev, [item.tokenId]: true }))
                        }
                        className={`rounded-t-xl object-cover object-contain transition-opacity duration-500 ${
                          loadedMap[item.tokenId] ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                  </CardHeader>
                  <CardContent className="flex flex-row justify-center items-center gap-4">
                  <CardTitle className="text-lg mt-3"># {item.tokenId}</CardTitle>
                    <div className="text-gray-500 mt-3">{formatEther(item.price)} ETH</div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-180">
                <DialogHeader>
                  <DialogTitle>{flag ? ("Buying Token:") : ("Token:")} # {item.tokenId}</DialogTitle>
                  <DialogDescription>
                    Collections Address - {item.nft}
                  </DialogDescription>
                  </DialogHeader>
                    <div className="grid items-center w-full gap-5">
                      <div className="relative grid w-full h-50 items-center">
                        <Image src={item.uri} alt={item.tokenId} fill className="rounded-xl object-cover"/>
                      </div>
                      <div className="grid grid-rows-1 grid-cols-3 items-center w-170">
                        <Label className="font-bold text-left">
                          {flag ? ("Seller") : ("Owner")}: 
                        </Label>
                        <Label className="text-cyan-400">{item.seller}</Label>
                      </div>
                      <div className="grid grid-rows-1 grid-cols-3 items-center w-170">
                        <Label className="font-bold text-left">
                          Price:
                        </Label>
                        { 
                          flag || inputFlag ? (<Label className="font-bold text-violet-800">{formatEther(item.price)} ETH</Label>) : 
                          (<Label className="font-bold text-violet-800 mr-5">
                              <Input id="price" type="string" placeholder={formatEther(item.price)} className="mr-5" onChange={handlePriceChange} /> ETH
                            </Label>
                          )
                        }
                        {flag || inputFlag ? '': (priceErr ? (<Label className="text-red-400">{priceErr}</Label>) : price ? (<Label className="text-teal-400">Done!</Label>) : '')}
                      </div>
                      {
                        !flag ? (
                          <div className="grid grid-rows-1 grid-cols-3 items-center w-170">
                            <Label className="font-bold text-left">
                              Listed:
                            </Label>
                            <Switch className="data-[state=checked]:bg-cyan-400" checked={listed == BigInt(1)} onCheckedChange={handleFlag} disabled={inputFlag ? true : false}/>
                        </div>
                        ) : ''
                      }
                    </div>
                  <DialogFooter>
                    { flag ? (
                      <Button className="mr-2.5" onClick={()=>buyNFT(item.nft, BigInt(item.tokenId), formatEther(item.price))} 
                    disabled={loading || checkAccount(item.seller)}>
                      {loading ? (<Loader2 className="animate-spin" />) : ''}
                      {loading ? 'Waiting...' : 'BUY IT !'}
                    </Button>
                  ) : (
                    <div>
                      {
                        inputFlag ? (<div className="flex justify-between w-full gap-2">
                          <Button className="hover:bg-slate-600 font-bold justify-self-end" onClick={()=>setInputFlag(false)} disabled={loading || checkAccount(item.seller, false)}>
                            Change
                          </Button>
                          <Button className="font-bold justify-self-end" variant="destructive" onClick={()=>unPack(item.nft, BigInt(item.tokenId))} 
                          disabled={loading || checkAccount(item.seller, false)}>
                            {loading ? (<Loader2 className="h-2 w-2 animate-spin" />) : ''}
                            {loading ? 'Waiting...' : 'REMOVE !'}
                          </Button></div>
                        ):
                        (
                          <div className="flex justify-between w-full gap-2">
                            <Button className="mr-2.5 bg-cyan-400 hover:bg-cyan-300 font-bold justify-self-end" onClick={()=>saveParam(item.nft, BigInt(item.tokenId), item.price, item.flag)} disabled={loading || checkAccount(item.seller, false)}>
                              {loading ? (<Loader2 className="mx-auto animate-spin" />) : ''}
                              {loading ? 'Saving...' : 'Save'}
                            </Button>
                            <Button className="mr-2.5 hover:bg-slate-600 font-bold justify-self-end" onClick={()=>cancelParam(item.flag)} disabled={loading || checkAccount(item.seller, false)}>
                              Cancel
                            </Button>
                          </div>
                        )
                      }
                    </div>
                  ) }
                  </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
      </div>
    </div>
  );
}
