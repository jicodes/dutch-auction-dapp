import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { AbiCoder } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";


describe("NFTDutchAuction_Upgradable", function () {

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

    // Deploy a Proxy Contract and point the implementation to NFT Dutch Auction
    const reservePrice = ethers.parseUnits("1000", 18);
    const numBlocksAuctionOpen = 1000;
    const offerPriceDecrement = ethers.parseUnits("1", 18);
    const NFTDutchAuctionFactory = await ethers.getContractFactory("NFTDutchAuction_Upgradable");
    const nftDutchAuctionProxy = await upgrades.deployProxy(NFTDutchAuctionFactory, [
      reservePrice,
      numBlocksAuctionOpen,
      offerPriceDecrement,
      nftMinterAddress,
      tokenId,
      tUSDFaucetAddress
    ], { kind: 'uups' });

    // Approve the auction contract to transfer the NFT
    await nftMinter.connect(seller).approve(await nftDutchAuctionProxy.getAddress(), tokenId);

    return { seller, bidder1, bidder2, tUSDFaucet, tUSDFaucetAddress, nftMinter, nftMinterAddress, eventName, tokenId, nftDutchAuctionProxy, reservePrice, numBlocksAuctionOpen, offerPriceDecrement };
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
        const { nftMinter, tokenId, nftDutchAuctionProxy, reservePrice, numBlocksAuctionOpen, offerPriceDecrement } = await loadFixture(deployDutchAuctionFixture);
        expect(await nftDutchAuctionProxy.reservePrice()).to.equal(reservePrice);
        expect(await nftDutchAuctionProxy.numBlocksAuctionOpen()).to.equal(numBlocksAuctionOpen);
        expect(await nftDutchAuctionProxy.offerPriceDecrement()).to.equal(offerPriceDecrement);
        expect(await nftDutchAuctionProxy.winner()).to.equal(ethers.ZeroAddress);

        // check the auction is open
        expect(await nftDutchAuctionProxy.isEnded()).to.equal(false);

        // check the NFT transfer to be approved
        const auctionAddress = await nftDutchAuctionProxy.getAddress();
        const approvedAddress = await nftMinter.getApproved(tokenId);
        expect(approvedAddress).to.equal(auctionAddress);
      });
      it("Should fail if trying to initialize the auction twice", async function () {
        // Deploy contract first
        const NFTDutchAuction = await ethers.getContractFactory("NFTDutchAuction_Upgradable");
        const nftDutchAuction = await NFTDutchAuction.deploy();

        // Call initialize function with appropriate parameters
        await nftDutchAuction.initialize(
          1000, // _reservePrice
          1000,  // _numBlocksAuctionOpen
          1,   // _offerPriceDecrement
          "0x1A92f7381B9F03921564a437210bB9396471050C", // erc721TokenAddress
          1, // _nftTokenId
          "0xdac17f958d2ee523a2206206994597c13d831ec7"  // erc20TokenAddress
        );
        await expect(nftDutchAuction.initialize(
          1000, // _reservePrice
          1000,  // _numBlocksAuctionOpen
          1,   // _offerPriceDecrement
          "0x1A92f7381B9F03921564a437210bB9396471050C", // erc721TokenAddress
          1, // _nftTokenId
          "0xdac17f958d2ee523a2206206994597c13d831ec7"  // erc20TokenAddress
        )).to.be.revertedWith("Initializable: contract is already initialized");

      });

    });
  });

  describe("Bid", function () {
    it("Auction should end after the specified number of open blocks have passed.", async function () {
      const { nftDutchAuctionProxy, numBlocksAuctionOpen, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      // Advance the blocks to the end of auction
      for (let i = 0; i <= numBlocksAuctionOpen; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      const bidAmount = ethers.parseUnits("2000", 18);
      await expect(nftDutchAuctionProxy.connect(bidder1).bid(bidAmount)).to.be.revertedWith("Auction expired");
    });

    it("Bid should be equal to or greater than the reserve price", async function () {
      const { tUSDFaucet, nftDutchAuctionProxy, bidder1, reservePrice } = await loadFixture(deployDutchAuctionFixture);
      // aprove the auction contract to transfer the TUSD
      await tUSDFaucet.connect(bidder1).approve(await nftDutchAuctionProxy.getAddress(), ethers.parseUnits("2000", 18));
      const bidAmount = reservePrice - ethers.parseUnits("1", 18);
      await expect(nftDutchAuctionProxy.connect(bidder1).bid(bidAmount)).to.be.revertedWith("Bid should be no less than the reserve price");
    });

    it("Bid should be equal to or greater than the current price", async function () {
      const { tUSDFaucet, nftDutchAuctionProxy, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      // aprove the auction contract to transfer the TUSD
      const approvalTx = await tUSDFaucet.connect(bidder1).approve(await nftDutchAuctionProxy.getAddress(), ethers.parseUnits("2000", 18));
      await approvalTx.wait(); // Wait for the approval transaction to be mined

      const currentPrice = await nftDutchAuctionProxy.currentPrice();
      const bidAmount = currentPrice - ethers.parseUnits("10", 18);
      await expect(nftDutchAuctionProxy.connect(bidder1).bid(bidAmount)).to.be.revertedWith("Bid should be no less than the current price");
    });

    it("Bidder should have approved enough TUSD allowance for the auction", async function () {
      const { tUSDFaucet, nftDutchAuctionProxy, bidder1 } = await loadFixture(deployDutchAuctionFixture);
      // aprove the auction contract to transfer the TUSD
      await tUSDFaucet.connect(bidder1).approve(await nftDutchAuctionProxy.getAddress(), ethers.parseUnits("500", 18));

      const bidAmount = await nftDutchAuctionProxy.currentPrice();
      await expect(nftDutchAuctionProxy.connect(bidder1).bid(bidAmount)).to.be.revertedWith("The bidder has not approved enough TUSD allowance for the auction");
    });

    it("Bidder should have enough balance for bidding", async function () {
      const { tUSDFaucet, nftDutchAuctionProxy, bidder2 } = await loadFixture(deployDutchAuctionFixture);
      // approve the auction contract to transfer the TUSD
      await tUSDFaucet.connect(bidder2).approve(await nftDutchAuctionProxy.getAddress(), ethers.parseUnits("2000", 18));
      const bidAmount = await nftDutchAuctionProxy.currentPrice();
      await expect(nftDutchAuctionProxy.connect(bidder2).bid(bidAmount)).to.be.revertedWith("Bidder does not have enough TUSD balance");
    });

    // test permit   
    it("Successful bid should make bidder the winner and end the auction", async function () {
      const { tUSDFaucet, tUSDFaucetAddress, nftDutchAuctionProxy, bidder1 } = await loadFixture(deployDutchAuctionFixture);

      const nftDutchAuctionProxyAddress = await nftDutchAuctionProxy.getAddress();
      const bidder1Address = await bidder1.getAddress();
      // generate a deadline for the permit - a time in the future
      const deadline = Math.floor(Date.now() / 1000) + 60 * 60;  // 1 hour from now
      
      // Define EIP-712 typed data
      const domain = {
        name: "Test USD",
        version: "1",
        chainId: 31337, // chainId
        verifyingContract: tUSDFaucetAddress
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };

      const message = {
        owner: bidder1Address,
        spender: nftDutchAuctionProxyAddress,
        value: ethers.parseUnits("2000", 18),
        nonce: await tUSDFaucet.nonces(bidder1Address),
        deadline: deadline
      };

      // Sign the EIP-712 typed data
      const signature = await bidder1.signTypedData(domain, types, message);
      const { v, r, s } = ethers.Signature.from(signature);

      // Call permit to approve allowance for the auction contract
      await tUSDFaucet.connect(bidder1).permit(bidder1Address, nftDutchAuctionProxyAddress, ethers.parseUnits("2000", 18), deadline, v, r, s);

      const bid = ethers.parseUnits("2000", 18);
      await nftDutchAuctionProxy.connect(bidder1).bid(bid);
      expect(await nftDutchAuctionProxy.winner()).to.equal(bidder1Address);
      expect(await nftDutchAuctionProxy.isEnded()).to.be.true;
    });


    it("Auction should not accept bids after a successful bid", async function () {
      const { tUSDFaucet, nftDutchAuctionProxy, bidder1, bidder2 } = await loadFixture(deployDutchAuctionFixture);
      await tUSDFaucet.connect(bidder1).approve(await nftDutchAuctionProxy.getAddress(), ethers.parseUnits("2000", 18));
      const bid = ethers.parseUnits("2000", 18);
      await nftDutchAuctionProxy.connect(bidder1).bid(bid);
      await expect(nftDutchAuctionProxy.connect(bidder2).bid(bid)).to.be.revertedWith("Auction has ended");
    });
  });

  describe("Finalize", function () {
    describe("Transfer", function () {
      it("The seller should receive the funds from the winning bid", async function () {
        const { tUSDFaucet, nftDutchAuctionProxy, seller, bidder1 } = await loadFixture(deployDutchAuctionFixture);
        await tUSDFaucet.connect(bidder1).approve(await nftDutchAuctionProxy.getAddress(), ethers.parseUnits("2000", 18));

        const initialBalanceSeller = await tUSDFaucet.balanceOf(seller.address);
        const bidAmount = ethers.parseUnits("2000", 18);
        await nftDutchAuctionProxy.connect(bidder1).bid(bidAmount);
        const finalAuctionPrice = await nftDutchAuctionProxy.currentPrice();

        const finalBalanceSeller = await tUSDFaucet.balanceOf(seller.address);

        // Since bidder1 is the winner, the auction's price at the bid time should have been transferred to the seller
        expect(finalBalanceSeller).to.equal(initialBalanceSeller + finalAuctionPrice);
      });

      it("The NFT should be transferred to the winner", async function () {
        const { tUSDFaucet, nftMinter, nftDutchAuctionProxy, seller, bidder1, eventName, tokenId } = await loadFixture(deployDutchAuctionFixture);
        await tUSDFaucet.connect(bidder1).approve(await nftDutchAuctionProxy.getAddress(), ethers.parseUnits("2000", 18));
        const bidAmount = await nftDutchAuctionProxy.currentPrice(); // Bid at the current price
        await nftDutchAuctionProxy.connect(bidder1).bid(bidAmount);

        expect(eventName).to.equal("Transfer");
        // Check the NFT is transferred to the winner
        expect(await nftMinter.ownerOf(tokenId)).to.equal(bidder1.address);
        expect(await nftMinter.balanceOf(seller.address)).to.equal(0);
        expect(await nftMinter.balanceOf(bidder1.address)).to.equal(1);
      });
    });
  });

  describe("Upgradable", function () {
    it("Only the auction owner(seller) should be able to authorize upgrades", async function () {
      const { nftDutchAuctionProxy, seller, bidder1, reservePrice,
        numBlocksAuctionOpen,
        offerPriceDecrement,
        nftMinterAddress,
        tokenId,
        tUSDFaucetAddress } = await loadFixture(deployDutchAuctionFixture);

      const nftDutchAuctionProxyAddress = await nftDutchAuctionProxy.getAddress();


      // Deploy a new version of the contract
      const NewImplementationFactory = await ethers.getContractFactory("NewImplementation");
      const newImplementation = await NewImplementationFactory.deploy();

      const newImplementationAddress = await newImplementation.getAddress();

      // Try to upgrade the proxy to the new version using a non-owner account, it should be reverted
      await expect(nftDutchAuctionProxy.connect(bidder1).upgradeTo(newImplementationAddress)).to.be.revertedWith("Ownable: caller is not the owner");

      // Now try upgrading with the owner account, this should work
      await nftDutchAuctionProxy.connect(seller).upgradeTo(newImplementationAddress);

      //Check the upgrade was successful
      //call the new getVersion function through the proxy to verify the upgrade.
      const NewImplementationContract = await ethers.getContractAt("NewImplementation", nftDutchAuctionProxyAddress);
      expect(await NewImplementationContract.getVersion()).to.equal("2");
    });
  });
});