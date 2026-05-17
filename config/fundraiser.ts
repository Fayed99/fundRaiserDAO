import type { Address } from 'viem'

export const FUNDRAISER_ADDRESS = (process.env.NEXT_PUBLIC_FUNDRAISER_ADDRESS || '0x0000000000000000000000000000000000000000') as Address

export const isFundraiserConfigured =
  /^0x[a-fA-F0-9]{40}$/.test(FUNDRAISER_ADDRESS) &&
  FUNDRAISER_ADDRESS !== '0x0000000000000000000000000000000000000000'

export const fundraiserAbi = [
  {
    type: 'function',
    name: 'campaignCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalRaised',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalPledges',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'contributionOf',
    stateMutability: 'view',
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'backer', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCampaign',
    stateMutability: 'view',
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'title', type: 'string' },
          { name: 'shortDescription', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'images', type: 'string[]' },
          { name: 'goal', type: 'uint256' },
          { name: 'pledged', type: 'uint256' },
          { name: 'deadline', type: 'uint64' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'backers', type: 'uint32' },
          { name: 'commentCount', type: 'uint32' },
          { name: 'updateCount', type: 'uint32' },
          { name: 'withdrawn', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getCampaigns',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'title', type: 'string' },
          { name: 'shortDescription', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'images', type: 'string[]' },
          { name: 'goal', type: 'uint256' },
          { name: 'pledged', type: 'uint256' },
          { name: 'deadline', type: 'uint64' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'backers', type: 'uint32' },
          { name: 'commentCount', type: 'uint32' },
          { name: 'updateCount', type: 'uint32' },
          { name: 'withdrawn', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getComments',
    stateMutability: 'view',
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'author', type: 'address' },
          { name: 'message', type: 'string' },
          { name: 'createdAt', type: 'uint64' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getUpdates',
    stateMutability: 'view',
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'message', type: 'string' },
          { name: 'createdAt', type: 'uint64' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'createCampaign',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'shortDescription', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'images', type: 'string[]' },
      { name: 'goal', type: 'uint256' },
      { name: 'durationDays', type: 'uint64' },
    ],
    outputs: [{ name: 'campaignId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'pledge',
    stateMutability: 'payable',
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'pledgeWithComment',
    stateMutability: 'payable',
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addComment',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'postUpdate',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'message', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'CampaignCreated',
    inputs: [
      { name: 'campaignId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'goal', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint64', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Pledged',
    inputs: [
      { name: 'campaignId', type: 'uint256', indexed: true },
      { name: 'backer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const
