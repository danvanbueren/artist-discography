'use client'

import { useState, useEffect } from 'react'

const DEFAULT_FALLBACK_COLORS = [
  'hsl(220, 12%, 35%)',
  'hsl(220, 10%, 55%)',
  'hsl(220, 14%, 25%)',
  'hsl(220, 8%, 65%)',
  'hsl(220, 10%, 45%)',
]

const VIBRANT_PALETTE_CACHE = new Map()

const DEFAULT_PALETTE_STATE = {
  colors: DEFAULT_FALLBACK_COLORS,
  isMonochrome: false,
  avgSaturation: 0,
  isLoaded: false,
}

function getCachedVibrantPalette(imageSrc) {
  if (!imageSrc) {
    return {
      colors: DEFAULT_FALLBACK_COLORS,
      isMonochrome: false,
      avgSaturation: 0,
      isLoaded: true,
    }
  }
  if (VIBRANT_PALETTE_CACHE.has(imageSrc)) {
    return VIBRANT_PALETTE_CACHE.get(imageSrc)
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`vibrant_palette_${imageSrc}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && Array.isArray(parsed.colors) && parsed.isLoaded) {
          VIBRANT_PALETTE_CACHE.set(imageSrc, parsed)
          return parsed
        }
      }
    } catch {}
  }
  return DEFAULT_PALETTE_STATE
}

function saveCachedVibrantPalette(imageSrc, data) {
  if (!imageSrc || !data) return
  VIBRANT_PALETTE_CACHE.set(imageSrc, data)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`vibrant_palette_${imageSrc}`, JSON.stringify(data))
    } catch {}
  }
}

/**
 * Custom hook to analyze an image and sample its true color palette.
 * Accurately handles monochromatic/black & white images by preserving low saturation
 * and true image hues rather than forcing artificial bright colors.
 */
export function useVibrantColors(imageSrc) {
  const [palette, setPalette] = useState(() => getCachedVibrantPalette(imageSrc))

  useEffect(() => {
    if (!imageSrc) {
      setPalette((prev) => {
        if (prev.isLoaded && prev.colors === DEFAULT_FALLBACK_COLORS) return prev
        return {
          colors: DEFAULT_FALLBACK_COLORS,
          isMonochrome: false,
          avgSaturation: 0,
          isLoaded: true,
        }
      })
      return
    }

    const cached = getCachedVibrantPalette(imageSrc)
    if (cached.isLoaded) {
      setPalette((prev) => (prev === cached ? prev : cached))
      return
    }

    let isMounted = true
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          if (isMounted) setPalette((p) => ({ ...p, isLoaded: true }))
          return
        }

        const width = 64
        const height = Math.max(1, Math.round((img.height / img.width) * width))
        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data

        const allPixels = []
        let totalSat = 0
        let opaqueCount = 0

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]

          if (a < 50) continue

          const rNorm = r / 255
          const gNorm = g / 255
          const bNorm = b / 255

          const max = Math.max(rNorm, gNorm, bNorm)
          const min = Math.min(rNorm, gNorm, bNorm)
          const d = max - min

          let h = 0
          let s = 0
          const l = (max + min) / 2

          if (d !== 0) {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
              case rNorm:
                h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)
                break
              case gNorm:
                h = (bNorm - rNorm) / d + 2
                break
              case bNorm:
                h = (rNorm - gNorm) / d + 4
                break
            }
            h /= 6
          }

          const hueDeg = Math.round(h * 360)
          const satPct = Math.round(s * 100)
          const lightPct = Math.round(l * 100)

          totalSat += satPct
          opaqueCount++

          // Ignore extreme black and pure white for sample selection
          if (lightPct >= 5 && lightPct <= 95) {
            allPixels.push({
              h: hueDeg,
              s: satPct,
              l: lightPct,
            })
          }
        }

        if (opaqueCount === 0) {
          if (isMounted) setPalette((p) => ({ ...p, isLoaded: true }))
          return
        }

        const avgSat = Math.round(totalSat / opaqueCount)
        const isMonochrome = avgSat < 20

        const selected = []

        if (isMonochrome) {
          // For monochromatic images, extract shades of gray/slate matching actual image lightness
          const sortedByLightness = [...allPixels].sort((a, b) => b.l - a.l)
          const step = Math.max(1, Math.floor(sortedByLightness.length / 5))
          for (let i = 0; i < 5; i++) {
            const sample = sortedByLightness[Math.min(i * step, sortedByLightness.length - 1)] || {
              h: 0,
              s: 0,
              l: 50,
            }
            selected.push({
              h: sample.h,
              s: Math.min(sample.s, 10), // Strictly low saturation for monochrome
              l: Math.min(75, Math.max(20, sample.l)),
            })
          }
        } else {
          // Filter pixels with actual color saturation
          const colorful = allPixels.filter((p) => p.s >= 15)

          // Sort by color saturation & balanced lightness
          colorful.sort((a, b) => {
            const scoreA = a.s * 1.5 + (50 - Math.abs(a.l - 50))
            const scoreB = b.s * 1.5 + (50 - Math.abs(b.l - 50))
            return scoreB - scoreA
          })

          const minHueDiff = 25
          for (const sample of colorful) {
            if (selected.length >= 5) break
            const isFarEnough = selected.every((sel) => {
              const diff = Math.abs(sel.h - sample.h)
              const circularDiff = Math.min(diff, 360 - diff)
              return circularDiff >= minHueDiff
            })

            if (isFarEnough || selected.length === 0) {
              selected.push({
                h: sample.h,
                s: sample.s, // Preserves true image saturation
                l: Math.min(75, Math.max(25, sample.l)),
              })
            }
          }

          // If image is duo-tone or limited in hue spectrum, pad by varying lightness of sampled hues
          if (selected.length < 5 && selected.length > 0) {
            const baseCount = selected.length
            let idx = 0
            while (selected.length < 5) {
              const base = selected[idx % baseCount]
              const lightMod = (selected.length % 2 === 0 ? 18 : -18) + idx * 4
              const newL = Math.min(78, Math.max(22, base.l + lightMod))
              selected.push({
                h: base.h,
                s: base.s,
                l: newL,
              })
              idx++
            }
          }
        }

        const finalColors =
          selected.length >= 3
            ? selected.slice(0, 5).map((c) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`)
            : DEFAULT_FALLBACK_COLORS

        const result = {
          colors: finalColors,
          isMonochrome,
          avgSaturation: avgSat,
          isLoaded: true,
        }

        saveCachedVibrantPalette(imageSrc, result)

        if (isMounted) {
          setPalette((prev) => {
            const sameColors =
              prev.colors.length === finalColors.length &&
              prev.colors.every((col, i) => col === finalColors[i])
            if (sameColors && prev.isMonochrome === isMonochrome && prev.avgSaturation === avgSat) {
              return prev
            }
            return result
          })
        }
      } catch {
        const fallbackData = {
          colors: DEFAULT_FALLBACK_COLORS,
          isMonochrome: false,
          avgSaturation: 0,
          isLoaded: true,
        }
        saveCachedVibrantPalette(imageSrc, fallbackData)
        if (isMounted) {
          setPalette(fallbackData)
        }
      }
    }

    img.onerror = () => {
      const fallbackData = {
        colors: DEFAULT_FALLBACK_COLORS,
        isMonochrome: false,
        avgSaturation: 0,
        isLoaded: true,
      }
      saveCachedVibrantPalette(imageSrc, fallbackData)
      if (isMounted) {
        setPalette(fallbackData)
      }
    }

    img.src = imageSrc

    return () => {
      isMounted = false
    }
  }, [imageSrc])

  return palette
}
