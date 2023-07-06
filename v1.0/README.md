# Basic Dutch Auction Dapp

A simple Ethereum smart contract for conducting a Dutch Auction.

## Introduction

BasicDutchAuction.sol is a smart contract that allows a seller to auction a single physical item. The auction employs the Dutch Auction mechanism, where the item's price starts high and decreases over time until a bidder accepts the current price.

## Key Features

- The auction starts at a high price and decreases with each block.
- Bidders can place bids; the first bid that meets or exceeds the current price wins.
- The price in ETH at the time of the successful bid is transferred to the seller.
- Non-winning bids are instantly refunded(rejected by reverting).

## Smart Contract Parameters

- `reservePrice`: Minimum acceptable price in wei.
- `numBlocksAuctionOpen`: Duration of auction in blocks.
- `offerPriceDecrement`: Decrease in price per block in wei.

## Contract Methods

### bid()

Place a bid; must be greater than or equal to the current price.

```solidity
function bid() public payable returns (address)
```
### currentPrice()
Get the current price of the item.

```solidity
function currentPrice() public view returns (uint256)
```
### finalize(uint256 finalAuctionPrice) internal

Finalizes the auction by transferring the final auction price to the seller and marking auction as ended. This function is called internally once a winning bid is found.

```solidity
function finalize(uint256 finalAuctionPrice) internal
```

## License

This project is licensed under the terms of the MIT License. See LICENSE file for details.