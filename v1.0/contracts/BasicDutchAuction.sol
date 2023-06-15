// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract BasicDutchAuction {
    address payable public seller;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public initialPrice;
    uint256 public startBlock;
    bool public auctionEnded;
    address public winner;

    mapping(address => uint256) public bids;
    address[] public bidders;

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

        // Register the bid
        bids[msg.sender] = msg.value;
        bidders.push(msg.sender);

        // Transfer the funds to the seller and end the auction
        seller.transfer(msg.value);
        auctionEnded = true;

        // Assign the winner and return the winner's address
        winner = msg.sender;

        // Refund the unsuccessful bids
        for (uint256 i = 0; i < bidders.length; i++) {
            if (bidders[i] != winner) {
                refund(bidders[i]);
            }
        }

        return winner;
    }

    function refund(address bidder) private {
        uint256 amount = bids[bidder];
        if (amount > 0) {
            // Reset the bid amount for this bidder to 0
            bids[bidder] = 0;

            // Refund their money
            payable(bidder).transfer(amount);
        }
    }

    function currentPrice() public view returns (uint256) {
        uint256 elapsedBlocks = block.number - startBlock;
        if (elapsedBlocks > numBlocksAuctionOpen) {
            return reservePrice;
        }
        return initialPrice - elapsedBlocks * offerPriceDecrement;
    }
}
