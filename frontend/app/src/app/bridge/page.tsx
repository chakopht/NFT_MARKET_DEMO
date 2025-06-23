"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, Check, ChevronDown, CircleAlert, Loader2, SquareCheckBigIcon } from "lucide-react";
import React, { ChangeEvent, useState, useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { DialogHeader, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { bridgeConfig, rainbowConfig } from "@/components/config_dev";
import { bridge_estimator } from '@/components/axlear_tools'
import { Environment } from "@axelar-network/axelarjs-sdk";
import { gql, GraphQLClient } from "graphql-request";
import { PacksQueryResponse } from "@/components/itemGrid";


export default function Home() {
    const [targetChain, setTarget] = useState<number | null>(null);
    const [bridgeMsg, setMsg] = useState<string | null | boolean>(null);
    const [targetCheck, setTargetCheck] = useState<boolean>(false);
    const [tokenId, setTokenId] = useState<bigint>();
    const [collectionAddr, setColAddr] = useState<`0x${string}`>();
    const [collectionIndex, setColIndex] = useState<number>();
    const [loading, setLoading] = useState<boolean>(false);

    const {address, isConnected} = useAccount();
    const { chains, switchChain } = useSwitchChain();
    const chainId = useChainId();

    let graphQLClient = new GraphQLClient(bridgeConfig[chainId].graph);

    useEffect(() => {
        // update client
        console.log("chain effect called");
        graphQLClient = new GraphQLClient(bridgeConfig[chainId].graph);
    }, [chainId]);

    const get_price = async (tokenId: bigint, nft: `0x${string}`) => {
        const doc = gql`
              query GetPacks($where: Pack_filter) 
                {
                    packs(
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
            try {
              const req = await graphQLClient.request<PacksQueryResponse>(
                doc, {
                  where: {
                    tokenId: String(tokenId),
                    nft: nft,
                    status: 1,
                    lock: 0
                  }
                }
              );
              const newItems = req.packs;
              if (newItems.length > 0){
                return newItems[0].price;
              }
              return -1;
            } catch (err) {
                console.log(err);
            }
        return -1;
    }

    const truncateAddress = (address: `0x${string}`|undefined) => {
        if (address)
            return `${address.slice(0, 6)}...${address.slice(-4)}`;
        return undefined
    }

    const accountCheck = () => {
        if (isConnected && address != undefined) return true;
        return false;
    }

    const handleTokenInput = (event: ChangeEvent<HTMLInputElement>) => {
        // set tokenId and check format
        let token_id = BigInt(0);
        if (event.target.value) {
            token_id = BigInt(event.target.value);
            setTokenId(token_id);
            setMsg(true);
        } else {
            setTokenId(undefined);
            setMsg('Token ID is invalid');
        }
    }

    const handleCollectionInput = (event: ChangeEvent<HTMLInputElement>) => {
        // set collection address and check format
        const addr = bridgeConfig[chainId].collection.find((addr: `0x${string}`) => (addr.toLowerCase() == event.target.value.toLowerCase()))
        const colIndex = bridgeConfig[chainId].collection.indexOf(addr);
        if (addr != undefined){
            setColIndex(colIndex);
            setColAddr(addr);
            setMsg(true);
        } else {
            setColIndex(undefined);
            setColAddr(undefined);
            setMsg('This collection is not approved');
        }
    }

    const handleBridge = async () => {
        // start bridge
        let step = 0;
        setLoading(true);
        if (!accountCheck()) {setMsg("Please reconnect wallet."); return;}
        try {
            // check the token
            if (tokenId == undefined || collectionAddr == undefined || collectionIndex == undefined) {
                setMsg("Please input TokenID & Collection.");
                setLoading(false);
                return;
            }

            if (targetChain == null){
                setMsg("Please choose one target blockchain.");
                setLoading(false);
                return;
            } else if (targetChain == chainId) {
                setMsg("You can not bridge to the same blockchain!");
                setLoading(false);
                return;
            }

            const to = bridgeConfig[targetChain];
            const from = bridgeConfig[chainId];

            const ownerAddr = await readContract(rainbowConfig, {
                abi: from.abi.collection[collectionIndex],
                address: collectionAddr,
                functionName: 'ownerOf',
                args: [
                    tokenId
                ],
            });

            if (ownerAddr != address){
                setMsg("TokenID is incorrect.");
                setLoading(false);
                return;
            }

            step = 1;

            const uri = await readContract(rainbowConfig, {
                abi: from.abi.collection[collectionIndex],
                address: collectionAddr,
                functionName: 'tokenURI',
                args: [
                    BigInt(tokenId)
                ]
            })

            if (typeof uri !== "string") {
                setMsg("Toke Uri is invalid.");
                setLoading(false);
                return;
            }

            step = 2;

            // Estimate gasfee
            const estimate_price = await bridge_estimator(tokenId, uri, address, from.axlar, to.axlar, Environment.TESTNET);
            if (typeof estimate_price !== 'string') {
                console.log("estimate is : %s", estimate_price)
                setMsg("Estimate gas failed.");
                setLoading(false);
                return;
            }

            step = 3;

            // Set approve
            const approve_res = await simulateContract(rainbowConfig, {
                abi: from.abi.collection[collectionIndex],
                address: collectionAddr,
                functionName: 'approve',
                args: [
                  from.bridge,
                  tokenId
                ]
              })
            
            const approve_hash = await writeContract(rainbowConfig, approve_res.request);
            await waitForTransactionReceipt(rainbowConfig, {
            hash: approve_hash
            });

            step = 4;

            // Get the price
            const price = await get_price(tokenId, collectionAddr);
            if (price == -1) {
                setMsg("Oops! Something is wrong.");
                setLoading(false);
                return;
            }

            // Interact bridge contract
            const resp = await simulateContract(rainbowConfig, {
                abi: from.abi.bridge,
                address: from.bridge,
                functionName: 'sendNFT',
                args: [
                    to.name,
                    to.bridge,
                    tokenId,
                    price,
                ],
                value: BigInt(estimate_price)
              })
              console.log("bridge sendNFT: %s", resp.request);
              const hash = await writeContract(rainbowConfig, resp.request);
              const receipt = await waitForTransactionReceipt(rainbowConfig, {hash: hash});
              console.log("bridge receipt: %s", receipt)

              step = 5;

        } catch (error) {
            console.log(error);
            if (step == 0){
                setMsg("TokenID is incorrect.");
            } else if (step == 1) {
                setMsg("Toke Uri is invalid.");
            } else if (step == 2) {
                setMsg("Estimate gas failed.");
            } else if (step == 3) {
                setMsg("Token approved failed");
            } else if (step == 4) {
                setMsg("Bridge failed.");
            }
            setLoading(false);
            return;
        }
        setLoading(false);
    }

    const handleSwitchChain = (chain_id: number) => {
        // Switch blockchain
        if (chain_id == targetChain) {
            setMsg('You can not bridge to the same blockchain!');
            setTargetCheck(false);
            return;
        }
        setMsg(true);
        setTargetCheck(true);
        switchChain({chainId: chain_id})
        return;
    }

    const handleSwitchTarget = (chain_id: number) => {
        // switch target
        if (chain_id == chainId) {
            setMsg('You can not bridge to the same blockchain!');
            setTargetCheck(false);
            return;
        }
        setMsg(true);
        setTargetCheck(true);
        setTarget(chain_id);
        return;
    }


    return (
        <div>
            <CardHeader className="my-5">
                <CardTitle className="text-4xl">BRIDGE NFTS</CardTitle>
                <CardDescription>Transfer NFT Collections.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex mt-10 justify-center items-center w-full h-full">
                    <Card className="bg-cyan-50 rounded-3xl w-120">
                        <CardContent>
                            <div className="grid grid-rows-1 grid-cols-2 w-full mb-5">
                                <Label className="font-bold text-xl w-1/2">From</Label>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="w-30 font-bold justify-self-end rounded-3xl">
                                            {chains.find((c) => c.id === chainId)?.name}
                                            <ChevronDown className="ml-1 w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-80 rounded-4xl gap-4">
                                        <DialogHeader className="mt-2 mb-2">
                                            <DialogTitle>
                                                <Label className="text-2xl font-bold text-gray-500 text-left mb-2">Select a blockchain</Label>
                                            </DialogTitle>
                                            <div className="w-70 border-b border-slate-400 mx-auto" />
                                        </DialogHeader>
                                        <div className="w-full grid-rows-1">
                                            {chains.map((chain) => (
                                                <React.Fragment>
                                                    { chain.id === chainId ? (
                                                        <Button className="w-full opacity-100 pointer-events-none justify-start text-left bg-indigo-600 font-bold rounded-xl text-lg mb-2">{chain.name}<SquareCheckBigIcon className="ml-35 w-6 h-6 text-green-300"/></Button>
                                                    ) :
                                                    (
                                                        <Button className="w-full justify-start text-left shadow-none bg-transparent text-black-500 hover:bg-slate-200 font-bold rounded-xl text-lg mb-2" onClick={() => handleSwitchChain(chain.id)}>{chain.name}</Button>
                                                    )
                                                    }
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Label className="text-base text-gray-500 text-left mb-3">Connect your wallet before transfering.</Label>
                            <div className="w-110 border-b border-slate-400 mx-auto" />
                        </CardContent>
                        <CardContent>
                            <Label className="font-bold text-xl text-left mb-3">Token ID & Collection</Label>
                            <div className="grid grid-rows-1 grid-cols-2 w-full mb-2">
                                <Input placeholder="tokenId" type="number" className="w-40 font-bold rounded-3xl bg-slate-200" onChange={handleTokenInput}/>
                                <Input placeholder="collection address" className="w-66 font-bold rounded-3xl bg-slate-200 justify-self-end" onChange={handleCollectionInput}/>
                            </div>
                            <div className="w-full flex justify-center items-center"><ArrowDown className="w-5 h-5 text-gray-500"/></div>
                            {bridgeMsg == true ? ( // Alert message
                                     <Card className="mt-3 mb-3 ml-1 mr-2 bg-lime-200">
                                        <CardContent className="flex justify-center items-center">
                                        <Check className="mr-3 text-green-500 w-6 h-6"/>Keep going.</CardContent>
                                    </Card>
                                ) : bridgeMsg == null ? ('') : 
                                (
                                    <Card className="mt-3 mb-3 ml-1 mr-2 bg-rose-200">
                                        <CardContent className="flex justify-center items-center">
                                        <CircleAlert className="mr-3 text-red-500 w-6 h-6"/>{bridgeMsg}</CardContent>
                                    </Card>
                                )
                            }
                            <div className="w-full flex justify-center items-center"><ArrowDown className="w-5 h-5 text-gray-500"/></div>
                            <div className="grid grid-rows-1 grid-cols-2 w-full mb-3">
                                <Label className="font-bold text-xl w-1/2">To</Label>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="w-30 font-bold justify-self-end rounded-3xl">
                                            <React.Fragment>
                                                {chains.find((c) => (c.id === targetChain))?.name || 'Network'}
                                            </React.Fragment>
                                            <ChevronDown className="ml-1 w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-80 rounded-4xl gap-4">
                                        <DialogHeader className="mt-2 mb-2">
                                            <DialogTitle>
                                                <Label className="text-2xl font-bold text-gray-500 text-left mb-2">Select a target</Label>
                                            </DialogTitle>
                                            <div className="w-70 border-b border-slate-400 mx-auto" />
                                        </DialogHeader>
                                        <div className="w-full grid-rows-1">
                                            {chains.map((chain) => (
                                                <React.Fragment>
                                                    { chain.id === targetChain ? (
                                                        <Button className="w-full opacity-100 pointer-events-none justify-start text-left bg-indigo-600 font-bold rounded-xl text-lg mb-2">{chain.name}<SquareCheckBigIcon className="ml-35 w-6 h-6 text-green-300"/></Button>
                                                    ) :
                                                    (
                                                        <Button className="w-full justify-start text-left shadow-none bg-transparent text-black-500 hover:bg-slate-200 font-bold rounded-xl text-lg mb-2" onClick={() => handleSwitchTarget(chain.id)}>{chain.name}</Button>
                                                    )
                                                    }
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="w-110 border-b border-slate-400 mx-auto" />
                        </CardContent>
                        <CardContent>
                            <div className="grid grid-rows-1 grid-cols-2 w-full">
                                <Label className="font-bold text-base pb-3">Recipient</Label>
                                <Label className="font-bold text-base justify-self-end pb-3">{truncateAddress(address)}</Label>
                            </div>
                            <div className="flex justify-center items-center w-full">   
                                <Button className="w-full h-12 rounded-xl font-bold" onClick={handleBridge} disabled={loading || !targetCheck || (collectionAddr == undefined) || (tokenId == undefined)}>
                                    {loading ? (<Loader2 className="animate-spin" />) : ''}
                                    {loading ? 'Trasnferring...' : 'Enter Collection & Token ID'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </div>
    );
}