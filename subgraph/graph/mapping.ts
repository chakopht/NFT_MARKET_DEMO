import { Packed, Purchased, Unpacked, Lock, SetFlag} from './generated/MarketPlaceContract/MarketPlace'
import { Pack } from "./generated/schema";
import { BigInt, log } from '@graphprotocol/graph-ts';

export function handlePacked(event: Packed): void {
    let uid = event.params.nft.toHexString() + "-" + event.params.tokenId.toString();
    log.info('Packed uid: {}', [uid]);
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
    log.info('Purchased uid: {}', [uid]);
    let pack = Pack.load(uid);
    if (pack != null) {
        pack.seller = event.params.buyer;
        pack.price = event.params.price;
        if (event.params.flag == BigInt.fromI32(1) || event.params.flag == BigInt.fromI32(0)){
            pack.flag = event.params.flag;
        }
        pack.save();

        log.info('Purchased event received for pack: {}', [uid]);
    }
}

export function handleUnpacked(event: Unpacked): void {
    let uid = event.params.nft.toHexString() + "-" + event.params.tokenId.toString();
    log.info('Unpacked uid: {}', [uid]);
    let pack = Pack.load(uid);
    if (pack != null) {
        pack.status = BigInt.fromI32(0);
        pack.save();

        log.info('Unpacked event received for pack: {}', [uid]);
    }
}

export function handleLock(event: Lock): void {
    let uid = event.params.nft.toHexString() + "-" + event.params.tokenId.toString();
    log.info('Lock uid: {}', [uid]);
    let pack = Pack.load(uid);
    if (pack != null) {
        pack.lock = event.params.lock;
        pack.price = event.params.price;
        pack.seller = event.params.seller;
        pack.save();
        log.info('Lock event received for pack: {}', [uid]);
    }
}

export function handleSetFlag(event: SetFlag): void {
    let uid = event.params.nft.toHexString() + "-" + event.params.tokenId.toString();
    log.info('Flag event uid: {}', [uid]);
    let pack = Pack.load(uid);
    if (pack != null) {
        pack.flag = event.params.flag;
        pack.save();

        log.info('Flag event received for pack: {}', [uid]);
    }
}