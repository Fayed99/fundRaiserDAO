'use client'

import { CheckCircle2, Info, XCircle } from 'lucide-react'

export type ToastState = {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function Toasts({ toasts }: { toasts: ToastState[] }) {
  return (
    <div className="toast-wrap">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div className={`toast ${toast.type}`} key={toast.id}>
            <Icon size={18} />
            <span>{toast.message}</span>
          </div>
        )
      })}
    </div>
  )
}
