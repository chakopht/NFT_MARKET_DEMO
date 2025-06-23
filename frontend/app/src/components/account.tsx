"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAccount } from "wagmi";


export default function AccountStatus() {
    // jump to home page if disconnected
    const { address, isConnected } = useAccount();
    const [ curr_address, setAddress ] = useState<`0x${string}`|undefined>(undefined);
    const router = useRouter();
    useEffect(() => {
        if (address != curr_address || !isConnected){
            // change route when address is changed or disconnected
            setAddress(address)
            router.push(`/`);
        }
    });
    return (
        <div></div>
    )
}
  