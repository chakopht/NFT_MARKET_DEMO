// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./bridge.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";


contract SMLBridgeV2 is SMLBridge {

    function sendNFT_v2(
        string calldata destinationChain,
        string calldata destinationAddress,
        uint256 tokenId,
        uint256 price
    ) external payable {
        // Transfer NFT to this contract
        IERCSML721 token = IERCSML721(nftContract);
        require(token.getApproved(tokenId) == address(this), "SMLBridge not approved");

        //Get uri
        string memory uri = token.tokenURI(tokenId);

        // Prepare payload
        bytes memory payload = abi.encode(msg.sender, tokenId, price, uri);

        // Call marketplace function
        try marketplace.adapterSend(nftContract, tokenId) {
            // Pay gas fee for target chain action
            gasService.payNativeGasForContractCall{value: msg.value}(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );

            // Send cross-chain message
            gateway.callContract(destinationChain, destinationAddress, payload);
        } 
        catch Error(string memory reason) {
            revert(reason);
            // require / revert with a string
        } catch Panic(uint code) {
            // assert() failures, overflows, div by zero, etc.
            revert(Strings.toString(code));
        } catch (bytes memory data) {
            // catch-all for everything else (including unknown/custom errors)
            emit MarketCallSendFailed(tokenId);
            revert(string.concat("adapterSend error: ", Strings.toHexString(nftContract), " ", Strings.toString(tokenId)));
        }

     
    }
}
