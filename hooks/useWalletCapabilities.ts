'use client'

import { useMemo } from 'react'
import { useCapabilities } from 'wagmi'
import { appChain } from '@/config/wagmi'

const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL

export function useWalletCapabilities() {
  const { data: capabilities } = useCapabilities()

  const supportsBatching = useMemo(() => {
    const atomic = capabilities?.[appChain.id]?.atomic
    return atomic?.status === 'ready' || atomic?.status === 'supported'
  }, [capabilities])

  const supportsPaymaster = useMemo(() => {
    return capabilities?.[appChain.id]?.paymasterService?.supported === true
  }, [capabilities])

  const paymasterCapabilities = useMemo(() => {
    if (!supportsPaymaster || !paymasterUrl) {
      return undefined
    }

    return {
      paymasterService: {
        url: paymasterUrl,
        optional: true,
      },
    } as const
  }, [supportsPaymaster])

  return { supportsBatching, supportsPaymaster, paymasterCapabilities }
}
