pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";



contract Marketplace is ReentrancyGuardUpgradeable, UUPSUpgradeable, OwnableUpgradeable {
    struct Pack {
        address seller;
        uint256 price;
        uint256 tokenId;
        address nft;
    }

    // nft address => tokenId => Pack
    mapping(address=>mapping(uint256=>Pack)) public nfts;
    

    event Packed(address indexed nft, uint256 indexed tokenId, address seller, uint256 price, uint256 flag);
    event Purchased(address indexed nft, uint256 indexed tokenId, address buyer, uint256 price);
    event Unpacked(address indexed nft, uint256 indexed tokenId);

    function init(address initialOwner) public initializer{
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Ownable_init(initialOwner);
        
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner{

    }

    function takePack(address nft, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be > 0");

        IERC721 token = IERC721(nft);
        require(token.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(token.getApproved(tokenId) == address(this), "Marketplace not approved");
        
        // add to assets
        nfts[nft][tokenId] = Pack(msg.sender, price, tokenId, nft);

        // take event
        emit Packed(nft, tokenId, msg.sender, price, 0);
    }

    function unPack(address nft, uint256 tokenId) external {
        Pack memory item = nfts[nft][tokenId];
        require(item.seller == msg.sender, "Only seller can cancel");

        delete nfts[nft][tokenId];
        emit Unpacked(nft, tokenId);
    }

    function buyNFT(address nft, uint256 tokenId) external payable nonReentrant {
        Pack memory item = nfts[nft][tokenId];
        require(item.price > 0, "Item not listed");
        require(msg.value == item.price, "Incorrect price");

        payable(item.seller).transfer(msg.value);

        IERC721(nft).safeTransferFrom(item.seller, msg.sender, tokenId);
        nfts[nft][tokenId].seller = msg.sender;
        emit Purchased(nft, tokenId, msg.sender, item.price);
    }
}
