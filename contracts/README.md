# VICEXA Token Factory Contracts

## Contracts

- `VicexaToken.sol`: fixed-supply ERC-20 token. The creator receives the full initial supply at deployment. There is no owner role, extra mint function, transfer tax, blacklist, or upgrade mechanism.
- `VicexaTokenFactory.sol`: permissionless factory. Any wallet can create a token and the factory emits `TokenCreated`.

## Parameters

- Token name: 1–48 bytes.
- Token symbol: 2–10 uppercase letters or digits.
- Initial supply: whole-token amount, greater than zero.
- Decimals: 0–18.
- The token contract scales the whole-token amount by `10 ** decimals` and mints the result to the creator.

## Compile and test

The contracts use Solidity 0.8.24 and OpenZeppelin Contracts 5.x.

```bash
npm install
npm run test:contracts
```

In Remix, import both Solidity files while preserving their relative `contracts/` paths, resolve `@openzeppelin/contracts`, select compiler 0.8.24 or a compatible 0.8.x compiler, and compile `VicexaTokenFactory.sol`.

## Deploy to Base Sepolia

The repository includes a Hardhat configuration and a guarded deployment script. The script checks the connected chain ID and refuses to deploy unless it is Base Sepolia (84532).

For a local deployment environment:

1. Copy `.env.example` to `.env`.
2. Set `DEPLOYER_PRIVATE_KEY` locally for a dedicated test wallet. Never commit this value or share it.
3. Ensure the wallet has Base Sepolia test ETH.
4. Run `npm run deploy:sepolia`.
5. Save the factory address printed by the script and verify the deployment on [Base Sepolia BaseScan](https://sepolia.basescan.org/).

After deployment, add `VITE_BASE_SEPOLIA_FACTORY_ADDRESS` to Cloudflare Pages and redeploy the site. This variable is a public contract address, not a secret.

## Deployment safety

These source files are an initial implementation, not an audited release. Do not deploy to Base Mainnet yet. First pass automated compilation and tests, test token creation and transfers on Base Sepolia, verify factory event data and supply scaling, review deployment bytecode and gas costs, and obtain an independent smart-contract security review.
