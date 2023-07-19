import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    const AuctionContract = await ethers.getContractFactory("BasicDutchAuction");
    const auctionContract = await AuctionContract.deploy(1000, 500, 2);

    await auctionContract.deployed();
    console.log("Auction contract deployed to:", auctionContract.address);

    const initialPrice = await auctionContract.initialPrice();
    console.log("Auction initial price:", initialPrice.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
