'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Layers, Plus } from 'lucide-react'
import { encodeFunctionData } from 'viem'
import {
  useAccount,
  useChainId,
  useSendCalls,
  useSwitchChain,
  useWaitForCallsStatus,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { readContractQueryOptions } from 'wagmi/query'
import { COUNTER_ADDRESS, counterAbi, isCounterConfigured } from '@/config/counter'
import { config, appChain } from '@/config/wagmi'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'

const counterQueryKey = readContractQueryOptions(config, {
  address: COUNTER_ADDRESS,
  abi: counterAbi,
  functionName: 'number',
  chainId: appChain.id,
}).queryKey

export function BatchIncrement() {
  const { isConnected } = useAccount()
  const { supportsBatching } = useWalletCapabilities()

  if (!isCounterConfigured) {
    return null
  }

  if (!isConnected) {
    return <p className="text-sm font-semibold text-[var(--muted)]">Connect your wallet to write or batch transactions.</p>
  }

  return supportsBatching ? <BatchFlow /> : <SequentialFlow />
}

function BatchFlow() {
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { data, error, isPending, sendCalls } = useSendCalls()
  const { isLoading: isConfirming, isSuccess } = useWaitForCallsStatus({ id: data?.id })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: counterQueryKey })
    }
  }, [isSuccess, queryClient])

  if (chainId !== appChain.id) {
    return (
      <button className="btn-primary" onClick={() => switchChain({ chainId: appChain.id })} type="button">
        {isSwitching ? 'Switching...' : `Switch to ${appChain.name}`}
      </button>
    )
  }

  const incrementData = encodeFunctionData({
    abi: counterAbi,
    functionName: 'increment',
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-sm text-[var(--muted)]">
        Your wallet supports EIP-5792 atomic batching, so this sends two increments in one request.
      </p>
      <button
        className="btn-primary"
        onClick={() =>
          sendCalls({
            calls: [
              { to: COUNTER_ADDRESS, data: incrementData },
              { to: COUNTER_ADDRESS, data: incrementData },
            ],
            chainId: appChain.id,
          })
        }
        disabled={isPending || isConfirming}
        type="button"
      >
        <Layers size={17} />
        {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Confirming...' : 'Increment x2 Batch'}
      </button>
      {isSuccess ? <p className="text-sm font-semibold text-[var(--success)]">Batch confirmed.</p> : null}
      {error ? <p className="max-w-md text-center text-sm text-[var(--error)]">{error.message}</p> : null}
    </div>
  )
}

function SequentialFlow() {
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

  if (chainId !== appChain.id) {
    return (
      <button className="btn-primary" onClick={() => switchChain({ chainId: appChain.id })} type="button">
        {isSwitching ? 'Switching...' : `Switch to ${appChain.name}`}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-sm text-[var(--muted)]">
        This wallet does not advertise batch support, so the app falls back to a normal contract write.
      </p>
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
        {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Confirming...' : 'Increment Fallback'}
      </button>
      {isSuccess ? <p className="text-sm font-semibold text-[var(--success)]">Fallback write confirmed.</p> : null}
      {error ? <p className="max-w-md text-center text-sm text-[var(--error)]">{error.message}</p> : null}
    </div>
  )
}
