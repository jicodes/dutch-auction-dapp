// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract NFTDutchAuction is ERC721Holder {
    address payable public seller;
    IERC721 public nftContract;
    uint256 public nftTokenId;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public initialPrice;
    uint256 public startBlock;
    bool public auctionEnded;
    address public winner;

    constructor(
        address erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        seller = payable(msg.sender);
        nftContract = IERC721(erc721TokenAddress);
        nftTokenId = _nftTokenId;
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        initialPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;
        startBlock = block.number;
        auctionEnded = false;
    }

    function bid() public payable {
        require(block.number <= startBlock + numBlocksAuctionOpen, "Auction is already ended");
        require(!auctionEnded, "Auction is already ended");
        require(msg.value >= currentPrice(), "Bid must be higher than current price");

        auctionEnded = true;
        seller.transfer(msg.value); // Transfer the funds to the seller immediately

        // Transfer the NFT to the winner
        nftContract.safeTransferFrom(address(this), msg.sender, nftTokenId);

        winner = msg.sender;
    }

    function currentPrice() public view returns (uint256) {
        uint256 elapsedBlocks = block.number - startBlock;
        if (elapsedBlocks > numBlocksAuctionOpen) {
            return reservePrice;
        }
        return initialPrice - elapsedBlocks * offerPriceDecrement;
    }
}
