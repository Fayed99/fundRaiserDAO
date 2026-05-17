# FundRaiserDAO

This project implements the Base quickstart foundation from `baseDocumentation.txt` and the FundRaiserDAO crowdfunding UI:

- Next.js App Router with Tailwind and TypeScript
- wagmi + viem configured for Base Sepolia
- injected wallet and Base Account connectors
- wallet connection, reconnect, connected, and disconnect states
- Crowd-funding contract reads/writes
- EIP-5792 batch donation path with a fallback write for wallets without batching

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Deploy The Contract

Use a fresh deployer key. Do not use a key that has been posted in chat or committed anywhere.

```bash
cd contracts
forge create ./src/FundRaiserDAO.sol:FundRaiserDAO \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Set the deployed address in `.env.local`:

```bash
NEXT_PUBLIC_FUNDRAISER_ADDRESS="0x..."
NEXT_PUBLIC_CHAIN_ID="84532"
```

Restart `npm run dev` after changing environment variables.

## Next Step

The UI is intended to match `DemoCode.txt` closely while keeping only real wallet, transaction, and proposal data paths.
