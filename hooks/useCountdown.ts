'use client'

import { useEffect, useState } from 'react'

export type CountdownTime = {
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
}

export function useCountdown(deadlineSeconds: number) {
  const [timeLeft, setTimeLeft] = useState<CountdownTime | null>(null)

  useEffect(() => {
    function calculateTime() {
      const now = Math.floor(Date.now() / 1000)
      const diff = deadlineSeconds - now

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 })
        return
      }

      setTimeLeft({
        hours: Math.floor((diff % 86_400) / 3_600),
        minutes: Math.floor((diff % 3_600) / 60),
        seconds: Math.floor(diff % 60),
        totalSeconds: diff,
      })
    }

    calculateTime()
    const timer = window.setInterval(calculateTime, 1000)

    return () => window.clearInterval(timer)
  }, [deadlineSeconds])

  return timeLeft
}
