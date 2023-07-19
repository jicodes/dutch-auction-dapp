# v7.0 Dutch Auction Dapp developed with hardhat, ethers and react using typescript and web3-react

This project is built on top of [ChainShot](https://www.chainshot.com)'s [How to Build a React Dapp with Hardhat and MetaMask](https://medium.com/p/9cec8f6410d3) Medium article.

# How to run the project locally

Install `yarn` globally
```shell
npm install --global yarn
```

Clone this repo into your local machine, cd into the project directory and run the following commands to get setup and running.
```shell
yarn
yarn hardhat compile
yarn hardhat node
```
The commands above will install the project dependencies, compile the sample contract and run a local Hardhat node on port `8545`, using chain id `31337`.

After running the local node, checkout to frontend directory,
```shell
yarn install
yarn start
```

You will be abale to open the frontend at `http://localhost:3000/` in your browser and interact with the Duction Auction Dapp

Some other hardhat tasks to try out are:

```shell
yarn hardhat accounts
yarn hardhat clean
yarn hardhat deploy
yarn hardhat help
yarn hardhat node
yarn hardhat test
```

# Deploying to a live network
Here we deploy the contract on the Ethereum Sepolia testnet using the following command.
```shell
yarn hardhat run scripts/deploy.ts --network sepolia
```

# IPFS Host
This project UI is hosted on IPFS at [a fixed URL](https://ipfs.io/ipns/k51qzi5uqu5dlrx8iyeviazwwyubb1zeoo5g0zl8yeo8ld3kx2a7do3fnl4dh7) via IPNS.
You can do it with following steps:
1. Build the frontend
cd frontend directory and type the command:
```shell
yarn run build
``` 
2. Import and pin your UI build files to the IPFS Desktop node.
3. Publish to the IPNS.
4. Download IPFS browser extension.
5. You can view the UI in your brower and interact with the blockchain in you browser now.