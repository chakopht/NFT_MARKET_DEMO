// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "hardhat/console.sol";


interface ISMLMarket{
    function adapterSend(address nft, uint256 tokenId) external;
    function adapterRecv(address nft, uint256 tokenId, uint256 price) external;
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
    ) external payable {
        // Transfer NFT to this contract
        IERCSML721 token = IERCSML721(nftContract);
        require(token.getApproved(tokenId) == address(this), "SMLBridge not approved");

        //Get uri
        string memory uri = token.tokenURI(tokenId);
        
        // Burn this chain nft
        token.burn(tokenId);

        // Prepare payload
        bytes memory payload = abi.encode(msg.sender, tokenId, price, uri);

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

        // Call marketplace function
        try marketplace.adapterSend(nftContract, tokenId) {} 
        catch {
            emit MarketCallSendFailed(tokenId);
        }
     
    }

    // This function is called by Gateway
    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external {
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
    ) internal {
        (address recipient, uint256 tokenId, uint256 price, string memory uri) = abi.decode(payload, (address, uint256, uint256, string));
        // Mint the NFT to the recipient
        IERCSML721(nftContract).bridge_mint(recipient, tokenId, uri);
        // Call market receive function
        try marketplace.adapterRecv(nftContract, tokenId, price) {} 
        catch  {
            console.log("adapterRecv error");
            emit MarketCallRecvFailed(tokenId);
        }
    }
}
