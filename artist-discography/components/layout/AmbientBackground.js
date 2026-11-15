'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { useVibrantColors } from '@/lib/hooks/useVibrantColors'
import { isHighResCached, markHighResCached } from '@/lib/media/mediaPreloader'
import { usePerformanceMode } from '@/lib/performance/PerformanceModeContext'

function getLowResUrl(src) {
  if (!src || typeof src !== 'string') return ''
  if (
    src.startsWith('/api/media') ||
    src.startsWith('/api/logo') ||
    src.startsWith('/api/background') ||
    src.startsWith('/api/og')
  ) {
    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}w=64&q=30&blur=20&fmt=webp`
  }
  return src
}

export default function AmbientBackground({ ambientImage, darkMode }) {
  const { isLiteMode } = usePerformanceMode()
  const lowResSrc = getLowResUrl(ambientImage)

  // Sample palette from the pre-blurred thumbnail for instant color extraction
  const { colors, isMonochrome } = useVibrantColors(lowResSrc || ambientImage)

  const [lowResLoaded, setLowResLoaded] = useState(() => isHighResCached(lowResSrc))
  const [isPageHidden, setIsPageHidden] = useState(false)

  useEffect(() => {
    if (!ambientImage || !lowResSrc) {
      setLowResLoaded(false)
      return
    }

    if (isHighResCached(lowResSrc)) {
      setLowResLoaded(true)
      return
    }

    let isCancelled = false
    setLowResLoaded(false)

    const lowImg = new Image()
    lowImg.src = lowResSrc
    lowImg.onload = () => {
      if (!isCancelled) {
        markHighResCached(lowResSrc)
        setLowResLoaded(true)
      }
    }
    lowImg.onerror = () => {
      if (!isCancelled) {
        setLowResLoaded(true)
      }
    }

    return () => {
      isCancelled = true
    }
  }, [ambientImage, lowResSrc])

  useEffect(() => {
    if (isLiteMode || typeof document === 'undefined') {
      setIsPageHidden(false)
      return
    }

    const handleVisibilityChange = () => {
      setIsPageHidden(Boolean(document.hidden))
    }

    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isLiteMode])

  const c1 = colors[0] || 'hsl(220, 12%, 35%)'
  const c2 = colors[1] || 'hsl(220, 10%, 55%)'
  const c3 = colors[2] || 'hsl(220, 14%, 25%)'
  const c4 = colors[3] || 'hsl(220, 8%, 65%)'
  const c5 = colors[4] || 'hsl(220, 10%, 45%)'
  const baseBgColor = darkMode ? '#0a0a0c' : '#e4e7ec'

  if (isLiteMode) {
    return (
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          contain: 'strict',
          bgcolor: baseBgColor,
          transition: 'background-color 0.3s ease',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: darkMode ? 0.28 : 0.2,
            backgroundImage:
              ambientImage && lowResLoaded
                ? `radial-gradient(ellipse at 20% 20%, ${c1} 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, ${c2} 0%, transparent 60%), url(${lowResSrc})`
                : `radial-gradient(ellipse at 20% 20%, ${c1} 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, ${c2} 0%, transparent 60%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </Box>
    )
  }

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        contain: 'strict',
        bgcolor: baseBgColor,
        transition: 'background-color 0.3s ease',
        '--c1': c1,
        '--c2': c2,
        '--c3': c3,
        '--c4': c4,
        '--c5': c5,
      }}
    >
      {/* Server-blurred ambient layer + radial-gradient orbs (zero client blur filter) */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-10%',
          opacity: darkMode ? 0.35 : 0.24,
          transition: 'opacity 0.6s ease',
        }}
      >
        {ambientImage && lowResLoaded && (
          <Box
            key={`low_${lowResSrc}`}
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${lowResSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'ambientFadeIn 0.6s ease forwards',
              '@keyframes ambientFadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          />
        )}

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: isMonochrome ? 0.25 : 0.55,
            '& .ambient-orb': {
              animationPlayState: isPageHidden ? 'paused' : 'running',
              willChange: 'transform',
              borderRadius: '50%',
              position: 'absolute',
            },
          }}
        >
          {/* Dot 1: Top-Left Morphing Orb */}
          <Box
            className='ambient-orb'
            sx={{
              top: '-10%',
              left: '-10%',
              width: '48vw',
              height: '48vw',
              maxWidth: '640px',
              maxHeight: '640px',
              background: 'radial-gradient(circle, var(--c1) 0%, transparent 70%)',
              animation: 'floatOrb1 26s ease-in-out infinite alternate',
              '@keyframes floatOrb1': {
                '0%': { transform: 'translate3d(0px, 0px, 0) scale(0.9)', opacity: 0.7 },
                '25%': { transform: 'translate3d(90px, -60px, 0) scale(1.35)', opacity: 0.35 },
                '50%': { transform: 'translate3d(30px, 80px, 0) scale(0.7)', opacity: 0.8 },
                '75%': { transform: 'translate3d(-80px, 20px, 0) scale(1.2)', opacity: 0.45 },
                '100%': { transform: 'translate3d(0px, 0px, 0) scale(0.9)', opacity: 0.7 },
              },
            }}
          />

          {/* Dot 2: Top-Right Morphing Orb */}
          <Box
            className='ambient-orb'
            sx={{
              top: '-5%',
              right: '-12%',
              width: '44vw',
              height: '44vw',
              maxWidth: '580px',
              maxHeight: '580px',
              background: 'radial-gradient(circle, var(--c2) 0%, transparent 70%)',
              animation: 'floatOrb2 32s ease-in-out infinite alternate',
              '@keyframes floatOrb2': {
                '0%': { transform: 'translate3d(0px, 0px, 0) scale(1.15)', opacity: 0.4 },
                '30%': { transform: 'translate3d(-100px, 75px, 0) scale(0.65)', opacity: 0.75 },
                '65%': { transform: 'translate3d(70px, -60px, 0) scale(1.4)', opacity: 0.3 },
                '100%': { transform: 'translate3d(0px, 0px, 0) scale(1.15)', opacity: 0.4 },
              },
            }}
          />

          {/* Dot 3: Center-Left Morphing Orb */}
          <Box
            className='ambient-orb'
            sx={{
              top: '32%',
              left: '18%',
              width: '40vw',
              height: '40vw',
              maxWidth: '520px',
              maxHeight: '520px',
              background: 'radial-gradient(circle, var(--c3) 0%, transparent 70%)',
              animation: 'floatOrb3 22s ease-in-out infinite alternate',
              '@keyframes floatOrb3': {
                '0%': { transform: 'translate3d(0px, 0px, 0) scale(1.3)', opacity: 0.55 },
                '40%': { transform: 'translate3d(85px, 95px, 0) scale(0.6)', opacity: 0.25 },
                '75%': { transform: 'translate3d(-95px, -45px, 0) scale(1.25)', opacity: 0.7 },
                '100%': { transform: 'translate3d(0px, 0px, 0) scale(1.3)', opacity: 0.55 },
              },
            }}
          />

          {/* Dot 4: Bottom-Left Morphing Orb */}
          <Box
            className='ambient-orb'
            sx={{
              bottom: '-12%',
              left: '-8%',
              width: '46vw',
              height: '46vw',
              maxWidth: '600px',
              maxHeight: '600px',
              background: 'radial-gradient(circle, var(--c4) 0%, transparent 70%)',
              animation: 'floatOrb4 34s ease-in-out infinite alternate',
              '@keyframes floatOrb4': {
                '0%': { transform: 'translate3d(0px, 0px, 0) scale(0.7)', opacity: 0.3 },
                '35%': { transform: 'translate3d(-80px, -85px, 0) scale(1.45)', opacity: 0.75 },
                '70%': { transform: 'translate3d(95px, 50px, 0) scale(0.85)', opacity: 0.4 },
                '100%': { transform: 'translate3d(0px, 0px, 0) scale(0.7)', opacity: 0.3 },
              },
            }}
          />

          {/* Dot 5: Bottom-Right Morphing Orb */}
          <Box
            className='ambient-orb'
            sx={{
              bottom: '-8%',
              right: '-10%',
              width: '42vw',
              height: '42vw',
              maxWidth: '540px',
              maxHeight: '540px',
              background: 'radial-gradient(circle, var(--c5) 0%, transparent 70%)',
              animation: 'floatOrb5 28s ease-in-out infinite alternate',
              '@keyframes floatOrb5': {
                '0%': { transform: 'translate3d(0px, 0px, 0) scale(1.1)', opacity: 0.6 },
                '45%': { transform: 'translate3d(90px, -70px, 0) scale(0.65)', opacity: 0.25 },
                '80%': { transform: 'translate3d(-75px, 60px, 0) scale(1.35)', opacity: 0.7 },
                '100%': { transform: 'translate3d(0px, 0px, 0) scale(1.1)', opacity: 0.6 },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
