// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTDutchAuction {
    address payable public seller;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public initialPrice;
    uint256 public startBlock;
    bool public isEnded;
    address public winner;

    IERC721 public nftMinter;
    uint256 public nftTokenId;
    
    modifier isOpenning() {
        require(!isEnded, "Auction has ended");
        _; 
    }

    constructor(
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement,
        address erc721TokenAddress,
        uint256 _nftTokenId
    ) {
        seller = payable(msg.sender);
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        initialPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;
        startBlock = block.number;
        isEnded = false;

        nftMinter = IERC721(erc721TokenAddress);
        nftTokenId = _nftTokenId;
    }

    function bid() public payable isOpenning returns (address) {
        require(block.number < startBlock + numBlocksAuctionOpen, "Auction expired");
        require(msg.value >= currentPrice(), "Bid should be no less than the current price");

        winner = msg.sender;
        finalize(currentPrice());        
        return winner;
    }

    function currentPrice() public view returns (uint256) {
        uint256 elapsedBlocks = block.number - startBlock;
        return initialPrice - elapsedBlocks * offerPriceDecrement;
    }

    function finalize(uint256 finalAuctionPrice) internal {
        isEnded = true;
        seller.transfer(finalAuctionPrice);
        // transfer the NFT to the winner
        nftMinter.safeTransferFrom(address(seller), winner, nftTokenId);
    }
}