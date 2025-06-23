type AbiObj = {
    collection: any[],
    bridge: any,
    marketplace: any
}

export type SubRecord = {
    name: string,
    axlar: string,
    bridge: `0x${string}`,
    collection: `0x${string}`[],
    market: `0x${string}`,
    abi: AbiObj,
    graph: string
}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}