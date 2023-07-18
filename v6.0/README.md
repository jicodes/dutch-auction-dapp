# Dutch Auction DApp utilizing React Typescript Ethers.js Web3-react Hardhat 

This project is built on top of [ChainShot](https://www.chainshot.com)'s [How to Build a React Dapp with Hardhat and MetaMask](https://medium.com/p/9cec8f6410d3) Medium article.


# How to run the project

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
