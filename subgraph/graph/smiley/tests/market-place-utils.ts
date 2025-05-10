import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Packed,
  Purchased,
  Unpacked
} from "../generated/MarketPlace/MarketPlace"

export function createPackedEvent(
  nft: Address,
  tokenId: BigInt,
  seller: Address,
  price: BigInt,
  flag: BigInt
): Packed {
  let packedEvent = changetype<Packed>(newMockEvent())

  packedEvent.parameters = new Array()

  packedEvent.parameters.push(
    new ethereum.EventParam("nft", ethereum.Value.fromAddress(nft))
  )
  packedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  packedEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  packedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  packedEvent.parameters.push(
    new ethereum.EventParam("flag", ethereum.Value.fromUnsignedBigInt(flag))
  )

  return packedEvent
}

export function createPurchasedEvent(
  nft: Address,
  tokenId: BigInt,
  buyer: Address,
  price: BigInt
): Purchased {
  let purchasedEvent = changetype<Purchased>(newMockEvent())

  purchasedEvent.parameters = new Array()

  purchasedEvent.parameters.push(
    new ethereum.EventParam("nft", ethereum.Value.fromAddress(nft))
  )
  purchasedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  purchasedEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  purchasedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return purchasedEvent
}

export function createUnpackedEvent(nft: Address, tokenId: BigInt): Unpacked {
  let unpackedEvent = changetype<Unpacked>(newMockEvent())

  unpackedEvent.parameters = new Array()

  unpackedEvent.parameters.push(
    new ethereum.EventParam("nft", ethereum.Value.fromAddress(nft))
  )
  unpackedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return unpackedEvent
}
