'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  Code2,
  FolderOpen,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Image as ImageIcon,
  Leaf,
  MessageCircle,
  Plus,
  Search,
  Users,
  Vault,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { CampaignCard } from '@/components/CampaignCard'
import { CampaignDetailModal } from '@/components/CampaignDetailModal'
import { CreateProposalModal } from '@/components/CreateProposalModal'
import { DonationCart, type DonationCartItem } from '@/components/DonationCart'
import { DonateModal } from '@/components/DonateModal'
import { Toasts, type ToastState } from '@/components/Toast'
import { appChain } from '@/config/wagmi'
import { useCrowdfunding, type UiCampaign } from '@/hooks/useCrowdfunding'
import { formatEth, shortAddress } from '@/lib/format'

const categories = [
  { value: 'all', label: 'All', icon: FolderOpen },
  { value: 'technology', label: 'Technology', icon: Code2 },
  { value: 'community', label: 'Community', icon: Users },
  { value: 'environment', label: 'Environment', icon: Leaf },
  { value: 'arts', label: 'Arts', icon: ImageIcon },
  { value: 'health', label: 'Health', icon: HeartPulse },
  { value: 'education', label: 'Education', icon: GraduationCap },
] as const

type SortMode = 'trending' | 'newest' | 'mostFunded' | 'ending'

export default function Home() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const {
    addComment,
    campaigns,
    createProposal,
    donate,
    withdrawFunds,
    isError,
    isLoading,
    isTransactionLoading,
    error,
    lastConfirmation,
    lastError,
    refetch,
    isConfigured,
  } = useCrowdfunding()
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('trending')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<UiCampaign | null>(null)
  const [donateCampaign, setDonateCampaign] = useState<UiCampaign | null>(null)
  const [cartItems, setCartItems] = useState<DonationCartItem[]>([])
  const [toasts, setToasts] = useState<ToastState[]>([])
  const [mounted, setMounted] = useState(false)

  const notify = useCallback((message: string, type: ToastState['type'] = 'success') => {
    const id = Date.now()
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3800)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!lastConfirmation) return

    if (lastConfirmation.action === 'create') {
      notify('Proposal live on Base.', 'success')
    } else if (lastConfirmation.action === 'donate') {
      notify('Pledge confirmed on Base.', 'success')
    } else if (lastConfirmation.action === 'comment') {
      notify('Comment posted on Base.', 'success')
    } else if (lastConfirmation.action === 'withdraw') {
      notify('Funds withdrawn to creator wallet.', 'success')
    }

    setCreateOpen(false)
    setSelectedCampaign(null)
    setDonateCampaign(null)
  }, [lastConfirmation, notify])

  useEffect(() => {
    if (lastError) notify(lastError.message, 'error')
  }, [lastError, notify])

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = campaigns.filter((campaign) => {
      if (activeFilter !== 'all' && campaign.category !== activeFilter) return false
      if (!query) return true
      return (
        campaign.title.toLowerCase().includes(query) ||
        campaign.shortDescription.toLowerCase().includes(query) ||
        campaign.description.toLowerCase().includes(query) ||
        campaign.creator.toLowerCase().includes(query)
      )
    })

    switch (sort) {
      case 'newest':
        return result.sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
      case 'mostFunded':
        return result.sort((a, b) => b.percentFunded - a.percentFunded)
      case 'ending':
        return result.sort((a, b) => a.daysLeft - b.daysLeft)
      case 'trending':
      default:
        return result.sort((a, b) => b.backers / Math.max(b.daysLeft, 1) - a.backers / Math.max(a.daysLeft, 1))
    }
  }, [activeFilter, campaigns, search, sort])

  const totalRaised = useMemo(() => campaigns.reduce((sum, campaign) => sum + campaign.pledgedEth, 0), [campaigns])
  const totalBackers = useMemo(() => campaigns.reduce((sum, campaign) => sum + campaign.backers, 0), [campaigns])

  function connectWallet() {
    const baseConnector = connectors.find((connector) => connector.name.toLowerCase().includes('base'))
    connect({ connector: baseConnector ?? connectors[0], chainId: appChain.id })
  }

  function openCreate() {
    if (!isConnected) {
      notify('Connect your wallet first.', 'info')
      return
    }
    setCreateOpen(true)
  }

  function openDonate(campaign: UiCampaign) {
    setSelectedCampaign(null)
    setDonateCampaign(campaign)
  }

  function addToCart(campaign: UiCampaign) {
    if (cartItems.some((item) => item.campaign.idNumber === campaign.idNumber)) {
      notify('Campaign already in the donation cart.', 'info')
      return
    }
    setCartItems((current) => [...current, { campaign, amount: '0.005' }])
    notify('Added to batch donation cart.', 'success')
  }

  return (
    <>
      <Toasts toasts={toasts} />
      <header className="header-glass fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <a href="#" className="flex items-center gap-2.5 no-underline">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
                <Zap size={17} className="text-[var(--bg)]" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight text-[var(--fg)]">
                FundRaiser<span className="text-[var(--accent)]">DAO</span>
              </span>
            </a>
            <nav className="hidden items-center gap-1 md:flex">
              <a href="#campaigns-section" className="btn-ghost text-sm">
                Explore
              </a>
              <a href="#how-it-works" className="btn-ghost text-sm">
                How It Works
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {!mounted ? (
              <div className="btn-outline min-w-[132px] text-sm opacity-70" aria-hidden="true">
                <Wallet size={15} />
                Connecting...
              </div>
            ) : isConnected ? (
              <button className="btn-outline text-sm" onClick={() => disconnect()} type="button">
                <span className="wallet-dot" />
                {shortAddress(address)}
              </button>
            ) : (
              <button className="btn-outline text-sm" onClick={connectWallet} disabled={isConnecting || isReconnecting} type="button">
                <Wallet size={15} />
                {isConnecting || isReconnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
            <button className="btn-primary hidden text-sm sm:inline-flex" onClick={openCreate} type="button">
              <Plus size={15} /> Create Proposal
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section pb-20 pt-32 sm:pb-28 sm:pt-40">
          <div className="hero-grid" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <div className="network-strip mb-6">
                <span className="wallet-dot" /> Live on {appChain.name}
              </div>
              <h1 className="font-display mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--fg)] sm:text-5xl lg:text-6xl">
                Decentralized Fundraising
                <br />
                <span className="text-[var(--accent)]">for the People</span>
              </h1>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
                Launch proposals, rally community backing, and keep funding transparent with Base onchain contributions.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#campaigns-section" className="btn-primary px-6 py-3 text-base">
                  Explore Proposals
                </a>
                <button className="btn-outline px-6 py-3 text-base sm:hidden" onClick={openCreate} type="button">
                  <Plus size={16} /> Create Proposal
                </button>
              </div>
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-6 border-t border-[var(--border)] pt-10 sm:gap-10">
              <div>
                <div className="stat-value">{formatEth(totalRaised)} ETH</div>
                <div className="stat-label">Total Raised</div>
              </div>
              <div className="stat-divider hidden sm:block" />
              <div>
                <div className="stat-value">{campaigns.length}</div>
                <div className="stat-label">Active Proposals</div>
              </div>
              <div className="stat-divider hidden sm:block" />
              <div>
                <div className="stat-value">{totalBackers}</div>
                <div className="stat-label">Total Backers</div>
              </div>
            </div>
          </div>
        </section>

        <section id="campaigns-section" className="mx-auto max-w-7xl px-4 pb-4 pt-4 sm:px-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="search-wrap flex-1">
              <Search />
              <input className="form-input w-full" onChange={(event) => setSearch(event.target.value)} placeholder="Search proposals..." value={search} />
            </div>
            <div className="sort-wrap">
              <select className="sort-select" onChange={(event) => setSort(event.target.value as SortMode)} value={sort}>
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="mostFunded">Most Funded</option>
                <option value="ending">Ending Soon</option>
              </select>
              <ChevronDown className="sort-arrow" />
            </div>
          </div>

          <div className="filter-bar">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  className={`filter-pill ${activeFilter === category.value ? 'active' : ''}`}
                  key={category.value}
                  onClick={() => setActiveFilter(category.value)}
                  type="button"
                >
                  <Icon size={14} />
                  {category.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          {!isConfigured ? (
            <div className="setup-panel p-6">
              <div className="flex items-start gap-3">
                <X className="mt-1 flex-shrink-0 text-[var(--accent)]" size={18} />
                <div>
                  <h2 className="font-display mb-2 text-lg font-bold text-[var(--fg)]">Contract address required</h2>
                  <p className="text-sm leading-6 text-[var(--fg-2)]">
                    Deploy `contracts/src/FundRaiserDAO.sol`, then set `NEXT_PUBLIC_FUNDRAISER_ADDRESS` in `.env.local`.
                    The app will not show fake proposals.
                  </p>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="empty-state">
              <p className="font-display text-lg font-bold text-[var(--fg-2)]">Loading proposals from Base...</p>
            </div>
          ) : isError ? (
            <div className="empty-state">
              <p className="font-display text-lg font-bold text-[var(--fg-2)]">Failed to read proposals</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{error?.message}</p>
              <button className="btn-outline mt-4" onClick={() => refetch()} type="button">
                Retry
              </button>
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.idNumber}>
                  <CampaignCard campaign={campaign} onOpen={setSelectedCampaign} />
                  <button className="btn-outline mt-3 w-full" onClick={() => addToCart(campaign)} type="button">
                    Add to Batch Donation
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FolderOpen className="mx-auto mb-4 text-[var(--border)]" size={42} />
              <p className="text-lg font-bold text-[var(--fg-2)]">No proposals found</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {campaigns.length === 0 ? 'Create the first real onchain proposal.' : 'Try adjusting your search or filter criteria.'}
              </p>
              <button className="btn-primary mt-5" onClick={openCreate} type="button">
                <Plus size={16} /> Create Proposal
              </button>
            </div>
          )}
        </section>

        <section id="how-it-works" className="border-y border-[var(--border)] bg-[var(--bg-2)] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-14 text-center">
              <h2 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-[var(--fg)] sm:text-4xl">How It Works</h2>
              <p className="mx-auto max-w-lg text-base text-[var(--muted)]">Three simple steps to bring your idea to life with community backing</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="step-card">
                <div className="step-icon">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-display mb-2 text-lg font-bold text-[var(--fg)]">Create a Proposal</h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">Submit your fundraising proposal with a clear goal, timeline, description, and cover images.</p>
              </div>
              <div className="step-card">
                <div className="step-icon">
                  <HandHeart size={24} />
                </div>
                <h3 className="font-display mb-2 text-lg font-bold text-[var(--fg)]">Community Backing</h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">Supporters discover and back projects with transparent onchain contributions on Base.</p>
              </div>
              <div className="step-card">
                <div className="step-icon">
                  <Vault size={24} />
                </div>
                <h3 className="font-display mb-2 text-lg font-bold text-[var(--fg)]">Creator Withdrawals</h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">Campaign creators can withdraw once the goal is met or the campaign deadline has passed.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)]">
              <Zap size={13} className="text-[var(--bg)]" />
            </div>
            <span className="font-display text-sm font-bold text-[var(--fg-2)]">FundRaiserDAO</span>
          </div>
          <p className="text-xs text-[var(--muted)]">Built for the community. Open source. Onchain forever.</p>
          <div className="flex items-center gap-4 text-[var(--muted)]">
            <MessageCircle size={16} />
            <Code2 size={16} />
            <Users size={16} />
          </div>
        </div>
      </footer>

      <CreateProposalModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        createProposal={createProposal}
        isTransactionLoading={isTransactionLoading}
        notify={notify}
      />
      <CampaignDetailModal
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onDonate={openDonate}
        addComment={addComment}
        withdrawFunds={withdrawFunds}
        isTransactionLoading={isTransactionLoading}
        notify={notify}
      />
      <DonateModal
        campaign={donateCampaign}
        onClose={() => setDonateCampaign(null)}
        donate={donate}
        isTransactionLoading={isTransactionLoading}
        notify={notify}
      />
      <DonationCart items={cartItems} setItems={setCartItems} onSuccess={() => refetch()} notify={notify} />
    </>
  )
}
