// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VicexaToken} from "./VicexaToken.sol";

/// @title VICEXA Token Factory
/// @notice Permissionless factory for fixed-supply ERC-20 tokens on Base.
/// @dev This contract is an initial implementation and must be tested and
///      independently reviewed before any Mainnet deployment.
contract VicexaTokenFactory {
    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply,
        uint8 decimals
    );

    function createToken(
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 initialSupply,
        uint8 tokenDecimals
    ) external returns (address tokenAddress) {
        require(bytes(tokenName).length > 0 && bytes(tokenName).length <= 48, "Invalid name");
        require(_isValidSymbol(tokenSymbol), "Invalid symbol");
        require(initialSupply > 0, "Supply must be positive");
        require(tokenDecimals <= 18, "Decimals above 18");

        VicexaToken token = new VicexaToken(
            tokenName,
            tokenSymbol,
            tokenDecimals,
            initialSupply,
            msg.sender
        );

        tokenAddress = address(token);
        emit TokenCreated(
            tokenAddress,
            msg.sender,
            tokenName,
            tokenSymbol,
            initialSupply,
            tokenDecimals
        );
    }

    function _isValidSymbol(string calldata value) private pure returns (bool) {
        bytes calldata symbolBytes = bytes(value);
        if (symbolBytes.length < 2 || symbolBytes.length > 10) return false;

        for (uint256 i = 0; i < symbolBytes.length; i++) {
            bytes1 char = symbolBytes[i];
            bool isUppercase = char >= 0x41 && char <= 0x5A;
            bool isNumber = char >= 0x30 && char <= 0x39;
            if (!isUppercase && !isNumber) return false;
        }
        return true;
    }
}
