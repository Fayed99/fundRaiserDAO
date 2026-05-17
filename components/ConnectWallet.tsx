'use client'

import { LogOut, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { appChain } from '@/config/wagmi'

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect, connectors, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="h-11 w-full max-w-md animate-pulse rounded-lg border border-[var(--border)] bg-[var(--panel)]"
        aria-hidden="true"
      />
    )
  }

  if (isReconnecting) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold text-[var(--fg-2)]">
        Reconnecting wallet...
      </div>
    )
  }

  if (!isConnected) {
    function connectFresh(connector: (typeof connectors)[number]) {
      disconnect()
      window.setTimeout(() => {
        connect({ connector, chainId: appChain.id })
      }, 100)
    }

    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {connectors.map((connector) => (
            <button
              className="btn-outline"
              key={connector.uid}
              onClick={() => connectFresh(connector)}
              disabled={isConnecting}
              type="button"
            >
              <Wallet size={16} />
              {isConnecting ? 'Connecting...' : `Connect ${connector.name}`}
            </button>
          ))}
        </div>
        {error ? <p className="text-sm text-[var(--error)]">{error.message}</p> : null}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <span className="wallet-dot" />
      <span className="font-mono text-sm text-[var(--fg-2)]">{address ? shortAddress(address) : 'Connected'}</span>
      <button className="btn-ghost min-h-0 px-2 py-1" onClick={() => disconnect()} type="button">
        <LogOut size={15} />
        Disconnect
      </button>
    </div>
  )
}
