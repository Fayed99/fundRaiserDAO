'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle, Send, X } from 'lucide-react'
import { formatEther, parseEther } from 'viem'
import { useAccount, useChainId, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CROWDFUNDING_ADDRESS, crowdfundingAbi } from '@/config/contracts'
import { appChain } from '@/config/wagmi'
import type { UiCampaign } from '@/hooks/useCampaigns'
import { categoryLabel, formatEth, relativeTime, shortAddress } from '@/lib/format'

type CampaignDetailModalProps = {
  campaign: UiCampaign | null
  onClose: () => void
  onDonate: (campaign: UiCampaign) => void
  onSuccess: () => void
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function CampaignDetailModal({ campaign, onClose, onDonate, onSuccess, notify }: CampaignDetailModalProps) {
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [comment, setComment] = useState('')
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const { data: comments, refetch: refetchComments } = useReadContract({
    address: CROWDFUNDING_ADDRESS,
    abi: crowdfundingAbi,
    functionName: 'getComments',
    args: campaign ? [campaign.id] : undefined,
    chainId: appChain.id,
    query: { enabled: Boolean(campaign) },
  })

  const { data: updates, refetch: refetchUpdates } = useReadContract({
    address: CROWDFUNDING_ADDRESS,
    abi: crowdfundingAbi,
    functionName: 'getUpdates',
    args: campaign ? [campaign.id] : undefined,
    chainId: appChain.id,
    query: { enabled: Boolean(campaign) },
  })

  useEffect(() => {
    setGalleryIndex(0)
    setComment('')
  }, [campaign?.id])

  useEffect(() => {
    if (isSuccess) {
      notify('Comment posted on Base.', 'success')
      setComment('')
      refetchComments()
      refetchUpdates()
      onSuccess()
    }
  }, [isSuccess, notify, onSuccess, refetchComments, refetchUpdates])

  useEffect(() => {
    if (error) notify(error.message, 'error')
  }, [error, notify])

  const averagePledge = useMemo(() => {
    if (!campaign || campaign.backers === 0) return 0
    return Number(formatEther(campaign.pledged / BigInt(campaign.backers)))
  }, [campaign])

  if (!campaign) return null

  const images = campaign.images.length > 0 ? [...campaign.images] : [campaign.coverImage]
  const image = images[galleryIndex] || campaign.coverImage
  const urgent = campaign.daysLeft <= 7

  function handleComment(event: FormEvent) {
    event.preventDefault()
    if (!campaign) return
    if (!isConnected) {
      notify('Connect your wallet to comment.', 'info')
      return
    }
    if (chainId !== appChain.id) {
      switchChain({ chainId: appChain.id })
      return
    }
    const message = comment.trim()
    if (!message) {
      notify('Write a comment first.', 'error')
      return
    }
    if (message.length > 500) {
      notify('Comment must be 500 characters or less.', 'error')
      return
    }
    writeContract({
      address: CROWDFUNDING_ADDRESS,
      abi: crowdfundingAbi,
      functionName: 'addComment',
      args: [campaign.id, message],
      chainId: appChain.id,
    })
  }

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-content max-w-2xl" role="dialog" aria-modal="true" aria-label="Campaign details">
        <div className="relative">
          <div className="gallery-viewport">
            <img src={image} alt={campaign.title} className="h-full w-full object-cover" />
            {images.length > 1 ? (
              <>
                <button
                  className="gallery-nav prev"
                  onClick={() => setGalleryIndex((index) => (index - 1 + images.length) % images.length)}
                  type="button"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="gallery-nav next"
                  onClick={() => setGalleryIndex((index) => (index + 1) % images.length)}
                  type="button"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="gallery-counter">
                  {galleryIndex + 1} / {images.length}
                </div>
              </>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="gallery-thumbs">
              {images.map((thumb, index) => (
                <button
                  className={`gallery-thumb ${index === galleryIndex ? 'active' : ''}`}
                  key={thumb}
                  onClick={() => setGalleryIndex(index)}
                  type="button"
                >
                  <img src={thumb} alt={`Thumbnail ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
          <button className="absolute right-4 top-4 z-10 rounded-full bg-black/70 p-2 text-[var(--fg)]" onClick={onClose} type="button" aria-label="Close">
            <X size={18} />
          </button>
          <span className="card-badge left-4 top-4">{categoryLabel(campaign.category)}</span>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="font-display mb-4 text-2xl font-extrabold tracking-tight text-[var(--fg)] sm:text-3xl">{campaign.title}</h2>
          <div className="mb-6 flex items-center gap-3">
            <div className="comment-avatar font-mono text-[10px]">{shortAddress(campaign.creator).slice(2, 4)}</div>
            <div>
              <p className="text-sm font-bold text-[var(--fg-2)]">{shortAddress(campaign.creator)}</p>
              <p className="text-xs text-[var(--muted)]">Proposal Creator</p>
            </div>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-[var(--fg-2)]">{campaign.description}</p>

          <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <span className="font-display text-2xl font-extrabold text-[var(--fg)]">{formatEth(campaign.pledgedEth)} ETH</span>
                <span className="ml-1 text-sm text-[var(--muted)]">of {formatEth(campaign.goalEth)} ETH</span>
              </div>
              <span className="font-display text-xl font-extrabold text-[var(--accent)]">{campaign.percentFunded}%</span>
            </div>
            <div className="progress-track mb-4 h-2">
              <div className="progress-fill" style={{ width: `${campaign.percentFunded}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-display font-bold text-[var(--fg)]">{campaign.backers}</p>
                <p className="text-xs text-[var(--muted)]">Backers</p>
              </div>
              <div>
                <p className={`font-display font-bold ${urgent ? 'text-[var(--error)]' : 'text-[var(--fg)]'}`}>{campaign.daysLeft}</p>
                <p className="text-xs text-[var(--muted)]">Days Left</p>
              </div>
              <div>
                <p className="font-display font-bold text-[var(--fg)]">{formatEth(averagePledge)} ETH</p>
                <p className="text-xs text-[var(--muted)]">Avg. Pledge</p>
              </div>
            </div>
          </div>

          <button className="btn-primary mb-6 w-full py-3 text-base" onClick={() => onDonate(campaign)} type="button">
            Back This Project
          </button>

          <div className="mb-6">
            <h3 className="font-display mb-3 text-base font-bold text-[var(--fg)]">Updates</h3>
            {updates && updates.length > 0 ? (
              <div>
                {[...updates].reverse().map((update, index) => (
                  <div className="flex gap-3 border-b border-[var(--border)] py-3" key={`${update.createdAt}-${index}`}>
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                    <div>
                      <p className="text-sm text-[var(--fg-2)]">{update.message}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{relativeTime(update.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">No updates yet.</p>
            )}
          </div>

          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="font-display mb-4 flex items-center gap-2 text-base font-bold text-[var(--fg)]">
              <MessageCircle size={17} className="text-[var(--accent)]" />
              Discussion <span className="text-sm font-normal text-[var(--muted)]">({comments?.length ?? campaign.commentCount})</span>
            </h3>

            {isConnected ? (
              <form className="comment-input-wrap" onSubmit={handleComment}>
                <div className="comment-avatar">You</div>
                <textarea
                  className="form-input"
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share your thoughts on this proposal..."
                  rows={1}
                  value={comment}
                />
                <button className="comment-send" disabled={isPending || isConfirming || isSwitching} type="submit" aria-label="Send comment">
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-center text-sm text-[var(--muted)]">
                Connect your wallet to comment.
              </p>
            )}

            <div className="mt-4">
              {comments && comments.length > 0 ? (
                [...comments].reverse().map((item, index) => (
                  <div className="comment-item" key={`${item.author}-${item.createdAt}-${index}`}>
                    <div className="comment-avatar font-mono text-[10px]">{shortAddress(item.author).slice(2, 4)}</div>
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author">{shortAddress(item.author)}</span>
                        <span className="comment-time">{relativeTime(item.createdAt)}</span>
                      </div>
                      <p className="comment-text">{item.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-sm text-[var(--muted)]">No comments yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
