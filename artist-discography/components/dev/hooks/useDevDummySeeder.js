'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function useDevDummySeeder(onSuccessData) {
  const router = useRouter()
  const [isGeneratingDummy, setIsGeneratingDummy] = useState(false)
  const [seedMessage, setSeedMessage] = useState('')
  const [seedError, setSeedError] = useState('')

  const handleGenerateDummyData = async () => {
    setIsGeneratingDummy(true)
    setSeedMessage('')
    setSeedError('')

    try {
      const res = await fetch('/api/dev/seed-dummy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json().catch(() => ({}))

      if (res.ok && result?.success) {
        setSeedMessage(result.message || 'Dummy data generated successfully!')
        if (result.data && onSuccessData) {
          onSuccessData(result.data)
        }
        try {
          router.refresh()
        } catch (e) { }
      } else {
        setSeedError(result?.error || 'Failed to generate dummy data.')
      }
    } catch (err) {
      setSeedError(`Error generating dummy data: ${err.message}`)
    } finally {
      setIsGeneratingDummy(false)
    }
  }

  return {
    isGeneratingDummy,
    seedMessage,
    setSeedMessage,
    seedError,
    setSeedError,
    handleGenerateDummyData,
  }
}
