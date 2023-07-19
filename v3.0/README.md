# v3.0 NFT Dutch Auction with ERC20 Token Bids

Smart contract for conducting an NFT Dutch Auction with bidding in ERC20 tokens.

## Introduction

NFTDutchAuction_ERC20Bids.sol allows a seller to auction a single NFT using the Dutch Auction mechanism but accepts bids in an ERC20 token (TUSD). In a Dutch Auction, the price of the item starts high and decreases over time until a bidder accepts the current price. The NFT is transferred to the winning bidder, and the winning bid amount in TUSD tokens is transferred to the seller once the auction is finalized.

TUSDFaucet.sol is an ERC20 token contract that represents a Test USD token (TUSD) which can be minted for the auction payment.

NFTMinter.sol is for minting NFTs (Non-Fungible Tokens) based on the ERC721 standard. It utilizes the OpenZeppelin library's ERC721PresetMinterPauserAutoId preset which provides built-in functionalities for minting, pausing, and automatically assigning token IDs. Initializes the NFTMinter with a name, symbol, and base token URI.

NFTDutchAuction_ERC20Bids.sol requires the seller to approve the auction contract to transfer the NFT on their behalf. It also requires bidders to approve the auction contract to transfer TUSD tokens on their behalf as bids.

## Key Features

- The auction is conducted for a single NFT, identified by its contract address and token ID.
- The auction starts at a high price and decreases with each block.
- Bidders can place bids in TUSD tokens; the first bid that meets or exceeds the current price wins.
- The price in TUSD at the time of the successful bid is transferred to the seller.
- The NFT is transferred to the winning bidder.
- Requires approval for transferring TUSD tokens and NFT.

## Smart Contract Parameters

- `reservePrice`: Minimum acceptable price in TUSD tokens.
- `numBlocksAuctionOpen`: Duration of auction in blocks.
- `offerPriceDecrement`: Decrease in price per block in TUSD tokens.
- `erc721TokenAddress`: The contract address of the ERC-721 token (NFT) being auctioned.
- `nftTokenId`: The token ID of the NFT being auctioned.
- `erc20TokenAddress`: The contract address of the ERC20 token (TUSD) used for bids.

## NFTDutchAuction_ERC20Bids Contract Methods

### NFTDutchAuction_ERC20Bids

#### constructor()
Initializes the auction with parameters.

#### bid(uint bidAmount)
Place a bid; must be greater than or equal to the current price. Bidders must approve the contract to spend TUSD tokens on their behalf before bidding.

```solidity
function bid(uint bidAmount) public payable isOpenning returns (address)
```
### currentPrice()
Returns the current price of the NFT based on the elapsed blocks since the start of the auction.

```solidity
function currentPrice() public view returns (uint256)
```
### finalize(uint256 finalAuctionPrice) internal

Finalizes the auction by transferring the final auction price in TUSD to the seller, marking the auction as ended, and transferring the NFT to the winning bidder. This function is called internally once a winning bid is found.

```solidity
function finalize(uint256 finalAuctionPrice) internal
```

## TUSDFaucet Contract method

### mint(address to, uint256 amount)

Mint TUSD tokens to the specified address.

```solidity
function mint(address to, uint256 amount) public
```

## License
This project is licensed under the terms of the MIT License. See LICENSE file for details.