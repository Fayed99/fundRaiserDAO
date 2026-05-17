'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { cookieToInitialState, WagmiProvider } from 'wagmi'
import { config } from '@/config/wagmi'

export function Providers({ children, cookie }: { children: ReactNode; cookie?: string }) {
  const [queryClient] = useState(() => new QueryClient())
  const initialState = cookieToInitialState(config, cookie)

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
