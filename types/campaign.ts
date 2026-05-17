import type { Address } from 'viem'

export type CategoryValue = 'all' | 'technology' | 'community' | 'environment' | 'arts' | 'health' | 'education'

export type Campaign = {
  id: bigint
  creator: Address
  title: string
  shortDescription: string
  description: string
  category: Exclude<CategoryValue, 'all'> | string
  images: readonly string[]
  goal: bigint
  pledged: bigint
  deadline: bigint | number
  createdAt: bigint | number
  backers: number
  commentCount: number
  updateCount: number
  withdrawn: boolean
}

export type CampaignComment = {
  author: Address
  message: string
  createdAt: bigint | number
}

export type CampaignUpdate = {
  message: string
  createdAt: bigint | number
}
