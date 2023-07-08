// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./NFTDutchAuction_Upgradable.sol";

contract NewImplementation is NFTDutchAuction_Upgradable {
    function getVersion() external pure returns (uint256) {
        return 2;
    }
}
