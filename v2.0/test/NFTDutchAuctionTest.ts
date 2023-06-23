import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

import { NFTMinter } from "../typechain-types/contracts/NFTMinter";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";



describe("NFTDutchAuctionTest", function () {
  async function deployNFTDutchAuctionFixture() {
    const reservePrice = ethers.parseEther("1");
    const numBlocksAuctionOpen = 1000;
    const offerPriceDecrement = ethers.parseEther("0.001");

    const [seller, bidder1, bidder2] = await ethers.getSigners();

    // The seller deploys NFTMinter contract and mint an NFT 
    const NFTMinterFactory = await ethers.getContractFactory("NFTMinter");
    
    const nftMinter = await NFTMinterFactory.deploy();
    const nftMinterAddress = await nftMinter.getAddress();

    const tx = await nftMinter.mint(seller.address);
    const receipt = await tx.wait();
    // const tokenId = receipt?.events[0].args![2];

    
    // Then deploys NFTDutchAuction contract
    const NFTDutchAuctionFactory = await ethers.getContractFactory("NFTDutchAuction");
    const nftDutchAuction = await NFTDutchAuctionFactory.deploy(
      nftMinterAddress, 
      0, // token ID starts from 0
      reservePrice,
      numBlocksAuctionOpen,
      offerPriceDecrement
    );

    // Approve the NFTDutchAuction contract to transfer the NFT on behalf of the seller

    await nftMinter.connect(seller).approve(await nftDutchAuction.getAddress(), 0);
    console.log(await nftDutchAuction.getAddress())
    return {
      nftMinter,
      nftDutchAuction,
      reservePrice,
      numBlocksAuctionOpen,
      offerPriceDecrement,
      seller,
      bidder1,
      bidder2
    };
  };

  describe("Deployment", function () {
    it("Initial auction parameters should match constructor args", async function () {
      const { nftDutchAuction, reservePrice, numBlocksAuctionOpen, offerPriceDecrement, nftMinter, seller } = await loadFixture(deployNFTDutchAuctionFixture);
      expect(await nftDutchAuction.reservePrice()).to.equal(reservePrice);
      expect(await nftDutchAuction.numBlocksAuctionOpen()).to.equal(numBlocksAuctionOpen);
      expect(await nftDutchAuction.offerPriceDecrement()).to.equal(offerPriceDecrement);


      // The NFTMinter contract should have 1 token after mint
      expect(await nftMinter.totalSupply()).to.equal(1);
      // The seller should have 1 token after mint
      expect(await nftMinter.balanceOf(seller.address)).to.equal(1);
      
    });
  });



  describe("Bidding", function () {
    it("Bids less than current price should fail", async function () {
      const { nftDutchAuction, bidder1 } = await loadFixture(deployNFTDutchAuctionFixture);
      const bid = ethers.parseEther("0.5");
      await expect(nftDutchAuction.connect(bidder1).bid({ value: bid })).to.be.revertedWith("Bid must be higher than current price");
    });

    it("Auction should not accept bids after a successful bid", async function () {
      const { nftDutchAuction, bidder1, bidder2 } = await loadFixture(deployNFTDutchAuctionFixture);
      const bid = ethers.parseEther("2");
      await nftDutchAuction.connect(bidder1).bid({ value: bid });
      await expect(nftDutchAuction.connect(bidder2).bid({ value: bid })).to.be.revertedWith("Auction is already ended");
    });

    it("Auction should conclude after the specified number of open blocks have passed.", async function () {
      const { nftDutchAuction, bidder1 } = await loadFixture(deployNFTDutchAuctionFixture);
      const bid = ethers.parseEther("2");

      // Mine 1001 blocks
      for (let i = 0; i < 1_001; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await expect(nftDutchAuction.connect(bidder1).bid({ value: bid })).to.be.revertedWith("Auction is already ended");
    });

    it("Successful bid should make bidder the winner and end the auction", async function () {
      const { nftDutchAuction, bidder1 } = await loadFixture(deployNFTDutchAuctionFixture);
      const bid = ethers.parseEther("2");
      await nftDutchAuction.connect(bidder1).bid({ value: bid });
      expect(await nftDutchAuction.winner()).to.equal(bidder1.address);
      expect(await nftDutchAuction.auctionEnded()).to.be.true;
    });

    it("The seller should receive the funds from the winning bid", async function () {
      const { nftDutchAuction, bidder1, seller } = await loadFixture(deployNFTDutchAuctionFixture);
      const currentPrice = await nftDutchAuction.currentPrice(); // Bid at the current price
      const initialBalanceOwner = await ethers.provider.getBalance(seller.address);

      await nftDutchAuction.connect(bidder1).bid({ value: currentPrice });

      const finalBalanceOwner = await ethers.provider.getBalance(seller.address);

      // Since bidder1 was the winner, their bid should have been transferred to the owner
      expect(finalBalanceOwner - initialBalanceOwner).to.equal(currentPrice);
    });

    it("Successful bid should transfer the NFT to the winner", async function () {
      const { nftDutchAuction, nftMinter, bidder1 } = await loadFixture(deployNFTDutchAuctionFixture);
      const bid = ethers.parseEther("2");
      await nftDutchAuction.connect(bidder1).bid({ value: bid });
      expect(await nftMinter.ownerOf(0)).to.equal(bidder1.address);
    });

    describe("Current price calculation", function () {
      it("Should return reserve price when auction period is over", async function () {
        const { nftDutchAuction, numBlocksAuctionOpen, reservePrice } = await loadFixture(deployNFTDutchAuctionFixture);

        // Advance the blocks to the end of auction
        for (let i = 0; i <= numBlocksAuctionOpen; i++) {
          await ethers.provider.send("evm_mine", []);
        }

        // Check if the currentPrice equals the reservePrice
        const currentPrice = await nftDutchAuction.currentPrice();
        expect(currentPrice).to.equal(reservePrice);
      });
    });
  });
});