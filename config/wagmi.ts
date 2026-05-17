import { base, baseSepolia } from 'wagmi/chains'
import { createConfig, createStorage, cookieStorage, http } from 'wagmi'
import { coinbaseWallet, injected } from 'wagmi/connectors'

const configuredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? baseSepolia.id)

export const appChain = configuredChainId === base.id ? base : baseSepolia

export const config = createConfig({
  chains: [appChain],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'FundRaiserDAO',
      preference: 'all',
      version: '4',
    }),
  ],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'https://mainnet.base.org'),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? 'https://sepolia.base.org'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
