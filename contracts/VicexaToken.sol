// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Fixed-supply ERC-20 token created through the VICEXA factory.
/// @dev The full initial supply is minted once to the creator. There is no
///      owner role, additional mint function, tax, blacklist, or upgrade hook.
contract VicexaToken is ERC20 {
    uint8 private immutable _tokenDecimals;

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 initialSupply,
        address creator
    ) ERC20(tokenName, tokenSymbol) {
        require(creator != address(0), "Invalid creator");
        require(tokenDecimals <= 18, "Decimals above 18");
        require(initialSupply > 0, "Supply must be positive");

        _tokenDecimals = tokenDecimals;
        _mint(creator, initialSupply * (10 ** uint256(tokenDecimals)));
    }

    function decimals() public view override returns (uint8) {
        return _tokenDecimals;
    }
}
