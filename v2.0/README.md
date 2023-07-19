# v2.0 NFT Dutch Auction

Smart contract for conducting an NFT Dutch Auction with bidding in ETH.

## Introduction

NFTDutchAuction.sol allows a seller to auction a single NFT using the Dutch Auction mechanism. In a Dutch Auction, the price of the item starts high and decreases over time until a bidder accepts the current price. The NFT is transferred to the winning bidder once the auction is finalized.

NFTMinter.sol is for minting NFTs (Non-Fungible Tokens) based on the ERC721 standard. It utilizes the OpenZeppelin library's ERC721PresetMinterPauserAutoId preset which provides built-in functionalities for minting, pausing, and automatically assigning token IDs. Initializes the NFTMinter with a name, symbol, and base token URI.

Before starting the auction, the seller should approve the auction contract to transfer the NFT on their behalf.

## Key Features

- The auction is conducted for a single NFT, identified by its contract address and token ID.
- The auction starts at a high price and decreases with each block.
Bidders can place bids; the first bid that meets or exceeds the current price wins.
- The price in ETH at the time of the successful bid is transferred to the seller.
- Non-winning bids are instantly refunded(rejected by reverting).
- The NFT is transferred to the winning bidder.

## Smart Contract Parameters

- `reservePrice`: Minimum acceptable price in wei.
- `numBlocksAuctionOpen`: Duration of auction in blocks.
- `offerPriceDecrement`: Decrease in price per block in wei.
- `erc721TokenAddress`: The contract address of the ERC-721 token (NFT) being auctioned.
- `nftTokenId`: The token ID of the NFT being auctioned.


## Contract Methods

### constructor()
Initializes the auction with parameters.

### bid()

Place a bid; must be greater than or equal to the current price.

```solidity
function bid() public payable returns (address)
```
### currentPrice()
Returns the current price of the NFT based on the elapsed blocks since the start of the auction.

```solidity
function currentPrice() public view returns (uint256)
```
### finalize(uint256 finalAuctionPrice) internal

Finalizes the auction by transferring the final auction price to the seller, marking auction as ended, and transferring the NFT to the winning bidder. This function is called internally once a winning bid is found.

```solidity
function finalize(uint256 finalAuctionPrice) internal
```

## License
This project is licensed under the terms of the MIT License. See LICENSE file for details.