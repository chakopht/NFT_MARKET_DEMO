"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function Home() {
  
  return (
    <div>
        <CardHeader className="my-5">
            <CardTitle className="text-4xl">BRIDGE NFTS</CardTitle>
            <CardDescription>Transfer NFT Collections.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex mt-15 justify-center item-center w-full h-full">
                <Card className="bg-cyan-50 w-100">

                </Card>
            </div>
        </CardContent>
    </div>
);
}