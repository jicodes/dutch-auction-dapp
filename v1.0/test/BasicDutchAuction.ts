import { expect } from "chai";
import { ethers } from "hardhat";


import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("BasicDutchAuction", function () {
  
  async function deployDutchAuctionFixture () {
  
    const reservePrice = ethers.parseEther("1"); // 1 ETH
    const numBlocksAuctionOpen = 1_000; // auction open for 1000 blocks
    const offerPriceDecrement = ethers.parseEther("0.001"); // 0.001 ETH
    
    const startBlock = await ethers.provider.getBlockNumber();
    const [owner, bidder1, bidder2] = await ethers.getSigners();
    const BasicDutchAuctionFactory = await ethers.getContractFactory("BasicDutchAuction");
    const basicDutchAuction = await BasicDutchAuctionFactory.deploy(reservePrice, numBlocksAuctionOpen, offerPriceDecrement);
    
    return { basicDutchAuction, reservePrice, numBlocksAuctionOpen, offerPriceDecrement, startBlock, owner, bidder1, bidder2};
  };

  describe("Deployment", function () { 
    it("Initial auction parameters should match constructor args", async function () {
      const { basicDutchAuction, reservePrice, numBlocksAuctionOpen, offerPriceDecrement } = await loadFixture(deployDutchAuctionFixture);
      expect(await basicDutchAuction.reservePrice()).to.equal(reservePrice);
      expect(await basicDutchAuction.numBlocksAuctionOpen()).to.equal(numBlocksAuctionOpen);
      expect(await basicDutchAuction.offerPriceDecrement()).to.equal(offerPriceDecrement);
    });
  });
  
  describe("Bidding", function () {
    it("Bids less than current price should fail", async function () {
      const { basicDutchAuction, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      const bid = ethers.parseEther("0.5");
      await expect(basicDutchAuction.connect(bidder1).bid({ value: bid })).to.be.revertedWith("Bid must be higher than current price");
    });
  
  
    it("Auction should not accept bids after a successful bid", async function () {
      const { basicDutchAuction, bidder1, bidder2 } = await loadFixture(deployDutchAuctionFixture);
      const bid = ethers.parseEther("2");
      await basicDutchAuction.connect(bidder1).bid({ value: bid });
      await expect(basicDutchAuction.connect(bidder2).bid({ value: bid })).to.be.revertedWith("Auction is already ended");
    });

    it("Auction should conclude after the specified number of open blocks have passed.", async function () {
      const { basicDutchAuction, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      const bid = ethers.parseEther("2");
    
      // Mine 1001 blocks
      for(let i = 0; i < 1_001; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      
      await expect(basicDutchAuction.connect(bidder1).bid({ value: bid })).to.be.revertedWith("Auction is already ended");
    });
    
    it("Successful bid should make bidder the winner and end the auction", async function () {
      const { basicDutchAuction, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      const bid = ethers.parseEther("2");
      await basicDutchAuction.connect(bidder1).bid({ value: bid });
      expect(await basicDutchAuction.winner()).to.equal(bidder1.address);
      expect(await basicDutchAuction.auctionEnded()).to.be.true;
    });
  
    it("The owner should receive the funds from the winning bid", async function () {
      const { basicDutchAuction, bidder1, owner } = await loadFixture(deployDutchAuctionFixture);
      const currentPrice = await basicDutchAuction.currentPrice(); // Bid at the current price
      const initialBalanceOwner = await ethers.provider.getBalance(owner.address);
  
      await basicDutchAuction.connect(bidder1).bid({ value: currentPrice });
  
      const finalBalanceOwner = await ethers.provider.getBalance(owner.address);
  
      // Since bidder1 was the winner, their bid should have been transferred to the owner
      expect(finalBalanceOwner - initialBalanceOwner).to.equal(currentPrice);
    });

      
    describe("Current price calculation", function() {
      it("Should return reserve price when auction period is over", async function() {
        const { basicDutchAuction, numBlocksAuctionOpen, reservePrice } = await loadFixture(deployDutchAuctionFixture);
    
        // Advance the blocks to the end of auction
        for(let i = 0; i <= numBlocksAuctionOpen; i++) {
          await ethers.provider.send("evm_mine", []);
        }
    
        // Check if the currentPrice equals the reservePrice
        const currentPrice = await basicDutchAuction.currentPrice();
        expect(currentPrice).to.equal(reservePrice);
      });
    });
  
  });
});