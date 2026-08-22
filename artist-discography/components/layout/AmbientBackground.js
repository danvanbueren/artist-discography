'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { useVibrantColors } from '@/lib/hooks/useVibrantColors'
import { isHighResCached, markHighResCached } from '@/lib/media/mediaPreloader'

function getLowResUrl(src) {
  if (!src || typeof src !== 'string') return ''
  if (src.startsWith('/api/media') || src.startsWith('/api/logo')) {
    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}w=48&q=20&blur=8&fmt=webp`
  }
  return src
}

function getHighResUrl(src) {
  if (!src || typeof src !== 'string') return ''
  if (src.startsWith('/api/media') || src.startsWith('/api/logo')) {
    if (src.includes('w=')) return src
    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}w=600&q=80&fmt=webp`
  }
  return src
}

export default function AmbientBackground({ ambientImage, darkMode }) {
  const lowResSrc = getLowResUrl(ambientImage)
  const highResSrc = getHighResUrl(ambientImage)

  // Use low-res source for vibrant palette extraction so it samples in milliseconds
  const { colors, isMonochrome } = useVibrantColors(lowResSrc || ambientImage)

  const [lowResLoaded, setLowResLoaded] = useState(
    () => isHighResCached(lowResSrc) || isHighResCached(highResSrc),
  )
  const [highResLoaded, setHighResLoaded] = useState(() => isHighResCached(highResSrc))

  useEffect(() => {
    if (!ambientImage) {
      setLowResLoaded(false)
      setHighResLoaded(false)
      return
    }

    const isCachedHigh = isHighResCached(highResSrc)
    if (isCachedHigh) {
      setLowResLoaded(true)
      setHighResLoaded(true)
      return
    }

    let isCancelled = false
    setLowResLoaded(isHighResCached(lowResSrc))
    setHighResLoaded(false)

    // 1. Immediately load lightweight compressed low-res variant
    if (lowResSrc) {
      const lowImg = new Image()
      lowImg.src = lowResSrc
      lowImg.onload = () => {
        if (!isCancelled) {
          markHighResCached(lowResSrc)
          setLowResLoaded(true)
          if (highResSrc === lowResSrc) {
            setHighResLoaded(true)
          }
        }
      }
      lowImg.onerror = () => {
        if (!isCancelled) {
          setLowResLoaded(true)
        }
      }
    }

    // 2. Concurrently load full/higher resolution variant
    if (highResSrc && highResSrc !== lowResSrc) {
      const highImg = new Image()
      highImg.src = highResSrc
      highImg.onload = () => {
        if (!isCancelled) {
          markHighResCached(highResSrc)
          setHighResLoaded(true)
        }
      }
      highImg.onerror = () => {
        // High-res failure is non-fatal; low-res layer remains visible
      }
    }

    return () => {
      isCancelled = true
    }
  }, [ambientImage, lowResSrc, highResSrc])

  const c1 = colors[0] || 'hsl(220, 12%, 35%)'
  const c2 = colors[1] || 'hsl(220, 10%, 55%)'
  const c3 = colors[2] || 'hsl(220, 14%, 25%)'
  const c4 = colors[3] || 'hsl(220, 8%, 65%)'
  const c5 = colors[4] || 'hsl(220, 10%, 45%)'

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
        bgcolor: 'background.default',
        transition: 'background-color 0.3s ease',
        '--c1': c1,
        '--c2': c2,
        '--c3': c3,
        '--c4': c4,
        '--c5': c5,
      }}
    >
      {/* Unified Composite Blur Layer — Image + Animated Dots blurred TOGETHER */}
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
        {/* Layer 1a: Lightweight compressed background (loads instantly on poor connections) */}
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

        {/* Layer 1b: Higher resolution background (smoothly fades in once loaded) */}
        {ambientImage && highResLoaded && (
          <Box
            key={`high_${highResSrc}`}
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${highResSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'ambientFadeIn 0.8s ease forwards',
              '@keyframes ambientFadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          />
        )}

        {/* Layer 2: Dynamic Floating Dots layered over image INSIDE the unified blur container */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: isMonochrome ? 0.25 : 0.55,
          }}
        >
          {/* Dot 1: Top-Left Morphing Orb */}
          <Box
            sx={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '45vw',
              height: '45vw',
              maxWidth: '600px',
              maxHeight: '600px',
              borderRadius: '50%',
              transition: 'background-color 1.5s ease-in-out',
              animation: 'floatOrb1 26s ease-in-out infinite alternate',
              '@keyframes floatOrb1': {
                '0%': {
                  transform: 'translate(0px, 0px) scale(0.9)',
                  opacity: 0.7,
                  bgcolor: 'var(--c1)',
                },
                '25%': {
                  transform: 'translate(90px, -60px) scale(1.35)',
                  opacity: 0.35,
                  bgcolor: 'var(--c2)',
                },
                '50%': {
                  transform: 'translate(30px, 80px) scale(0.70)',
                  opacity: 0.8,
                  bgcolor: 'var(--c3)',
                },
                '75%': {
                  transform: 'translate(-80px, 20px) scale(1.20)',
                  opacity: 0.45,
                  bgcolor: 'var(--c4)',
                },
                '100%': {
                  transform: 'translate(0px, 0px) scale(0.9)',
                  opacity: 0.7,
                  bgcolor: 'var(--c1)',
                },
              },
            }}
          />

          {/* Dot 2: Top-Right Morphing Orb */}
          <Box
            sx={{
              position: 'absolute',
              top: '-5%',
              right: '-12%',
              width: '40vw',
              height: '40vw',
              maxWidth: '540px',
              maxHeight: '540px',
              borderRadius: '50%',
              transition: 'background-color 1.5s ease-in-out',
              animation: 'floatOrb2 32s ease-in-out infinite alternate',
              '@keyframes floatOrb2': {
                '0%': {
                  transform: 'translate(0px, 0px) scale(1.15)',
                  opacity: 0.4,
                  bgcolor: 'var(--c2)',
                },
                '30%': {
                  transform: 'translate(-100px, 75px) scale(0.65)',
                  opacity: 0.75,
                  bgcolor: 'var(--c4)',
                },
                '65%': {
                  transform: 'translate(70px, -60px) scale(1.40)',
                  opacity: 0.3,
                  bgcolor: 'var(--c5)',
                },
                '100%': {
                  transform: 'translate(0px, 0px) scale(1.15)',
                  opacity: 0.4,
                  bgcolor: 'var(--c2)',
                },
              },
            }}
          />

          {/* Dot 3: Center-Left Morphing Orb */}
          <Box
            sx={{
              position: 'absolute',
              top: '32%',
              left: '18%',
              width: '36vw',
              height: '36vw',
              maxWidth: '480px',
              maxHeight: '480px',
              borderRadius: '50%',
              transition: 'background-color 1.5s ease-in-out',
              animation: 'floatOrb3 22s ease-in-out infinite alternate',
              '@keyframes floatOrb3': {
                '0%': {
                  transform: 'translate(0px, 0px) scale(1.30)',
                  opacity: 0.55,
                  bgcolor: 'var(--c3)',
                },
                '40%': {
                  transform: 'translate(85px, 95px) scale(0.60)',
                  opacity: 0.25,
                  bgcolor: 'var(--c5)',
                },
                '75%': {
                  transform: 'translate(-95px, -45px) scale(1.25)',
                  opacity: 0.7,
                  bgcolor: 'var(--c1)',
                },
                '100%': {
                  transform: 'translate(0px, 0px) scale(1.30)',
                  opacity: 0.55,
                  bgcolor: 'var(--c3)',
                },
              },
            }}
          />

          {/* Dot 4: Bottom-Left Morphing Orb */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '-12%',
              left: '-8%',
              width: '42vw',
              height: '42vw',
              maxWidth: '560px',
              maxHeight: '560px',
              borderRadius: '50%',
              transition: 'background-color 1.5s ease-in-out',
              animation: 'floatOrb4 34s ease-in-out infinite alternate',
              '@keyframes floatOrb4': {
                '0%': {
                  transform: 'translate(0px, 0px) scale(0.70)',
                  opacity: 0.3,
                  bgcolor: 'var(--c4)',
                },
                '35%': {
                  transform: 'translate(-80px, -85px) scale(1.45)',
                  opacity: 0.75,
                  bgcolor: 'var(--c1)',
                },
                '70%': {
                  transform: 'translate(95px, 50px) scale(0.85)',
                  opacity: 0.4,
                  bgcolor: 'var(--c2)',
                },
                '100%': {
                  transform: 'translate(0px, 0px) scale(0.70)',
                  opacity: 0.3,
                  bgcolor: 'var(--c4)',
                },
              },
            }}
          />

          {/* Dot 5: Bottom-Right Morphing Orb */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '-8%',
              right: '-10%',
              width: '38vw',
              height: '38vw',
              maxWidth: '500px',
              maxHeight: '500px',
              borderRadius: '50%',
              transition: 'background-color 1.5s ease-in-out',
              animation: 'floatOrb5 28s ease-in-out infinite alternate',
              '@keyframes floatOrb5': {
                '0%': {
                  transform: 'translate(0px, 0px) scale(1.10)',
                  opacity: 0.6,
                  bgcolor: 'var(--c5)',
                },
                '45%': {
                  transform: 'translate(90px, -70px) scale(0.65)',
                  opacity: 0.25,
                  bgcolor: 'var(--c3)',
                },
                '80%': {
                  transform: 'translate(-75px, 60px) scale(1.35)',
                  opacity: 0.7,
                  bgcolor: 'var(--c4)',
                },
                '100%': {
                  transform: 'translate(0px, 0px) scale(1.10)',
                  opacity: 0.6,
                  bgcolor: 'var(--c5)',
                },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
