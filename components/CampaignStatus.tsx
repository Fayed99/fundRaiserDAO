'use client'

import { useCountdown } from '@/hooks/useCountdown'

type CampaignStatusProps = {
  deadline: bigint | number
  compact?: boolean
}

function twoDigits(value: number) {
  return String(value).padStart(2, '0')
}

export function CampaignStatus({ deadline, compact = false }: CampaignStatusProps) {
  const time = useCountdown(Number(deadline))

  if (!time) {
    return <span className="campaign-status muted">Calculating...</span>
  }

  if (time.totalSeconds <= 0) {
    return <span className="campaign-status ended">Campaign Ended</span>
  }

  if (time.totalSeconds < 86_400) {
    return (
      <span className={`campaign-status ending-soon ${compact ? 'compact' : ''}`}>
        <span className="campaign-status-label">Ending Soon</span>
        <span className="campaign-status-timer">
          {twoDigits(time.hours)}:{twoDigits(time.minutes)}:{twoDigits(time.seconds)}
        </span>
      </span>
    )
  }

  const daysLeft = Math.ceil(time.totalSeconds / 86_400)

  return (
    <span className={`campaign-status days ${compact ? 'compact' : ''}`}>
      <span className="campaign-status-value">{daysLeft}</span>
      <span className="campaign-status-label">Days Left</span>
    </span>
  )
}
