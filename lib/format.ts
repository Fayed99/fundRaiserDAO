import type { Address } from 'viem'

export function shortAddress(address?: Address | string) {
  if (!address) return '0x...'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatEth(value: number) {
  if (value === 0) return '0'
  if (value < 0.0001) return '<0.0001'
  if (value < 1) return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    technology: 'Technology',
    community: 'Community',
    environment: 'Environment',
    arts: 'Arts',
    health: 'Health',
    education: 'Education',
  }

  return labels[category] ?? category
}

export function relativeTime(timestamp: bigint | number) {
  const seconds = Number(timestamp)
  const diff = Math.max(Math.floor((Date.now() - seconds * 1000) / 1000), 0)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86_400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86_400)} day${Math.floor(diff / 86_400) === 1 ? '' : 's'} ago`
}
