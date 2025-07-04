'use client';

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react";
import { useState, ChangeEvent } from 'react';
import axios from 'axios';
import { writeContract, getAccount, simulateContract, waitForTransactionReceipt } from '@wagmi/core'

import { bridgeConfig, rainbowConfig, mintChainId } from "@/components/config";
import { Log, parseEventLogs, parseUnits } from "viem";
import { useChainId } from "wagmi";

type EventArgs = {
  _tokenId: bigint
}


export default function MintAction () {
  // State variables for handling file, IPFS hash, and loading state
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [priceErr, setPriceErr] = useState<string | null>(null);
  const [cid, setIpfsCid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mintLoading, setMintLoading] = useState<boolean>(false);
  const chainId = useChainId();

  // Handle file input change event
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Check file is valid
    const selectedFile = event.target.files?.[0];
    const validTypes = ['image/png', 'image/jpeg']
    if (selectedFile) {
      if (validTypes.includes(selectedFile.type)){
        setFileErr(null);
        setFile(selectedFile);
      }else{
        setFileErr('only support png, jpeg');
        setFile(null);
      }
    }
  };

  // Handle price input change event
  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
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

  // Handle upload logic
  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('network', "public")

    try {
      const response = await axios.post(
        "https://uploads.pinata.cloud/v3/files",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
          },
        }
      );

      setIpfsCid(response.data.data.cid); // Save the IPFS hash
    } catch (error) {
      console.error('Error uploading to Pinata', error);
    } finally {
      setLoading(false);
    }
  };

  // handle Mint
  const handleMint = async () => {
    setMintLoading(true);
    const account = getAccount(rainbowConfig);
    if (account.isConnected && cid && price) {
      try {
          // mint
          // Only work for one blockchain. Others only support bridge
          if (chainId != mintChainId) {throw Error("Blockchain doesn't support mint!");}
          const collectionsAddress = bridgeConfig[chainId].collection[0];
          const collectionABI = bridgeConfig[chainId].abi.collection[0];
          const marketplaceAddress = bridgeConfig[chainId].market;
          const marketplaceABI = bridgeConfig[chainId].abi.marketplace;
          
          const mint_res = await simulateContract(rainbowConfig, {
            abi: collectionABI,
            address: collectionsAddress,
            functionName: 'mint',
            args: [
              `https://${process.env.NEXT_PUBLIC_PINATA_GW}/ipfs/${cid}`
            ],
            connector: account.connector
          });

          const mint_hash = await writeContract(rainbowConfig, mint_res.request);

          // get mint tokenid
          const mint_receipt = await waitForTransactionReceipt(rainbowConfig, {
            hash: mint_hash
          });
          
          const eventLogs = parseEventLogs({
            abi: collectionABI,
            logs: mint_receipt.logs
          });
          const eventLog = eventLogs[1] as Log & { args:EventArgs };
          const tokenId = eventLog.args._tokenId;

          // take a pack
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
          await waitForTransactionReceipt(rainbowConfig, {
            hash: approve_hash
          });

          const parse_price = parseUnits(price, 18);
    
          const pack_res = await simulateContract(rainbowConfig, {
            abi: marketplaceABI,
            address: marketplaceAddress,
            functionName: 'takePack',
            args: [
              collectionsAddress,
              tokenId,
              parse_price
            ],
            connector: account.connector
          })
        const pack_hash = await writeContract(rainbowConfig, pack_res.request);
        const pack_receipt = await waitForTransactionReceipt(rainbowConfig, {
          hash: pack_hash
        });
        
        const packLogs = parseEventLogs({
          abi: marketplaceABI,
          logs: pack_receipt.logs
        })

        console.log(packLogs)
      } catch (error) {
        console.log('Mint Failure :', error)
      }
    } else {
      if (!account.isConnected){
        setPriceErr("account is not valid!");
      }
      else if(!cid){
        setPriceErr("upload image please!");
      }
      else if(!price){
        setPriceErr("set valid price please!")
      }
    }
    setMintLoading(false);
  };

  return (
    <div>
      <CardHeader className="my-5">
        <CardTitle className="text-4xl">MINT A NEW ONE !</CardTitle>
        <CardDescription>Create your own NFT.</CardDescription>
      </CardHeader>
      <CardContent>
      <Label htmlFor="upload" className="text-lg font-bold mb-2.5">Upload Image:</Label>
      <div className="flex-1 flex flex-row mb-5">
        <Input id="upload" type="file" placeholder="Choose Your File" className="mr-5 w-100" accept="image/*" onChange={handleFileChange} />
        <Button className="bg-gray-500 mr-2.5  font-bold" onClick={handleUpload} disabled={loading}>
          {loading ? (<Loader2 className="animate-spin" />) : ''}
          {loading ? 'Uploading...' : 'Upload'}
        </Button>
        <div className="flex flex-row">
          {
            cid ? (
                <Button
                  onClick={() => window.open(`https://${process.env.NEXT_PUBLIC_PINATA_GW}/ipfs/${cid}`)}
                  className="bg-teal-400 mr-5  font-bold"
                > Preview </Button>
            ) : ''
          }
          {
            fileErr ? (<Label className="text-red-400">{fileErr}</Label>) : cid ? (<Label className="text-teal-400">Done!</Label>) : ''
          }
        </div>
      </div>

      <Label htmlFor="price" className="text-lg font-bold mb-2.5">Set Price:</Label>
      <div className="flex flex-row mb-5">
        <Input id="price" type="string" placeholder="0.01" className="mr-5 w-100" onChange={handlePriceChange} />
        <Label className="font-bold mr-5">ETH</Label>
        <div className="flex flex-row">
          {
            priceErr ? (<Label className="text-red-400">{priceErr}</Label>) : price ? (<Label className="text-teal-400">Done!</Label>) : ''
          }
        </div>
      </div>
      <Button className=" mr-2.5 font-bold" onClick={handleMint} disabled={mintLoading || (chainId != mintChainId)}>
        {mintLoading ? (<Loader2 className="animate-spin" />) : ''}
        {(chainId == mintChainId) ? (mintLoading ? 'Minting...' : 'Mint !') : `Only for ${bridgeConfig[mintChainId].name}`}
      </Button>
      </CardContent>
    </div>
  );
};

