'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { parseEther } from 'viem'
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { readContractQueryOptions } from 'wagmi/query'
import { CROWDFUNDING_ADDRESS, crowdfundingAbi, isFundraiserConfigured } from '@/config/contracts'
import { appChain, config } from '@/config/wagmi'
import { useCampaigns, type UiCampaign } from './useCampaigns'

export type CrowdfundingAction = 'create' | 'donate' | 'comment' | 'withdraw'

export type CrowdfundingConfirmation = {
  id: number
  action: CrowdfundingAction
  campaignId?: bigint
}

export type CreateProposalInput = {
  title: string
  shortDescription: string
  description: string
  category: string
  images: string[]
  goal: string
  duration: string
}

type PendingAction = {
  action: CrowdfundingAction
  campaignId?: bigint
}

const campaignQueryKey = readContractQueryOptions(config, {
  address: CROWDFUNDING_ADDRESS,
  abi: crowdfundingAbi,
  functionName: 'getCampaigns',
  chainId: appChain.id,
}).queryKey

export function useCrowdfunding() {
  const queryClient = useQueryClient()
  const campaignRead = useCampaigns()
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [lastConfirmation, setLastConfirmation] = useState<CrowdfundingConfirmation | null>(null)
  const [lastError, setLastError] = useState<{ id: number; message: string } | null>(null)
  const { data: hash, error, isPending: isSigning, reset, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!isConfirmed || !pendingAction) return

    queryClient.invalidateQueries({ queryKey: campaignQueryKey })
    setLastConfirmation({
      id: Date.now(),
      action: pendingAction.action,
      campaignId: pendingAction.campaignId,
    })
    setPendingAction(null)
    reset()
  }, [isConfirmed, pendingAction, queryClient, reset])

  useEffect(() => {
    if (!error) return

    setLastError({ id: Date.now(), message: error.message })
    setPendingAction(null)
    reset()
  }, [error, reset])

  const ensureWritable = useCallback(() => {
    if (!isFundraiserConfigured) return 'Set NEXT_PUBLIC_FUNDRAISER_ADDRESS before sending transactions.'
    if (!isConnected) return 'Connect your wallet first.'
    if (chainId !== appChain.id) {
      switchChain({ chainId: appChain.id })
      return `Switch to ${appChain.name} in your wallet.`
    }
    return null
  }, [chainId, isConnected, switchChain])

  const createProposal = useCallback(
    (input: CreateProposalInput) => {
      const issue = ensureWritable()
      if (issue) return issue

      setPendingAction({ action: 'create' })
      writeContract({
        address: CROWDFUNDING_ADDRESS,
        abi: crowdfundingAbi,
        functionName: 'createCampaign',
        args: [
          input.title,
          input.shortDescription,
          input.description,
          input.category,
          input.images,
          parseEther(input.goal),
          BigInt(input.duration),
        ],
        chainId: appChain.id,
      })
      return null
    },
    [ensureWritable, writeContract],
  )

  const donate = useCallback(
    (campaignId: bigint, amount: string, comment?: string) => {
      const issue = ensureWritable()
      if (issue) return issue

      const message = comment?.trim()
      setPendingAction({ action: 'donate', campaignId })
      writeContract({
        address: CROWDFUNDING_ADDRESS,
        abi: crowdfundingAbi,
        functionName: message ? 'pledgeWithComment' : 'pledge',
        args: message ? [campaignId, message] : [campaignId],
        value: parseEther(amount),
        chainId: appChain.id,
      })
      return null
    },
    [ensureWritable, writeContract],
  )

  const addComment = useCallback(
    (campaignId: bigint, message: string) => {
      const issue = ensureWritable()
      if (issue) return issue

      setPendingAction({ action: 'comment', campaignId })
      writeContract({
        address: CROWDFUNDING_ADDRESS,
        abi: crowdfundingAbi,
        functionName: 'addComment',
        args: [campaignId, message],
        chainId: appChain.id,
      })
      return null
    },
    [ensureWritable, writeContract],
  )

  const withdrawFunds = useCallback(
    (campaignId: bigint) => {
      const issue = ensureWritable()
      if (issue) return issue

      setPendingAction({ action: 'withdraw', campaignId })
      writeContract({
        address: CROWDFUNDING_ADDRESS,
        abi: crowdfundingAbi,
        functionName: 'withdraw',
        args: [campaignId],
        chainId: appChain.id,
      })
      return null
    },
    [ensureWritable, writeContract],
  )

  const isTransactionLoading = isSigning || isConfirming || isSwitchingChain

  return useMemo(
    () => ({
      ...campaignRead,
      addComment,
      createProposal,
      donate,
      withdrawFunds,
      isConfirming,
      isSigning,
      isSwitchingChain,
      isTransactionLoading,
      lastConfirmation,
      lastError,
      pendingAction,
    }),
    [
      addComment,
      campaignRead,
      createProposal,
      donate,
      withdrawFunds,
      isConfirming,
      isSigning,
      isSwitchingChain,
      isTransactionLoading,
      lastConfirmation,
      lastError,
      pendingAction,
    ],
  )
}

export type { UiCampaign }
