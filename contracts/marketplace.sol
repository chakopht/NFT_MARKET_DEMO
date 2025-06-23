pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import "hardhat/console.sol";



contract Marketplace is ReentrancyGuardUpgradeable, UUPSUpgradeable, OwnableUpgradeable {

    // nft address => tokenId => Pack
    mapping(address=>mapping(uint256=>uint256)) internal nfts_price;
    

    event Packed(address indexed nft, uint256 indexed tokenId, address seller, uint256 price, uint256 flag);
    event Purchased(address indexed nft, uint256 indexed tokenId, address buyer, uint256 price, uint256 flag);
    event Unpacked(address indexed nft, uint256 indexed tokenId);
    event SetFlag(address indexed nft, uint256 indexed tokenId,  uint256 flag);
    event Lock(address indexed nft, uint256 indexed tokenId, uint256 lock, uint256 price, address seller);

    function init(address initialOwner) public initializer{
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Ownable_init(initialOwner);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner{

    }

    modifier onlySMLOwner(address nft, uint256 tokenId) {
        IERC721 token = IERC721(nft);
        require(token.ownerOf(tokenId) == msg.sender, "Not the owner");
        _;
    }

    function _pack(address nft, uint256 tokenId, uint256 price, address recpient) internal {
        nfts_price[nft][tokenId] = price;
        // take event
        emit Packed(nft, tokenId, recpient, price, 0);
    }

    function takePack(address nft, uint256 tokenId, uint256 price) external onlySMLOwner(nft, tokenId) {
        require(price > 0, "Price must be > 0");
        _pack(nft, tokenId, price, msg.sender);
    }

    function unPack(address nft, uint256 tokenId) external onlySMLOwner(nft, tokenId) {
        emit Unpacked(nft, tokenId);
    }

    function buyNFT(address nft, uint256 tokenId) external payable nonReentrant {
        // take a transfer
        IERC721 token = IERC721(nft);

        require(token.getApproved(tokenId) == address(this), "Marketplace not approved");
        require(nfts_price[nft][tokenId] > 0, "Item not listed");
        require(msg.value == nfts_price[nft][tokenId], "Incorrect price");

        payable(token.ownerOf(tokenId)).transfer(msg.value);

        token.safeTransferFrom(token.ownerOf(tokenId), msg.sender, tokenId);
        emit Purchased(nft, tokenId, msg.sender, nfts_price[nft][tokenId], 0);
    }

    function setPrice(address nft, uint256 tokenId, uint256 price) external onlySMLOwner(nft, tokenId) {
        // set the nft price
        nfts_price[nft][tokenId] = price;
        emit Purchased(nft, tokenId, msg.sender, price, 2);
    }

    function setFlag(address nft, uint256 tokenId, uint256 flag) external onlySMLOwner(nft, tokenId) {
        // set the flag to make nft is able to sell
        require(flag == 0 || flag == 1, "flag needs 1 or 0");
        emit SetFlag(nft, tokenId, flag);
    }

    function adapterSend(address nft, uint256 tokenId) external{
        console.log("adapterSend nft: %s tokenId: %d", nft, tokenId);
        IERC721 token = IERC721(nft);
        address recpient = token.ownerOf(tokenId);
        emit Lock(nft, tokenId, 1, nfts_price[nft][tokenId], recpient);
    }

    function adapterRecv(address nft, uint256 tokenId, uint256 price) external{
        console.log("adapterRecv nft: %s tokenId: %d price: %d ", nft, tokenId, price);
        IERC721 token = IERC721(nft);
        address recpient = token.ownerOf(tokenId);
        if (nfts_price[nft][tokenId] > 0){
            // release lock if token is exist
            console.log("market: %s is exist Lock event", tokenId);
            nfts_price[nft][tokenId] = price;
            emit Lock(nft, tokenId, 0, price, recpient);
        } else {
            // Take a pack if token is new
            console.log("market: %s is new one _pack", tokenId);
            _pack(nft, tokenId, price, recpient);
        }
    }
}
