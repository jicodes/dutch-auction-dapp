// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract NFTDutchAuction {
    address payable public seller;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public initialPrice;
    uint256 public startBlock;
    bool public auctionEnded;
    address public winner;

    constructor(
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        seller = payable(msg.sender);
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        initialPrice =
            reservePrice +
            numBlocksAuctionOpen *
            offerPriceDecrement;
        startBlock = block.number;
        auctionEnded = false;
    }

    function bid() public payable returns (address) {
        
        require(
            block.number <= startBlock + numBlocksAuctionOpen,
            "Auction is already ended"
        );
        require(!auctionEnded, "Auction is already ended");
        require(
            msg.value >= currentPrice(),
            "Bid must be higher than current price"
        );

        auctionEnded = true;
        seller.transfer(msg.value); // Transfer the funds to the owner immediately
        winner = msg.sender;

        return winner;
    }


    function currentPrice() public view returns (uint256) {
        uint256 elapsedBlocks = block.number - startBlock;
        if (elapsedBlocks > numBlocksAuctionOpen) {
            return reservePrice;
        }
        return initialPrice - elapsedBlocks * offerPriceDecrement;
    }
}
