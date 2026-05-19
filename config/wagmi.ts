import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { baseAccount, coinbaseWallet, injected } from 'wagmi/connectors'

export const appChain = baseSepolia

export const config = createConfig({
  chains: [baseSepolia],
  multiInjectedProviderDiscovery: false,
  connectors: [
    baseAccount({
      appName: 'FundRaiserDAO',
    }),
    coinbaseWallet({
      appName: 'FundRaiserDAO',
      version: '4',
      preference: 'all',
    }),
    injected(),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
