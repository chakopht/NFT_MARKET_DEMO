import { encodeAbiParameters } from "viem";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";


export const bridge_estimator = async (tokenId: bigint, uri: string, account: `0x${string}` | undefined, from: string, to: string, env: Environment) => {
    // gas estimate for gateway callContract func
    if (account == undefined) return;
    const payload = encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'uint256' },
        { type: 'string' },
      ],
      [account, tokenId, uri]
    )
    const axeApi = new AxelarQueryAPI({environment: env});
    const response = await axeApi.estimateGasFee(
      from,
      to,
      700000, // gas limit
      1.1,
      undefined,
      undefined,
      payload
    )
    return response;
}