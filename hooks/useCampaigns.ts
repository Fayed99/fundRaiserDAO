'use client'

import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CROWDFUNDING_ADDRESS, crowdfundingAbi, isFundraiserConfigured } from '@/config/contracts'
import { appChain } from '@/config/wagmi'
import type { Campaign } from '@/types/campaign'

export type UiCampaign = Campaign & {
  idNumber: number
  goalEth: number
  pledgedEth: number
  daysLeft: number
  percentFunded: number
  coverImage: string
}

export function useCampaigns() {
  const { data, isLoading, isError, error, refetch, isFetching } = useReadContract({
    address: CROWDFUNDING_ADDRESS,
    abi: crowdfundingAbi,
    functionName: 'getCampaigns',
    chainId: appChain.id,
    query: {
      enabled: isFundraiserConfigured,
      refetchInterval: 12_000,
    },
  })

  const campaigns = useMemo<UiCampaign[]>(() => {
    if (!data) return []

    return [...data].reverse().map((campaign) => {
      const goalEth = Number(formatEther(campaign.goal))
      const pledgedEth = Number(formatEther(campaign.pledged))
      const deadlineSeconds = Number(campaign.deadline)
      const daysLeft = Math.max(Math.ceil((deadlineSeconds * 1000 - Date.now()) / 86_400_000), 0)
      const percentFunded = goalEth > 0 ? Math.min(Math.round((pledgedEth / goalEth) * 100), 100) : 0
      const idNumber = Number(campaign.id)

      return {
        ...campaign,
        idNumber,
        goalEth,
        pledgedEth,
        daysLeft,
        percentFunded,
        coverImage: campaign.images[0] || `https://picsum.photos/seed/fundraiser-${idNumber}/600/400`,
      }
    })
  }, [data])

  return {
    campaigns,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isConfigured: isFundraiserConfigured,
  }
}
