'use client'

import { Clock, Image as ImageIcon, MessageCircle, Users } from 'lucide-react'
import type { UiCampaign } from '@/hooks/useCampaigns'
import { categoryLabel, formatEth, shortAddress } from '@/lib/format'

type CampaignCardProps = {
  campaign: UiCampaign
  onOpen: (campaign: UiCampaign) => void
}

export function CampaignCard({ campaign, onOpen }: CampaignCardProps) {
  const urgent = campaign.daysLeft <= 7

  return (
    <article className="campaign-card" onClick={() => onOpen(campaign)}>
      <div className="card-image">
        {campaign.coverImage ? (
          <img src={campaign.coverImage} alt={campaign.title} loading="lazy" />
        ) : (
          <div className="image-fallback">
            <ImageIcon size={32} />
          </div>
        )}
        <div className="card-image-overlay" />
        <span className="card-badge">{categoryLabel(campaign.category)}</span>
        {campaign.images.length > 1 ? (
          <span className="card-img-count">
            <ImageIcon size={12} className="inline-block" /> {campaign.images.length}
          </span>
        ) : null}
        {campaign.commentCount > 0 ? (
          <span className="card-comment-count">
            <MessageCircle size={12} className="inline-block" /> {campaign.commentCount}
          </span>
        ) : null}
        <span className={`card-days ${urgent ? 'urgent' : ''}`}>
          <Clock size={12} className="inline-block" /> {campaign.daysLeft} day{campaign.daysLeft === 1 ? '' : 's'} left
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-display mb-2 text-base font-bold leading-snug text-[var(--fg)]">{campaign.title}</h3>
        <p className="mb-4 text-xs text-[var(--muted)]">by {shortAddress(campaign.creator)}</p>
        <div className="progress-track mb-3">
          <div className="progress-fill" style={{ width: `${campaign.percentFunded}%` }} />
        </div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <span className="font-display text-lg font-bold text-[var(--fg)]">{formatEth(campaign.pledgedEth)} ETH</span>
            <span className="ml-1 text-xs text-[var(--muted)]">of {formatEth(campaign.goalEth)} ETH</span>
          </div>
          <span className="font-display text-sm font-bold text-[var(--accent)]">{campaign.percentFunded}%</span>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
          <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
            <Users size={13} /> {campaign.backers} backer{campaign.backers === 1 ? '' : 's'}
          </span>
          <span className="text-xs font-bold text-[var(--accent)]">View Details</span>
        </div>
      </div>
    </article>
  )
}
