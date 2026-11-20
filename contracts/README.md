# VICEXA Token Factory Contracts

## Contracts

- `VicexaToken.sol`: fixed-supply ERC-20 token. The creator receives the full initial supply at deployment. There is no owner role, extra mint function, transfer tax, blacklist, or upgrade mechanism.
- `VicexaTokenFactory.sol`: permissionless factory. Any wallet can create a token and the factory emits `TokenCreated`.

## Parameters

- Token name: 1–48 bytes.
- Token symbol: 2–10 uppercase letters or digits.
- Initial supply: whole-token amount, greater than zero.
- Decimals: 0–18.
- The token contract scales the whole-token amount by `10 ** decimals` and mints the result to the caller.

## Compile

The contracts use Solidity 0.8.24 or newer and OpenZeppelin Contracts ERC-20 (5.x).

In Remix:
1. Create or import both Solidity files while preserving the `contracts/` folder relationship.
2. Install/resolve `@openzeppelin/contracts` through Remix's package import support.
3. Select compiler 0.8.24 or a compatible newer 0.8.x compiler.
4. Compile `VicexaTokenFactory.sol`.

## Deployment safety

These source files are an initial implementation, not an audited release. Do not deploy to Base Mainnet yet. First compile and test on Base Sepolia, test boundary cases and token transfers, verify factory event data, review deployment bytecode and gas costs, and obtain an independent smart-contract security review. The web interface intentionally does not call this contract yet.
