import { Packed, Purchased, Unpacked} from './generated/MarketPlaceContract/MarketPlace'
import { Pack } from "./generated/schema";
import { BigInt, log } from '@graphprotocol/graph-ts';

export function handlePacked(event: Packed): void {
    let tokenId = event.params.tokenId.toString();
    let pack = new Pack(tokenId);
    pack.seller = event.params.seller;
    pack.price = event.params.price;
    pack.nft = event.params.nft;
    pack.flag = event.params.flag;
    pack.status = BigInt.fromI32(1);
    pack.save();
  
    log.info('Packed event received: {}', [event.params.tokenId.toString()]);
  }
  
export function handlePurchased(event: Purchased): void {
    let pack = Pack.load(event.params.tokenId.toString());
    if (pack != null) {
        pack.nft = event.params.nft;
        pack.seller = event.params.buyer;
        pack.price = event.params.price;
        pack.save();

        log.info('Purchased event received for pack: {}', [event.params.tokenId.toString()]);
    }
}

export function handleUnpacked(event: Unpacked): void {
    let pack = Pack.load(event.params.tokenId.toString());
    if (pack != null) {
        pack.status = BigInt.fromI32(0);
        pack.save();

        log.info('Purchased event received for pack: {}', [event.params.tokenId.toString()]);
    }
}