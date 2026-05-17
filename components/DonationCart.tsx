'use client'

import { useEffect, useMemo, useState } from 'react'
import { Layers, ShoppingBasket, X } from 'lucide-react'
import { encodeFunctionData, parseEther } from 'viem'
import { useAccount, useChainId, useSendCalls, useSwitchChain, useWaitForCallsStatus } from 'wagmi'
import { CROWDFUNDING_ADDRESS, crowdfundingAbi } from '@/config/contracts'
import { appChain } from '@/config/wagmi'
import { useWalletCapabilities } from '@/hooks/useWalletCapabilities'
import type { UiCampaign } from '@/hooks/useCampaigns'
import { formatEth } from '@/lib/format'

export type DonationCartItem = {
  campaign: UiCampaign
  amount: string
}

type DonationCartProps = {
  items: DonationCartItem[]
  setItems: (items: DonationCartItem[]) => void
  onSuccess: () => void
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function DonationCart({ items, setItems, onSuccess, notify }: DonationCartProps) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { supportsBatching, supportsPaymaster, paymasterCapabilities } = useWalletCapabilities()
  const { data, error, isPending, sendCalls } = useSendCalls()
  const { isLoading: isConfirming, isSuccess } = useWaitForCallsStatus({ id: data?.id })
  const [open, setOpen] = useState(false)

  const total = useMemo(() => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [items])

  useEffect(() => {
    if (items.length === 0) setOpen(false)
  }, [items.length])

  useEffect(() => {
    if (isSuccess) {
      notify('Batch donations confirmed on Base.', 'success')
      setItems([])
      onSuccess()
    }
  }, [isSuccess, notify, onSuccess, setItems])

  useEffect(() => {
    if (error) notify(error.message, 'error')
  }, [error, notify])

  function updateAmount(id: number, amount: string) {
    setItems(items.map((item) => (item.campaign.idNumber === id ? { ...item, amount } : item)))
  }

  function remove(id: number) {
    setItems(items.filter((item) => item.campaign.idNumber !== id))
  }

  function sendBatch() {
    if (!isConnected) {
      notify('Connect your wallet first.', 'info')
      return
    }
    if (!supportsBatching) {
      notify('Your wallet does not support atomic batch donations.', 'error')
      return
    }
    if (chainId !== appChain.id) {
      switchChain({ chainId: appChain.id })
      return
    }
    if (items.length === 0) return

    const calls = items.map((item) => ({
      to: CROWDFUNDING_ADDRESS,
      data: encodeFunctionData({
        abi: crowdfundingAbi,
        functionName: 'pledge',
        args: [item.campaign.id],
      }),
      value: parseEther(item.amount || '0'),
    }))

    if (calls.some((call) => call.value <= BigInt(0))) {
      notify('Every cart item needs a valid amount.', 'error')
      return
    }

    sendCalls({
      calls,
      chainId: appChain.id,
      capabilities: paymasterCapabilities,
    })
  }

  return (
    <>
      {items.length > 0 ? (
        <button className="btn-primary fixed bottom-6 left-6 z-40 shadow-2xl shadow-black/40" onClick={() => setOpen(true)} type="button">
          <ShoppingBasket size={17} />
          Donation Cart ({items.length})
        </button>
      ) : null}

      {open ? (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && setOpen(false)}>
          <div className="modal-content max-w-lg p-6 sm:p-8" role="dialog" aria-modal="true" aria-label="Donation cart">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--fg)]">Batch Donations</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {supportsBatching
                    ? `One wallet confirmation for ${items.length} pledge${items.length === 1 ? '' : 's'}.`
                    : 'Connect a smart wallet with batch support to use this flow.'}
                </p>
              </div>
              <button className="btn-ghost" onClick={() => setOpen(false)} aria-label="Close" type="button">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3" key={item.campaign.idNumber}>
                  <div className="mb-3 flex items-center gap-3">
                    <img src={item.campaign.coverImage} alt={item.campaign.title} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-bold text-[var(--fg)]">{item.campaign.title}</p>
                      <p className="text-xs text-[var(--muted)]">{formatEth(item.campaign.pledgedEth)} ETH raised</p>
                    </div>
                    <button className="btn-icon h-8 w-8" onClick={() => remove(item.campaign.idNumber)} type="button" aria-label="Remove">
                      <X size={15} />
                    </button>
                  </div>
                  <input
                    className="form-input"
                    min="0"
                    onChange={(event) => updateAmount(item.campaign.idNumber, event.target.value)}
                    step="0.0001"
                    type="number"
                    value={item.amount}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Total pledge</span>
                <span className="font-display text-xl font-extrabold text-[var(--accent)]">{formatEth(total)} ETH</span>
              </div>
              {supportsPaymaster ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Paymaster support detected{paymasterCapabilities ? ' and configured.' : ', but NEXT_PUBLIC_PAYMASTER_URL is not set.'}
                </p>
              ) : null}
            </div>

            <button className="btn-primary mt-6 w-full py-3 text-base" disabled={!supportsBatching || isPending || isConfirming || isSwitching} onClick={sendBatch} type="button">
              <Layers size={17} />
              {chainId !== appChain.id
                ? isSwitching
                  ? 'Switching...'
                  : `Switch to ${appChain.name}`
                : isPending
                  ? 'Confirm Batch...'
                  : isConfirming
                    ? 'Confirming on Base...'
                    : 'Send Batch Donation'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
