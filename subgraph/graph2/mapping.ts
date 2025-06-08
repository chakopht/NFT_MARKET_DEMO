import { Packed, Purchased, Unpacked, Lock, SetFlag} from './generated/MarketPlaceContract/MarketPlace'
import { Pack } from "./generated/schema";
import { BigInt, log } from '@graphprotocol/graph-ts';

export function handlePacked(event: Packed): void {
    let uid = event.params.nft.toHexString() + "-" + event.params.tokenId.toString();
    let pack = new Pack(uid);
    pack.tokenId = event.params.tokenId.toString();
    pack.seller = event.params.seller;
    pack.price = event.params.price;
    pack.nft = event.params.nft;
    pack.flag = event.params.flag;
    pack.status = BigInt.fromI32(1);
    pack.lock = BigInt.fromI32(0);
    pack.save();
  
    log.info('Packed event received: {}', [event.params.tokenId.toString()]);
  }
  
export function handlePurchased(event: Purchased): void {
    let uid = event.params.nft.toHexString() + "-" + event.params.tokenId.toString();
    let pack = Pack.load(uid);
    if (pack != null) {
        pack.seller = event.params.buyer;
        pack.price = event.params.price;
        pack.save();

        log.info('Purchased event received for pack: {}', [uid]);
    }
}

export function handleUnpacked(event: Unpacked): void {
    let uid = event.params.nft.toHexString() + "-" + event.params.tokenId.toString();
    let pack = Pack.load(uid);
    if (pack != null) {
        pack.status = BigInt.fromI32(0);
        pack.save();

        log.info('Purchased event received for pack: {}', [uid]);
    }
}

export function handleLock(event: Lock): void {
    let uid = event.params.nft.toHexString() + "-" + event.params.tokenId.toString();
    let pack = Pack.load(uid);
    if (pack != null) {
        pack.lock = event.params.lock;
        pack.save();

        log.info('Lock event received for pack: {}', [uid]);
    }
}

export function handleSetFlag(event: SetFlag): void {
    let uid = event.params.nft.toHexString() + "-" + event.params.tokenId.toString();
    let pack = Pack.load(uid);
    if (pack != null) {
        pack.flag = event.params.flag;
        pack.save();

        log.info('Flag event received for pack: {}', [uid]);
    }
}