// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract TUSDFaucet is ERC20, ERC20Permit {
    constructor() ERC20("Test USD", "TUSD") ERC20Permit("Test USD") {
        _mint(msg.sender, 10_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}