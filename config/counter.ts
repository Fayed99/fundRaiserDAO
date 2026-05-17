import type { Address } from 'viem'

export const COUNTER_ADDRESS = (process.env.NEXT_PUBLIC_COUNTER_ADDRESS || '0x0000000000000000000000000000000000000000') as Address

export const isCounterConfigured =
  /^0x[a-fA-F0-9]{40}$/.test(COUNTER_ADDRESS) &&
  COUNTER_ADDRESS !== '0x0000000000000000000000000000000000000000'

export const counterAbi = [
  {
    type: 'function',
    name: 'number',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'increment',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const
