import '@nomiclabs/hardhat-waffle';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

task('deploy', 'Deploy Auction contract').setAction(
  async (_, hre: HardhatRuntimeEnvironment): Promise<void> => {
    const Auction = await hre.ethers.getContractFactory('Auction');
    // TODO: Add constructor arguments 
    const auction = await Auction.deploy('Hello, Hardhat!');

    await auction.deployed();

    console.log('Auction deployed to:', auction.address);
  }
);
