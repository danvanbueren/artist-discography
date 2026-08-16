'use client'

import { Box } from '@mui/material'
import { useVibrantColors } from '../../lib/hooks/useVibrantColors'

export default function AmbientBackground({ ambientImage, darkMode }) {
  const { colors, isMonochrome } = useVibrantColors(ambientImage)

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
        {/* Layer 1: Base Cover Art Image */}
        {ambientImage && (
          <Box
            key={ambientImage}
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${ambientImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'ambientFadeIn 1.2s ease forwards',
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
                  opacity: 0.70,
                  bgcolor: 'var(--c1)',
                },
                '25%': {
                  transform: 'translate(90px, -60px) scale(1.35)',
                  opacity: 0.35,
                  bgcolor: 'var(--c2)',
                },
                '50%': {
                  transform: 'translate(30px, 80px) scale(0.70)',
                  opacity: 0.80,
                  bgcolor: 'var(--c3)',
                },
                '75%': {
                  transform: 'translate(-80px, 20px) scale(1.20)',
                  opacity: 0.45,
                  bgcolor: 'var(--c4)',
                },
                '100%': {
                  transform: 'translate(0px, 0px) scale(0.9)',
                  opacity: 0.70,
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
                  opacity: 0.40,
                  bgcolor: 'var(--c2)',
                },
                '30%': {
                  transform: 'translate(-100px, 75px) scale(0.65)',
                  opacity: 0.75,
                  bgcolor: 'var(--c4)',
                },
                '65%': {
                  transform: 'translate(70px, -60px) scale(1.40)',
                  opacity: 0.30,
                  bgcolor: 'var(--c5)',
                },
                '100%': {
                  transform: 'translate(0px, 0px) scale(1.15)',
                  opacity: 0.40,
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
                  opacity: 0.70,
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
                  opacity: 0.30,
                  bgcolor: 'var(--c4)',
                },
                '35%': {
                  transform: 'translate(-80px, -85px) scale(1.45)',
                  opacity: 0.75,
                  bgcolor: 'var(--c1)',
                },
                '70%': {
                  transform: 'translate(95px, 50px) scale(0.85)',
                  opacity: 0.40,
                  bgcolor: 'var(--c2)',
                },
                '100%': {
                  transform: 'translate(0px, 0px) scale(0.70)',
                  opacity: 0.30,
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
                  opacity: 0.60,
                  bgcolor: 'var(--c5)',
                },
                '45%': {
                  transform: 'translate(90px, -70px) scale(0.65)',
                  opacity: 0.25,
                  bgcolor: 'var(--c3)',
                },
                '80%': {
                  transform: 'translate(-75px, 60px) scale(1.35)',
                  opacity: 0.70,
                  bgcolor: 'var(--c4)',
                },
                '100%': {
                  transform: 'translate(0px, 0px) scale(1.10)',
                  opacity: 0.60,
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
