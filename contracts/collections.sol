pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract SmilyCollection is ERC721URIStorage, Ownable {
    uint256 public currentTokenId;

    constructor(address initialOwner)
        ERC721("SmilyCollection", "SML")
        Ownable(initialOwner)
    {
        console.log("initialOwner", initialOwner);
    }

    function mint(string memory tokenURI_) external {
        console.log("tokenURI_", tokenURI_);
        uint256 newTokenId = ++currentTokenId;
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI_);
    }
}
