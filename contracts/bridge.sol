// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";


interface ISMLMarket{
    function adapterSend(address nft, uint256 tokenId) external;
    function adapterRecv(address nft, uint256 tokenId, uint256 price, address recipient, string memory tokenUri) external;
}

interface IERCSML721 is IERC721{
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function burn(uint256 tokenId) external;
    function bridge_mint(address recipient, uint256 tokenId, string memory tokenUri) external;
}

contract SMLBridge is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    IAxelarGateway public gateway;
    IAxelarGasService public gasService;
    ISMLMarket marketplace;
    address public nftContract;

    error NotApprovedByGateway();
    event MarketCallSendFailed(uint256 tokenId);
    event MarketCallRecvFailed(uint256 tokenId);
    event SMLMintFailed(uint256 tokenId);

    function init(address initialOwner, address _gateway, address _gasService, address _nftContract, address _marketplace) public initializer{
        __UUPSUpgradeable_init();
        __Ownable_init(initialOwner);
        gateway = IAxelarGateway(_gateway);
        gasService = IAxelarGasService(_gasService);
        marketplace = ISMLMarket(_marketplace);
        nftContract = _nftContract;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner{

    }

    function sendNFT(
        string calldata destinationChain,
        string calldata destinationAddress,
        uint256 tokenId,
        uint256 price
    ) external virtual payable {
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

    // This function is called by Gateway
    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external virtual {
        bytes32 payloadHash = keccak256(payload);
        bool tag = gateway.validateContractCall(commandId, sourceChain, sourceAddress, payloadHash);
        if (!tag){
            revert NotApprovedByGateway();
        }
        _execute(sourceChain, sourceAddress, payload);
    }

    // Execute logic
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual {
        (address recipient, uint256 tokenId, uint256 price, string memory uri) = abi.decode(payload, (address, uint256, uint256, string));
        // Call market receive function
        marketplace.adapterRecv(nftContract, tokenId, price, recipient, uri);
    }
}
