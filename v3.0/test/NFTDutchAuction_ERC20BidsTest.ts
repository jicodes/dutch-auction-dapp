import { expect } from "chai";
import { ethers } from "hardhat";

import { NFTMinter } from "../typechain-types/contracts/NFTMinter";
import { TUSDFaucet } from "../typechain-types/contracts/TUSDFaucet";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";


describe("NFTDutchAuction_ERC20BidsTest", function () {
  
  async function deployDutchAuctionFixture() {
    const [seller, bidder1, bidder2] = await ethers.getSigners();
    // Deploy TUSD Faucet and mint TUSD
    const TUSDFaucetFactory = await ethers.getContractFactory("TUSDFaucet");
    const tUSDFaucet = await TUSDFaucetFactory.deploy();
    const tUSDFaucetAddress = await tUSDFaucet.getAddress();
    await tUSDFaucet.connect(bidder1).mint(bidder1.address, ethers.parseUnits("2000", 18));
    await tUSDFaucet.connect(bidder2).mint(bidder2.address, ethers.parseUnits("1000", 18));

    // Deploy NFT Minter and mint NFT
    const NFTMinterFactory = await ethers.getContractFactory("NFTMinter");
    const nftMinter = await NFTMinterFactory.deploy();
    const nftMinterAddress = await nftMinter.getAddress();
    const mintTx = await nftMinter.mint(seller.address);

    // Extract the tokenId from the "Transfer" event in the transaction logs
    const receipt = await mintTx.wait();
    const event = nftMinter.interface.parseLog(receipt.logs[0]);
    const tokenId = event.args.tokenId;
    const eventName = event.name;

    // Deploy Auction Contract
    const reservePrice = ethers.parseUnits("1000", 18);
    const numBlocksAuctionOpen = 1000;
    const offerPriceDecrement = ethers.parseUnits("1", 18);
    const NFTDutchAuctionFactory = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
    const nftDutchAuction = await NFTDutchAuctionFactory.deploy(
        reservePrice,
        numBlocksAuctionOpen,
        offerPriceDecrement,
        nftMinterAddress,
        tokenId,
        tUSDFaucetAddress
    );

    // Approve the auction contract to transfer the NFT
    await nftMinter.connect(seller).approve(await nftDutchAuction.getAddress(), tokenId);

    return {seller, bidder1, bidder2, tUSDFaucet, tUSDFaucetAddress, nftMinter, nftMinterAddress, eventName, tokenId, nftDutchAuction, reservePrice, numBlocksAuctionOpen, offerPriceDecrement};
  }

  describe("Deployment", function () {
    describe("TUSDFaucet", function () {
      it("Should assign the correct owner and balance after TUSDFaucet deployment.", 
          async function () {
        const { bidder1, bidder2, tUSDFaucet } = await loadFixture(deployDutchAuctionFixture);
        // Check the owner and balance
        expect(await tUSDFaucet.balanceOf(bidder1.address)).to.equal(ethers.parseUnits("2000", 18));
        expect(await tUSDFaucet.balanceOf(bidder2.address)).to.equal(ethers.parseUnits("1000", 18));
      });
    });
    
    describe("NFTMinter", function () {
      it("Should emit a Transfer event and correctly assign ownership and balances after an NFT is minted by the seller.", 
          async function () {
        const { seller, nftMinter, eventName, tokenId } = await loadFixture(deployDutchAuctionFixture);
        // Check the event emitted
        expect(eventName).to.equal("Transfer");
        // Check the owner and balance
        expect(await nftMinter.ownerOf(tokenId)).to.equal(seller.address);
        expect(await nftMinter.totalSupply()).to.equal(1);
        expect(await nftMinter.balanceOf(seller.address)).to.equal(1);
      });
    });
  
    describe("AuctionContract", function () { 
      it("Auction should be properly initialized", async function () { 
        const { nftMinter, tokenId, nftDutchAuction, reservePrice, numBlocksAuctionOpen, offerPriceDecrement } = await loadFixture(deployDutchAuctionFixture);
        expect(await nftDutchAuction.reservePrice()).to.equal(reservePrice);
        expect(await nftDutchAuction.numBlocksAuctionOpen()).to.equal(numBlocksAuctionOpen);
        expect(await nftDutchAuction.offerPriceDecrement()).to.equal(offerPriceDecrement);
        expect(await nftDutchAuction.winner()).to.equal(ethers.ZeroAddress);
        
        // check the auction is open
        expect(await nftDutchAuction.isEnded()).to.equal(false);

        // check the NFT transfer to be approved
        const auctionAddress = await nftDutchAuction.getAddress();
        const approvedAddress = await nftMinter.getApproved(tokenId);
        expect(approvedAddress).to.equal(auctionAddress);
      });
    });
  });

  describe("Bid", function () {
    it("Auction should end after the specified number of open blocks have passed.", async function () {
      const { nftDutchAuction, numBlocksAuctionOpen, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      // Advance the blocks to the end of auction
      for(let i = 0; i <= numBlocksAuctionOpen ; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      const bidAmount = ethers.parseUnits("2000", 18);
      await expect(nftDutchAuction.connect(bidder1).bid(bidAmount)).to.be.revertedWith("Auction expired");
    });

    it("Bid should be equal to or greater than the current price", async function () {
      const { tUSDFaucet, nftDutchAuction, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      // aprove the auction contract to transfer the TUSD
      const approvalTx = await tUSDFaucet.connect(bidder1).approve(await nftDutchAuction.getAddress(), ethers.parseUnits("2000", 18));
      await approvalTx.wait(); // Wait for the approval transaction to be mined
  
      const currentPrice = await nftDutchAuction.currentPrice();
      const bidAmount = currentPrice - ethers.parseUnits("10", 18 );  
      await expect(nftDutchAuction.connect(bidder1).bid(bidAmount)).to.be.revertedWith("Bid should be no less than the current price");
    });

    it("Bidder should have approved enough TUSD allowance for the auction", async function () {
      const { tUSDFaucet, nftDutchAuction, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      // aprove the auction contract to transfer the TUSD
      await tUSDFaucet.connect(bidder1).approve(await nftDutchAuction.getAddress(), ethers.parseUnits("500", 18));
      
      const bidAmount = await nftDutchAuction.currentPrice();
      await expect(nftDutchAuction.connect(bidder1).bid(bidAmount)).to.be.revertedWith("The bidder has not approved enough TUSD allowance for the auction");
    });
    
    it("Bidder should have enough balance for bidding", async function () {
      const { tUSDFaucet, nftDutchAuction, bidder2 } = await loadFixture(deployDutchAuctionFixture);
      // approve the auction contract to transfer the TUSD
      await tUSDFaucet.connect(bidder2).approve(await nftDutchAuction.getAddress(), ethers.parseUnits("2000", 18));
      const bidAmount = await nftDutchAuction.currentPrice();
      await expect(nftDutchAuction.connect(bidder2).bid(bidAmount)).to.be.revertedWith("Bidder does not have enough TUSD balance");
    });
  
    it("Successful bid should make bidder the winner and end the auction", async function () {
      const { tUSDFaucet, nftDutchAuction, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      await tUSDFaucet.connect(bidder1).approve(await nftDutchAuction.getAddress(), ethers.parseUnits("2000", 18));
      const bid = ethers.parseUnits("2000", 18);
      await nftDutchAuction.connect(bidder1).bid(bid);
      expect(await nftDutchAuction.winner()).to.equal(bidder1.address);
      expect(await nftDutchAuction.isEnded()).to.be.true;
    });

    it("Auction should not accept bids after a successful bid", async function () {
        const { tUSDFaucet, nftDutchAuction, bidder1, bidder2 } = await loadFixture(deployDutchAuctionFixture);
        await tUSDFaucet.connect(bidder1).approve(await nftDutchAuction.getAddress(), ethers.parseUnits("2000", 18));
        const bid = ethers.parseUnits("2000", 18);
        await nftDutchAuction.connect(bidder1).bid(bid);
        await expect(nftDutchAuction.connect(bidder2).bid(bid)).to.be.revertedWith("Auction has ended");
    });
  });

  describe("Finalize", function () {
    describe("Transfer", function() {
      it("The seller should receive the funds from the winning bid", async function () {
        const { tUSDFaucet, nftDutchAuction, seller, bidder1 } = await loadFixture(deployDutchAuctionFixture);
        await tUSDFaucet.connect(bidder1).approve(await nftDutchAuction.getAddress(), ethers.parseUnits("2000", 18));
        
        const initialBalanceSeller = await tUSDFaucet.balanceOf(seller.address);
        const bidAmount = ethers.parseUnits("2000", 18); 
        await nftDutchAuction.connect(bidder1).bid(bidAmount);
        const finalAuctionPrice = await nftDutchAuction.currentPrice();
    
        const finalBalanceSeller = await tUSDFaucet.balanceOf(seller.address);
    
        // Since bidder1 is the winner, the auction's price at the bid time should have been transferred to the seller
        expect(finalBalanceSeller).to.equal(initialBalanceSeller + finalAuctionPrice);
      });

      it("The NFT should be transferred to the winner", async function () {
        const { tUSDFaucet, nftMinter, nftDutchAuction, seller, bidder1, eventName, tokenId} = await loadFixture(deployDutchAuctionFixture);
        await tUSDFaucet.connect(bidder1).approve(await nftDutchAuction.getAddress(), ethers.parseUnits("2000", 18));
        const bidAmount = await nftDutchAuction.currentPrice(); // Bid at the current price
        await nftDutchAuction.connect(bidder1).bid(bidAmount);
        
        expect(eventName).to.equal("Transfer");
        // Check the NFT is transferred to the winner
        expect(await nftMinter.ownerOf(tokenId)).to.equal(bidder1.address);
        expect(await nftMinter.balanceOf(seller.address)).to.equal(0);
        expect(await nftMinter.balanceOf(bidder1.address)).to.equal(1);

      });
    });
  });
});