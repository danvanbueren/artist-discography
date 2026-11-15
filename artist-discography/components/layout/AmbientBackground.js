'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { useVibrantColors } from '@/lib/hooks/useVibrantColors'
import { isHighResCached, markHighResCached } from '@/lib/media/mediaPreloader'
import { withMediaQuery } from '@/lib/media/mediaUrl'
import { usePerformanceMode } from '@/lib/performance/PerformanceModeContext'

function isInternalImageRoute(src) {
  return (
    typeof src === 'string' &&
    (src.startsWith('/api/media') ||
      src.startsWith('/api/logo') ||
      src.startsWith('/api/background') ||
      src.startsWith('/api/og'))
  )
}

function getLowResUrl(src, isLiteMode) {
  if (!src || typeof src !== 'string') return ''
  if (isInternalImageRoute(src)) {
    return isLiteMode
      ? withMediaQuery(src, { w: 64, q: 30, blur: 20, fmt: 'webp' })
      : withMediaQuery(src, { w: 48, q: 20, blur: 8, fmt: 'webp' })
  }
  return src
}

function getHighResUrl(src) {
  if (!src || typeof src !== 'string') return ''
  if (isInternalImageRoute(src)) {
    if (src.includes('w=')) return src
    return withMediaQuery(src, { w: 600, q: 80, fmt: 'webp' })
  }
  return src
}

const HIGH_MODE_ORBS = [
  {
    id: 'orb-1',
    sx: {
      top: '-10%',
      left: '-10%',
      width: '45vw',
      height: '45vw',
      maxWidth: '600px',
      maxHeight: '600px',
      animation: 'floatOrb1 26s ease-in-out infinite alternate',
      '@keyframes floatOrb1': {
        '0%': {
          transform: 'translate3d(0px, 0px, 0) scale(0.9)',
          opacity: 0.7,
          bgcolor: 'var(--c1)',
        },
        '25%': {
          transform: 'translate3d(90px, -60px, 0) scale(1.35)',
          opacity: 0.35,
          bgcolor: 'var(--c2)',
        },
        '50%': {
          transform: 'translate3d(30px, 80px, 0) scale(0.7)',
          opacity: 0.8,
          bgcolor: 'var(--c3)',
        },
        '75%': {
          transform: 'translate3d(-80px, 20px, 0) scale(1.2)',
          opacity: 0.45,
          bgcolor: 'var(--c4)',
        },
        '100%': {
          transform: 'translate3d(0px, 0px, 0) scale(0.9)',
          opacity: 0.7,
          bgcolor: 'var(--c1)',
        },
      },
    },
  },
  {
    id: 'orb-2',
    sx: {
      top: '-5%',
      right: '-12%',
      width: '40vw',
      height: '40vw',
      maxWidth: '540px',
      maxHeight: '540px',
      animation: 'floatOrb2 32s ease-in-out infinite alternate',
      '@keyframes floatOrb2': {
        '0%': {
          transform: 'translate3d(0px, 0px, 0) scale(1.15)',
          opacity: 0.4,
          bgcolor: 'var(--c2)',
        },
        '30%': {
          transform: 'translate3d(-100px, 75px, 0) scale(0.65)',
          opacity: 0.75,
          bgcolor: 'var(--c4)',
        },
        '65%': {
          transform: 'translate3d(70px, -60px, 0) scale(1.4)',
          opacity: 0.3,
          bgcolor: 'var(--c5)',
        },
        '100%': {
          transform: 'translate3d(0px, 0px, 0) scale(1.15)',
          opacity: 0.4,
          bgcolor: 'var(--c2)',
        },
      },
    },
  },
  {
    id: 'orb-3',
    sx: {
      top: '32%',
      left: '18%',
      width: '36vw',
      height: '36vw',
      maxWidth: '480px',
      maxHeight: '480px',
      animation: 'floatOrb3 22s ease-in-out infinite alternate',
      '@keyframes floatOrb3': {
        '0%': {
          transform: 'translate3d(0px, 0px, 0) scale(1.3)',
          opacity: 0.55,
          bgcolor: 'var(--c3)',
        },
        '40%': {
          transform: 'translate3d(85px, 95px, 0) scale(0.6)',
          opacity: 0.25,
          bgcolor: 'var(--c5)',
        },
        '75%': {
          transform: 'translate3d(-95px, -45px, 0) scale(1.25)',
          opacity: 0.7,
          bgcolor: 'var(--c1)',
        },
        '100%': {
          transform: 'translate3d(0px, 0px, 0) scale(1.3)',
          opacity: 0.55,
          bgcolor: 'var(--c3)',
        },
      },
    },
  },
  {
    id: 'orb-4',
    sx: {
      bottom: '-12%',
      left: '-8%',
      width: '42vw',
      height: '42vw',
      maxWidth: '560px',
      maxHeight: '560px',
      animation: 'floatOrb4 34s ease-in-out infinite alternate',
      '@keyframes floatOrb4': {
        '0%': {
          transform: 'translate3d(0px, 0px, 0) scale(0.7)',
          opacity: 0.3,
          bgcolor: 'var(--c4)',
        },
        '35%': {
          transform: 'translate3d(-80px, -85px, 0) scale(1.45)',
          opacity: 0.75,
          bgcolor: 'var(--c1)',
        },
        '70%': {
          transform: 'translate3d(95px, 50px, 0) scale(0.85)',
          opacity: 0.4,
          bgcolor: 'var(--c2)',
        },
        '100%': {
          transform: 'translate3d(0px, 0px, 0) scale(0.7)',
          opacity: 0.3,
          bgcolor: 'var(--c4)',
        },
      },
    },
  },
  {
    id: 'orb-5',
    sx: {
      bottom: '-8%',
      right: '-10%',
      width: '38vw',
      height: '38vw',
      maxWidth: '500px',
      maxHeight: '500px',
      animation: 'floatOrb5 28s ease-in-out infinite alternate',
      '@keyframes floatOrb5': {
        '0%': {
          transform: 'translate3d(0px, 0px, 0) scale(1.1)',
          opacity: 0.6,
          bgcolor: 'var(--c5)',
        },
        '45%': {
          transform: 'translate3d(90px, -70px, 0) scale(0.65)',
          opacity: 0.25,
          bgcolor: 'var(--c3)',
        },
        '80%': {
          transform: 'translate3d(-75px, 60px, 0) scale(1.35)',
          opacity: 0.7,
          bgcolor: 'var(--c4)',
        },
        '100%': {
          transform: 'translate3d(0px, 0px, 0) scale(1.1)',
          opacity: 0.6,
          bgcolor: 'var(--c5)',
        },
      },
    },
  },
]

export default function AmbientBackground({ ambientImage, darkMode }) {
  const { isLiteMode } = usePerformanceMode()
  const lowResSrc = getLowResUrl(ambientImage, isLiteMode)
  const highResSrc = isLiteMode ? lowResSrc : getHighResUrl(ambientImage)

  // Sample palette from the lightweight thumbnail for fast color extraction
  const { colors, isMonochrome } = useVibrantColors(lowResSrc || ambientImage)

  const [lowResLoaded, setLowResLoaded] = useState(
    () => isHighResCached(lowResSrc) || isHighResCached(highResSrc),
  )
  const [highResLoaded, setHighResLoaded] = useState(
    () => !isLiteMode && isHighResCached(highResSrc),
  )
  const [isPageHidden, setIsPageHidden] = useState(false)

  useEffect(() => {
    if (!ambientImage || !lowResSrc) {
      setLowResLoaded(false)
      setHighResLoaded(false)
      return
    }

    if (!isLiteMode && highResSrc && isHighResCached(highResSrc)) {
      setLowResLoaded(true)
      setHighResLoaded(true)
      return
    }

    let isCancelled = false
    setLowResLoaded(isHighResCached(lowResSrc))
    setHighResLoaded(false)

    if (!isHighResCached(lowResSrc)) {
      const lowImg = new Image()
      lowImg.onload = () => {
        if (!isCancelled) {
          markHighResCached(lowResSrc)
          setLowResLoaded(true)
          if (!isLiteMode && highResSrc === lowResSrc) {
            setHighResLoaded(true)
          }
        }
      }
      lowImg.onerror = () => {
        if (!isCancelled) {
          setLowResLoaded(true)
        }
      }
      lowImg.src = lowResSrc
    } else if (!isLiteMode && highResSrc === lowResSrc) {
      setHighResLoaded(true)
    }

    if (!isLiteMode && highResSrc && highResSrc !== lowResSrc) {
      const highImg = new Image()
      highImg.onload = () => {
        if (!isCancelled) {
          markHighResCached(highResSrc)
          setHighResLoaded(true)
        }
      }
      highImg.onerror = () => {
        // High-res load failure is non-fatal; low-res blurred backdrop stays visible
      }
      highImg.src = highResSrc
    }

    return () => {
      isCancelled = true
    }
  }, [ambientImage, lowResSrc, highResSrc, isLiteMode])

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
      {/* Unified Composite Blur Layer — Artwork + Animated Color Orbs */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-15%',
          filter: 'blur(90px) saturate(1.25)',
          opacity: darkMode ? 0.35 : 0.24,
          transition: 'opacity 0.6s ease',
          willChange: 'transform',
        }}
      >
        {/* Layer 1a: Lightweight initial ambient image */}
        {ambientImage && lowResLoaded && (
          <Box
            key={`low_${lowResSrc}`}
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${lowResSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: highResLoaded ? 0 : 1,
              transition: 'opacity 0.8s ease-in-out',
              animation: 'ambientFadeIn 0.6s ease forwards',
              '@keyframes ambientFadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          />
        )}

        {/* Layer 1b: Higher-resolution ambient artwork crossfade */}
        {ambientImage && highResLoaded && highResSrc && (
          <Box
            key={`high_${highResSrc}`}
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${highResSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'ambientHighFadeIn 0.8s ease forwards',
              '@keyframes ambientHighFadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          />
        )}

        {/* Layer 2: Dynamic Color-Shifting Morphing Orbs */}
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
              transition: 'background-color 1.5s ease-in-out',
            },
          }}
        >
          {HIGH_MODE_ORBS.map((orb) => (
            <Box key={orb.id} className='ambient-orb' sx={orb.sx} />
          ))}
        </Box>
      </Box>
    </Box>
  )
}
