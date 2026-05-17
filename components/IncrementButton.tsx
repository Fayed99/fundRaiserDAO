'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Plus } from 'lucide-react'
import { useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { readContractQueryOptions } from 'wagmi/query'
import { COUNTER_ADDRESS, counterAbi, isCounterConfigured } from '@/config/counter'
import { config, appChain } from '@/config/wagmi'

const counterQueryKey = readContractQueryOptions(config, {
  address: COUNTER_ADDRESS,
  abi: counterAbi,
  functionName: 'number',
  chainId: appChain.id,
}).queryKey

export function IncrementButton() {
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: counterQueryKey })
    }
  }, [isSuccess, queryClient])

  if (!isCounterConfigured) {
    return null
  }

  if (chainId !== appChain.id) {
    return (
      <button className="btn-primary" onClick={() => switchChain({ chainId: appChain.id })} type="button">
        {isSwitching ? 'Switching...' : `Switch to ${appChain.name}`}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        className="btn-primary"
        onClick={() =>
          writeContract({
            address: COUNTER_ADDRESS,
            abi: counterAbi,
            functionName: 'increment',
            chainId: appChain.id,
          })
        }
        disabled={isPending || isConfirming}
        type="button"
      >
        <Plus size={17} />
        {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Confirming...' : 'Increment'}
      </button>

      {isSuccess ? <p className="text-sm font-semibold text-[var(--success)]">Confirmed.</p> : null}
      {error ? <p className="max-w-md text-center text-sm text-[var(--error)]">{error.message}</p> : null}
      {hash ? (
        <a
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]"
          href={`${appChain.blockExplorers?.default.url}/tx/${hash}`}
          rel="noreferrer"
          target="_blank"
        >
          View transaction <ExternalLink size={14} />
        </a>
      ) : null}
    </div>
  )
}
