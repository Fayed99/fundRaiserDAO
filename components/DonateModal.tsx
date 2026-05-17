'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { UiCampaign } from '@/hooks/useCampaigns'
import { formatEth } from '@/lib/format'

type DonateModalProps = {
  campaign: UiCampaign | null
  onClose: () => void
  donate: (campaignId: bigint, amount: string, comment?: string) => string | null
  isTransactionLoading: boolean
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
}

const presets = ['0.001', '0.005', '0.01', '0.05', '0.1']

export function DonateModal({ campaign, onClose, donate, isTransactionLoading, notify }: DonateModalProps) {
  const [amount, setAmount] = useState('0.005')
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (campaign) {
      setAmount('0.005')
      setComment('')
    }
  }, [campaign])

  if (!campaign) return null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!campaign) return
    if (isTransactionLoading) return
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      notify('Enter a valid pledge amount.', 'error')
      return
    }
    const message = comment.trim()
    if (message.length > 500) {
      notify('Comment must be 500 characters or less.', 'error')
      return
    }

    const issue = donate(campaign.id, amount, message)
    if (issue) notify(issue, 'info')
  }

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-content max-w-md p-6 sm:p-8" role="dialog" aria-modal="true" aria-label="Make a donation">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[var(--fg)]">Back This Project</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close" type="button">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 border-b border-[var(--border)] pb-5">
          <img src={campaign.coverImage} alt={campaign.title} className="h-14 w-14 rounded-lg object-cover" />
          <div>
            <p className="font-display text-sm font-bold text-[var(--fg)]">{campaign.title}</p>
            <p className="text-xs text-[var(--muted)]">
              {formatEth(campaign.pledgedEth)} ETH raised of {formatEth(campaign.goalEth)} ETH
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <p className="mb-3 text-xs text-[var(--muted)]">Select an amount</p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button className={`amount-btn ${amount === preset ? 'selected' : ''}`} key={preset} onClick={() => setAmount(preset)} type="button">
                {preset} ETH
              </button>
            ))}
          </div>

          <div className="mb-5">
            <label className="form-label" htmlFor="custom-amount">
              Custom amount
            </label>
            <input
              className="form-input"
              id="custom-amount"
              min="0"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.02"
              step="0.0001"
              type="number"
              value={amount}
            />
          </div>

          <div className="mb-5">
            <label className="form-label" htmlFor="pledge-comment">
              Optional comment
            </label>
            <textarea
              className="form-input"
              id="pledge-comment"
              onChange={(event) => setComment(event.target.value)}
              placeholder="Leave a note with your pledge"
              rows={3}
              value={comment}
            />
          </div>

          <div className="mb-5 flex items-center justify-between border-y border-[var(--border)] py-4">
            <span className="text-sm text-[var(--muted)]">Your pledge</span>
            <span className="font-display text-xl font-extrabold text-[var(--accent)]">{amount || '0'} ETH</span>
          </div>

          <button className="btn-primary w-full py-3 text-base" disabled={isTransactionLoading} type="submit">
            <Check size={17} />
            {isTransactionLoading ? 'Processing...' : 'Confirm Pledge'}
          </button>
        </form>
      </div>
    </div>
  )
}
