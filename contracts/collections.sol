pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


contract SmilyCollection is Initializable, UUPSUpgradeable, ERC721URIStorageUpgradeable, OwnableUpgradeable {
    uint256 public currentTokenId;
    address internal market;

    function init(address initialOwner) public initializer{
        __UUPSUpgradeable_init();
        __ERC721_init("SmilyCollection", "SML");
        __Ownable_init(initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner{

    }

    function _exist(uint256 tokenId) internal view returns (bool) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)){
            return false;
        }
        return true;
    }

    function setAddr(address _market) external onlyOwner {
        // only owner can set market address
        market = _market;
    }

    function burn(uint256 tokenId) external {
        // Burn this tokenId
        require(msg.sender == market, "this is only work for market");
        _burn(tokenId);
    }

    function _mint_uri(address recipient, uint256 tokenId, string memory tokenUri) internal {
        // Mint and set uri
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenUri);
    }

    function mint(string memory tokenUri) external {
        uint256 newTokenId = ++currentTokenId;
        while (_exist(newTokenId) == true){
            newTokenId = ++currentTokenId;
        }
        _mint_uri(msg.sender, newTokenId, tokenUri);
    }

    function bridge_mint(address recipient, uint256 tokenId, string memory tokenUri) external {
        // Mint by bridge adapter
        require(msg.sender == market, "this is only work for market");
        _mint_uri(recipient, tokenId, tokenUri);
    }
}
