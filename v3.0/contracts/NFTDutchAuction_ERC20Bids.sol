// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol"; // implements IERC721Receiver interface
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./TUSDErc20.sol";


contract NFTDutchAuction is ERC721Holder {
    address payable public seller;
    IERC721 public nftContract;
    uint256 public nftTokenId;
    TUSDErc20 public tusdTokenContract;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public initialPrice;
    uint256 public startBlock;
    bool public auctionEnded;
    address public winner;

    constructor(
        address erc20TokenAddress,
        address erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        seller = payable(msg.sender);
        nftContract = IERC721(erc721TokenAddress);
        nftTokenId = _nftTokenId;
        tusdTokenContract = TUSDErc20(erc20TokenAddress);
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        initialPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;
        startBlock = block.number;
        auctionEnded = false;
    }

    function bid(uint256 amountToBid) public returns (address) {
        require(block.number <= startBlock + numBlocksAuctionOpen, "Auction is already ended");
        require(!auctionEnded, "Auction is already ended");
        require(amountToBid >= currentPrice(), "Bid must be higher than current price");
        
        require(tusdTokenContract.balanceOf(msg.sender) >= amountToBid, "Bidder does not have enough balance");
        require(tusdTokenContract.allowance(msg.sender, address(this)) >= amountToBid, "Bidder has not approved the auction contract to transfer the bid amount");

        // Transfer the tokens from the bidder to the seller
        tusdTokenContract.transferFrom(msg.sender, address(seller), amountToBid);
        auctionEnded = true;
        // Transfer the NFT from the seller to the winner 
        nftContract.safeTransferFrom(address(seller), msg.sender, nftTokenId);

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
