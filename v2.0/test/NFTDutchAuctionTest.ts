import { expect } from "chai";
import { ethers } from "hardhat";

import { NFTMinter } from "../typechain-types/contracts/NFTMinter";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";


describe("NFTDutchAuctionTest", function () {
  let nftMinter: NFTMinter;
  let nftMinterAddress: string;
  let tokenId: number;
  let eventName: string;

  async function deployAndMintNFTFixture () {
    const NFTMinterFactory = await ethers.getContractFactory("NFTMinter");
    nftMinter = await NFTMinterFactory.deploy();
    nftMinterAddress = await nftMinter.getAddress();
    const [seller] = await ethers.getSigners();

    // Mint the NFT
    const mintTx = await nftMinter.mint(seller.address);

    // Wait for the transaction to be mined
    const receipt = await mintTx.wait();
    
    // Extract the tokenId from the "Transfer" event in the transaction logs
    const event = nftMinter.interface.parseLog(receipt.logs[0]);
    eventName = event.name;
    tokenId = event.args.tokenId;

    return { seller, nftMinter, nftMinterAddress, tokenId, eventName };
  };
  async function deployDutchAuctionFixture () {
  
    const reservePrice = ethers.parseEther("1"); // 1 ETH
    const numBlocksAuctionOpen = 1_000; // auction open for 1000 blocks
    const offerPriceDecrement = ethers.parseEther("0.001"); // decrese 0.001 ETH per block
    
    const startBlock = await ethers.provider.getBlockNumber();
    const [seller, bidder1, bidder2] = await ethers.getSigners();
    const NFTDutchAuctionFactory = await ethers.getContractFactory("NFTDutchAuction");
    const nftDutchAuction = await NFTDutchAuctionFactory.deploy(reservePrice, numBlocksAuctionOpen, offerPriceDecrement, nftMinterAddress, tokenId);

    // approve the auction contract to transfer the NFT
    await nftMinter.connect(seller).approve(await nftDutchAuction.getAddress(), tokenId);
    
    return { nftDutchAuction, reservePrice, numBlocksAuctionOpen, offerPriceDecrement, startBlock, seller, bidder1, bidder2 };
  };
  
  describe("NFTMinter", function () {
    it("Should emit a Transfer event and correctly assign ownership and balances after an NFT is minted by the seller.", 
        async function () {
      const { seller, nftMinter, eventName, tokenId } = await loadFixture(deployAndMintNFTFixture);
      // Check the event emitted
      expect(eventName).to.equal("Transfer");
      // Check the owner and balance
      expect(await nftMinter.ownerOf(tokenId)).to.equal(seller.address);
      expect(await nftMinter.totalSupply()).to.equal(1);
      expect(await nftMinter.balanceOf(seller.address)).to.equal(1);

    });
  });
  describe("DeployAuctionContract", function () { 
    it("Auction should be properly initialized", async function () { 
      const { nftDutchAuction, reservePrice, numBlocksAuctionOpen, offerPriceDecrement } = await loadFixture(deployDutchAuctionFixture);
      expect(await nftDutchAuction.reservePrice()).to.equal(reservePrice);
      expect(await nftDutchAuction.numBlocksAuctionOpen()).to.equal(numBlocksAuctionOpen);
      expect(await nftDutchAuction.offerPriceDecrement()).to.equal(offerPriceDecrement);
      
      // check the auction is open
      expect(await nftDutchAuction.isEnded()).to.equal(false);

      // check the NFT transfer to be approved
      const auctionAddress = await nftDutchAuction.getAddress();
      const approvedAddress = await nftMinter.getApproved(tokenId);
      expect(approvedAddress).to.equal(auctionAddress);

    });
  });
  describe("Bid", function () {
    it("Auction should end after the specified number of open blocks have passed.", async function () {
      const { nftDutchAuction, numBlocksAuctionOpen, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      // Advance the blocks to the end of auction
      for(let i = 0; i <= numBlocksAuctionOpen ; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      const bidAmount = ethers.parseEther("2");
      await expect(nftDutchAuction.connect(bidder1).bid({ value: bidAmount })).to.be.revertedWith("Auction expired");
    });

    it("Bid should be equal to or greater than the current price", async function () {
      const { nftDutchAuction, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      const currentPrice = await nftDutchAuction.currentPrice();
      const bidAmount = currentPrice - ethers.parseEther("0.1");
      await expect(nftDutchAuction.connect(bidder1).bid({ value: bidAmount })).to.be.revertedWith("Bid should be no less than the current price");
    });
    
    it("Successful bid should make bidder the winner and end the auction", async function () {
      const { nftDutchAuction, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      const bidAmount = ethers.parseEther("2");
      await nftDutchAuction.connect(bidder1).bid({ value: bidAmount });
      expect(await nftDutchAuction.winner()).to.equal(bidder1.address);
      expect(await nftDutchAuction.isEnded()).to.be.true;
    });

    it("Auction should not accept bids after a successful bid", async function () {
        const { nftDutchAuction, bidder1, bidder2 } = await loadFixture(deployDutchAuctionFixture);
        const bidAmount = ethers.parseEther("2");
        await nftDutchAuction.connect(bidder1).bid({ value: bidAmount });
        await expect(nftDutchAuction.connect(bidder2).bid({ value: bidAmount })).to.be.revertedWith("Auction has ended");
      });

  });
  describe("Finalize", function () {
    describe("Transfer", function() {
      it("The seller should receive the funds from the winning bid", async function () {
        const { nftDutchAuction, seller, bidder1 } = await loadFixture(deployDutchAuctionFixture);
        
        const initialBalanceSeller = await ethers.provider.getBalance(seller.address);
        
        const bidAmount = ethers.parseEther("2"); 
        await nftDutchAuction.connect(bidder1).bid({ value: bidAmount });
        const finalAuctionPrice = await nftDutchAuction.currentPrice();

        const finalBalanceSeller = await ethers.provider.getBalance(seller.address);
    
        // Since bidder1 is the winner, the auction's price at the bid time should have been transferred to the seller
        expect(finalBalanceSeller).to.greaterThanOrEqual(initialBalanceSeller + finalAuctionPrice);
      });

      it("The NFT should be transferred to the winner", async function () {
        const { seller, nftMinter, eventName, tokenId } = await loadFixture(deployAndMintNFTFixture);
        const { nftDutchAuction, bidder1 } = await loadFixture(deployDutchAuctionFixture);
        const bidAmount = await nftDutchAuction.currentPrice(); // Bid at the current price
        await nftDutchAuction.connect(bidder1).bid({ value: bidAmount });
        
        expect(eventName).to.equal("Transfer");
        // Check the NFT is transferred to the winner
        expect(await nftMinter.ownerOf(tokenId)).to.equal(bidder1.address);
        expect(await nftMinter.balanceOf(seller.address)).to.equal(0);
        expect(await nftMinter.balanceOf(bidder1.address)).to.equal(1);
      });
    });
  });
});