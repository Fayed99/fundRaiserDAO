'use client'

import { RefreshCw } from 'lucide-react'
import { useReadContract } from 'wagmi'
import { COUNTER_ADDRESS, counterAbi, isCounterConfigured } from '@/config/counter'
import { appChain } from '@/config/wagmi'

export function CounterDisplay() {
  const {
    data: count,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: COUNTER_ADDRESS,
    abi: counterAbi,
    functionName: 'number',
    chainId: appChain.id,
    query: {
      enabled: isCounterConfigured,
    },
  })

  if (!isCounterConfigured) {
    return (
      <div className="setup-panel w-full max-w-md p-5 text-sm">
        Set <code className="font-mono">NEXT_PUBLIC_COUNTER_ADDRESS</code> after deploying the Counter contract.
      </div>
    )
  }

  if (isLoading && count === undefined) {
    return <p className="text-sm font-semibold text-[var(--muted)]">Loading counter...</p>
  }

  if (isError && count === undefined) {
    return (
      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--error)]">Failed to read the counter contract.</p>
        <button className="btn-outline mt-3" onClick={() => refetch()} type="button">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Current Count</p>
      <p className="font-display mt-3 text-7xl font-extrabold text-[var(--fg)]">{count?.toString() ?? '0'}</p>
    </div>
  )
}
