# NFT Dutch Auction Dapp

This project is composed of two parts: a smart contract and the frontend UI. 


## Introduction of the Dutch Acution smart contract
The contract v5.0 implements an upgradable NFT Dutch Auction with bidding in ERC20 tokens, including the permit feature.

`NFTDutchAuction_Upgradable.sol` allows a seller to auction a single NFT using the Dutch Auction mechanism, accepting bids in an ERC20 token (TUSD). The contract is upgradeable using UUPS (Universal Upgradeable Proxy Standard) which allows for changes and additions to contract functionality. In a Dutch Auction, the price of the item starts high and decreases over time until a bidder accepts the current price. The NFT is transferred to the winning bidder, and the winning bid amount in TUSD tokens is transferred to the seller once the auction is finalized.

`TUSDFaucet.sol` is an ERC20 token contract that represents a Test USD token (TUSD) which can be minted for auction payment. This contract implements the [ERC20Permit](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Permit) extension from the OpenZeppelin Contracts library, which adds a `permit` function that allows token holders to approve spends by a spender using a signed message, rather than requiring a transaction. The `permit` function uses the EIP-712 standard for structured data hashing and signing, and allows for off-chain approval of token transfers. This means bidders can approve the auction contract to transfer TUSD tokens in the event of a successful bid without having to send a transaction, saving on gas fees.

`NFTMinter.sol` is for minting NFTs (Non-Fungible Tokens) based on the ERC721 standard. It utilizes the OpenZeppelin library's `ERC721PresetMinterPauserAutoId` preset which provides built-in functionalities for minting, pausing, and automatically assigning token IDs. Initializes the NFTMinter with a name, symbol, and base token URI.

`NFTDutchAuction_Upgradable.sol` requires the seller to approve the auction contract to transfer the NFT on their behalf. It also requires bidders to approve the auction contract to transfer TUSD tokens on their behalf as bids using either the standard `approve` function or the `permit` function for off-chain approvals.

### Key Features

- Upgradable smart contract using UUPS (Universal Upgradeable Proxy Standard).
- The auction is conducted for a single NFT, identified by its contract address and token ID.
- The auction starts at a high price and decreases with each block.
- Bidders can place bids in TUSD tokens; the first bid that meets or exceeds the current price wins.
- The price in TUSD at the time of the successful bid is transferred to the seller.
- The NFT is transferred to the winning bidder.
- Requires approval for transferring TUSD tokens and NFT.

### Smart Contract Parameters

- `reservePrice`: Minimum acceptable price in TUSD tokens.
- `numBlocksAuctionOpen`: Duration of auction in blocks.
- `offerPriceDecrement`: Decrease in price per block in TUSD tokens.
- `erc721TokenAddress`: The contract address of the ERC-721 token (NFT) being auctioned.
- `nftTokenId`: The token ID of the NFT being auctioned.
- `erc20TokenAddress`: The contract address of the ERC20 token (TUSD) used for bids.

### NFTDutchAuction_Upgradable Contract Methods

Initializes the auction with parameters. This replaces the constructor for upgradeable contracts.

```solidity
function initialize(
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement,
        address erc721TokenAddress,
        uint256 _nftTokenId,
        address erc20TokenAddress
) public initializer 
```


Place a bid; must be greater than or equal to the current price. Bidders must approve the contract to spend TUSD tokens on their behalf before bidding.

```solidity
function bid(uint bidAmount) public payable isOpenning returns (address)
```

Returns the current price of the NFT based on the elapsed blocks since the start of the auction.

```solidity
function currentPrice() public view returns (uint256)
```

Finalizes the auction by transferring the final auction price in TUSD to the seller, marking the auction as ended, and transferring the NFT to the winning bidder. This function is called internally once a winning bid is found.

```solidity
function finalize(uint256 finalAuctionPrice) internal
```

Internal method used for upgrade authorization. Only the owner can authorize upgrades.
```solidity
function _authorizeUpgrade(address) internal override onlyOwner {}
```

### TUSDFaucet Contract methods

Mint TUSD tokens to the specified address.

```solidity
function mint(address to, uint256 amount) public
```

Approve the spender to spend value tokens from holder's balance using an EIP-712 signed message. The approval is valid until the deadline.

```solidity
function permit(address holder, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public virtual override
```


## Introduction of the UI: Dutch Auction Dapp developed with hardhat, ethers and react using typescript and web3-react

This frontend UI is built on top of [ChainShot](https://www.chainshot.com)'s [How to Build a React Dapp with Hardhat and MetaMask](https://medium.com/p/9cec8f6410d3) Medium article.

### How to run the project locally

Install `yarn` globally
```shell
npm install --global yarn
```

Clone this repo into your local machine, 
```shell
git clone <repo>
```

Then cd into the project directory and run the following commands to get setup and running.
```shell
yarn
yarn hardhat compile
yarn hardhat node
```
The commands above will install the project dependencies, compile the sample contract and run a local Hardhat node on port `8545`, using chain id `31337`.

After running the local node, checkout to frontend directory, fowllow the commands. You will be abale to open the frontend at `http://localhost:3000/` in your browser and interact with the Duction Auction Dapp
```shell
yarn install
yarn start
```


Some other hardhat tasks to try out are:

```shell
yarn hardhat accounts
yarn hardhat clean
yarn hardhat deploy
yarn hardhat help
yarn hardhat node
yarn hardhat test
```

### Deploying to a live network
Here we deploy the contract on the Ethereum Sepolia testnet using the following command.
```shell
yarn hardhat run scripts/deploy.ts --network sepolia
```

### IPFS Host
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


## License
This project is licensed under the terms of the MIT License. See LICENSE file for details.