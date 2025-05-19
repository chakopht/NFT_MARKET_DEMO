// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ONFT721Adapter } from "@layerzerolabs/onft-evm/contracts/onft721/ONFT721Adapter.sol";

// @dev ONFT721Adapter is an adapter contract used to enable cross-chain transferring of an existing ERC721 token.
abstract contract SmlAdapter is ONFT721Adapter {
    IERC721 internal immutable innerToken;

    
}