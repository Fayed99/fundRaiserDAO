'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { parseEther } from 'viem'
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CROWDFUNDING_ADDRESS, crowdfundingAbi, isFundraiserConfigured } from '@/config/contracts'
import { appChain } from '@/config/wagmi'

type CreateProposalModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
}

const initialForm = {
  title: '',
  category: '',
  goal: '',
  duration: '30',
  shortDescription: '',
  description: '',
}

export function CreateProposalModal({ open, onClose, onSuccess, notify }: CreateProposalModalProps) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [formData, setFormData] = useState(initialForm)
  const [imageInput, setImageInput] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      notify('Proposal live on Base.', 'success')
      setFormData(initialForm)
      setImages([])
      setImageInput('')
      onSuccess()
      onClose()
    }
  }, [isSuccess, notify, onClose, onSuccess])

  useEffect(() => {
    if (error) {
      notify(error.message, 'error')
    }
  }, [error, notify])

  if (!open) return null

  function updateField(field: keyof typeof initialForm, value: string) {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function addImage() {
    const url = imageInput.trim()
    if (!url) {
      notify('Enter an image URL first.', 'error')
      return
    }
    if (images.length >= 6) {
      notify('Maximum 6 images allowed.', 'error')
      return
    }
    try {
      new URL(url)
    } catch {
      notify('Image must be a valid URL.', 'error')
      return
    }
    if (images.includes(url)) {
      notify('That image is already added.', 'info')
      return
    }
    setImages((current) => [...current, url])
    setImageInput('')
  }

  function validate() {
    const next: Record<string, string> = {}
    const goal = Number(formData.goal)
    const duration = Number(formData.duration)
    if (!formData.title.trim() || formData.title.length > 80) next.title = 'Title is required, max 80 characters.'
    if (!formData.category) next.category = 'Choose a category.'
    if (!goal || goal <= 0) next.goal = 'Goal must be greater than zero.'
    if (!duration || duration < 1 || duration > 365) next.duration = 'Duration must be between 1 and 365 days.'
    if (!formData.shortDescription.trim() || formData.shortDescription.length > 140) {
      next.shortDescription = 'Short description is required, max 140 characters.'
    }
    if (!formData.description.trim()) next.description = 'Full description is required.'
    if (images.length === 0) next.images = 'Add at least one image URL.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isConnected) {
      notify('Connect your wallet first.', 'info')
      return
    }
    if (!isFundraiserConfigured) {
      notify('Set NEXT_PUBLIC_FUNDRAISER_ADDRESS before creating proposals.', 'error')
      return
    }
    if (chainId !== appChain.id) {
      switchChain({ chainId: appChain.id })
      return
    }
    if (!validate()) return

    writeContract({
      address: CROWDFUNDING_ADDRESS,
      abi: crowdfundingAbi,
      functionName: 'createCampaign',
      args: [
        formData.title.trim(),
        formData.shortDescription.trim(),
        formData.description.trim(),
        formData.category,
        images,
        parseEther(formData.goal),
        BigInt(formData.duration),
      ],
      chainId: appChain.id,
    })
  }

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal-content max-w-lg p-6 sm:p-8" role="dialog" aria-modal="true" aria-label="Create proposal">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[var(--fg)]">Create a Proposal</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close" type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <FieldError label="Title" error={errors.title}>
              <input
                className="form-input"
                maxLength={80}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Community Solar Initiative"
                value={formData.title}
              />
            </FieldError>

            <div className="grid grid-cols-2 gap-4">
              <FieldError label="Category" error={errors.category}>
                <select className="form-input" onChange={(event) => updateField('category', event.target.value)} value={formData.category}>
                  <option value="">Select...</option>
                  <option value="technology">Technology</option>
                  <option value="community">Community</option>
                  <option value="environment">Environment</option>
                  <option value="arts">Arts</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                </select>
              </FieldError>
              <FieldError label="Goal (ETH)" error={errors.goal}>
                <input
                  className="form-input"
                  min="0"
                  onChange={(event) => updateField('goal', event.target.value)}
                  placeholder="1.5"
                  step="0.0001"
                  type="number"
                  value={formData.goal}
                />
              </FieldError>
            </div>

            <FieldError label="Duration (days)" error={errors.duration}>
              <input
                className="form-input"
                max="365"
                min="1"
                onChange={(event) => updateField('duration', event.target.value)}
                placeholder="30"
                type="number"
                value={formData.duration}
              />
            </FieldError>

            <FieldError label="Short Description" error={errors.shortDescription}>
              <input
                className="form-input"
                maxLength={140}
                onChange={(event) => updateField('shortDescription', event.target.value)}
                placeholder="Brief summary for the card"
                value={formData.shortDescription}
              />
            </FieldError>

            <FieldError label="Full Description" error={errors.description}>
              <textarea
                className="form-input"
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Tell the community about your project, milestones, and how funds will be used..."
                rows={4}
                value={formData.description}
              />
            </FieldError>

            <div>
              <label className="form-label">Cover Images</label>
              <div className="flex gap-2">
                <input
                  className="form-input"
                  onChange={(event) => setImageInput(event.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  type="url"
                  value={imageInput}
                />
                <button className="btn-outline px-3" onClick={addImage} type="button">
                  <Plus size={15} />
                  Add
                </button>
              </div>
              {errors.images ? <p className="form-error">{errors.images}</p> : null}
              <div className="mt-3 space-y-2">
                {images.map((url, index) => (
                  <div className="img-list-item" key={url}>
                    <img src={url} alt={`Image ${index + 1}`} />
                    <span className="img-url-text" title={url}>
                      {url}
                    </span>
                    {index === 0 ? <span className="text-xs font-bold text-[var(--accent)]">Cover</span> : null}
                    <button
                      className="btn-icon h-8 w-8"
                      onClick={() => setImages((current) => current.filter((image) => image !== url))}
                      type="button"
                      aria-label="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button className="btn-outline flex-1" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="btn-primary flex-1" disabled={isPending || isConfirming || isSwitching} type="submit">
              {chainId !== appChain.id
                ? isSwitching
                  ? 'Switching...'
                  : `Switch to ${appChain.name}`
                : isPending
                  ? 'Confirm in Wallet...'
                  : isConfirming
                    ? 'Publishing to Base...'
                    : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FieldError({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  )
}
