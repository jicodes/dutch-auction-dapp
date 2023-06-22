// contracts/MyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract NFTMinter is ERC721PresetMinterPauserAutoId {
    constructor() ERC721PresetMinterPauserAutoId("the NFT for Dutch Auction", "aNFT", "https://ipfs.io/ipfs/QmdYeDpkVZedk1mkGodjNmF35UNxwafhFLVvsHrWgJoz6A/beanz_metadata/16858") {
    }
}