import fs from 'fs'
import crypto from 'crypto'

const COLOR_CACHE = new Map()

const DEFAULT_FALLBACK_PALETTE = {
  colors: ['#5865F2', '#7289DA', '#4E5D94', '#99AAB5', '#2C2F33'],
  primaryGradient: 'linear-gradient(135deg, #ffffff, #e0e6ed, #c5d1de, #ffffff)',
  secondaryGradient: 'linear-gradient(135deg, #e0e6ed, #c5d1de, #8b949e)',
  themeColorHex: '#5865F2',
  isMonochrome: false,
  avgSaturation: 0,
}

let sharpModule = null

async function getSharp() {
  if (sharpModule !== null) return sharpModule
  try {
    const mod = await import('sharp')
    const sharpInstance = mod.default || mod
    if (sharpInstance && typeof sharpInstance.cache === 'function') {
      sharpInstance.cache(false)
    }
    sharpModule = sharpInstance
  } catch (err) {
    console.warn('Sharp module failed to load in ogColorExtractor:', err.message)
    sharpModule = false
  }
  return sharpModule
}

function hslToRgb(h, s, l) {
  const sNorm = s / 100
  const lNorm = l / 100
  const k = (n) => (n + h / 30) % 12
  const a = sNorm * Math.min(lNorm, 1 - lNorm)
  const f = (n) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const r = Math.round(f(0) * 255)
  const g = Math.round(f(8) * 255)
  const b = Math.round(f(4) * 255)
  return { r, g, b }
}

function rgbToHex(r, g, b) {
  const toHex = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function parseHsl(hslStr) {
  const match = hslStr ? hslStr.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i) : null
  if (!match) return { h: 220, s: 15, l: 50 }
  return {
    h: parseInt(match[1], 10),
    s: parseInt(match[2], 10),
    l: parseInt(match[3], 10),
  }
}

/**
 * Extracts vibrant color palette, CSS gradients, and Discord theme hex color from an image buffer or file path.
 *
 * @param {string|Buffer} imageSource - Absolute file path or image Buffer
 * @returns {Promise<typeof DEFAULT_FALLBACK_PALETTE>}
 */
export async function extractOgPalette(imageSource) {
  if (!imageSource) return DEFAULT_FALLBACK_PALETTE

  let cacheKey = ''
  if (typeof imageSource === 'string') {
    try {
      if (!fs.existsSync(imageSource)) return DEFAULT_FALLBACK_PALETTE
      const stat = fs.statSync(imageSource)
      cacheKey = `${imageSource}:${stat.mtimeMs}:${stat.size}`
    } catch {
      return DEFAULT_FALLBACK_PALETTE
    }
  } else if (Buffer.isBuffer(imageSource)) {
    cacheKey = crypto.createHash('md5').update(imageSource.subarray(0, 4096)).digest('hex')
  }

  if (cacheKey && COLOR_CACHE.has(cacheKey)) {
    return COLOR_CACHE.get(cacheKey)
  }

  const sharp = await getSharp()
  if (!sharp) return DEFAULT_FALLBACK_PALETTE

  try {
    const { data } = await sharp(imageSource, { failOnError: false })
      .resize(64, 64, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

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

      if (lightPct >= 5 && lightPct <= 95) {
        allPixels.push({
          h: hueDeg,
          s: satPct,
          l: lightPct,
          r,
          g,
          b,
        })
      }
    }

    if (opaqueCount === 0 || allPixels.length === 0) {
      return DEFAULT_FALLBACK_PALETTE
    }

    const avgSat = Math.round(totalSat / opaqueCount)
    const isMonochrome = avgSat < 20

    const selected = []

    if (isMonochrome) {
      const sortedByLightness = [...allPixels].sort((a, b) => b.l - a.l)
      const step = Math.max(1, Math.floor(sortedByLightness.length / 5))
      for (let i = 0; i < 5; i++) {
        const sample = sortedByLightness[Math.min(i * step, sortedByLightness.length - 1)] || {
          h: 0,
          s: 0,
          l: 50,
          r: 128,
          g: 128,
          b: 128,
        }
        selected.push({
          h: sample.h,
          s: Math.min(sample.s, 10),
          l: Math.min(75, Math.max(20, sample.l)),
          r: sample.r,
          g: sample.g,
          b: sample.b,
        })
      }
    } else {
      const colorful = allPixels.filter((p) => p.s >= 15)
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
            s: sample.s,
            l: Math.min(75, Math.max(25, sample.l)),
            r: sample.r,
            g: sample.g,
            b: sample.b,
          })
        }
      }

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
            r: base.r,
            g: base.g,
            b: base.b,
          })
          idx++
        }
      }
    }

    const finalColors =
      selected.length >= 3
        ? selected.slice(0, 5).map((c) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`)
        : DEFAULT_FALLBACK_PALETTE.colors

    const parsed = finalColors.map(parseHsl)
    const p1 = parsed[0] || { h: 220, s: 15, l: 50 }
    const p2 = parsed[1] || { h: 220, s: 12, l: 60 }
    const p3 = parsed[2] || { h: 220, s: 10, l: 40 }
    const p4 = parsed[3] || { h: 220, s: 14, l: 55 }

    const rgbL1 = hslToRgb(p1.h, Math.max(35, p1.s), Math.min(96, Math.max(82, p1.l + 32)))
    const rgbL2 = hslToRgb(p2.h, Math.max(35, p2.s), Math.min(94, Math.max(78, p2.l + 28)))
    const rgbL3 = hslToRgb(p3.h, Math.max(35, p3.s), Math.min(92, Math.max(75, p3.l + 25)))
    const rgbL4 = hslToRgb(p4.h, Math.max(35, p4.s), Math.min(95, Math.max(80, p4.l + 30)))
    const hexL1 = rgbToHex(rgbL1.r, rgbL1.g, rgbL1.b)
    const hexL2 = rgbToHex(rgbL2.r, rgbL2.g, rgbL2.b)
    const hexL3 = rgbToHex(rgbL3.r, rgbL3.g, rgbL3.b)
    const hexL4 = rgbToHex(rgbL4.r, rgbL4.g, rgbL4.b)
    const primaryGradient = `linear-gradient(135deg, ${hexL1}, ${hexL2}, ${hexL3}, ${hexL4}, ${hexL1})`

    const rgbS1 = hslToRgb(p1.h, Math.max(25, p1.s), Math.min(90, Math.max(72, p1.l + 22)))
    const rgbS2 = hslToRgb(p2.h, Math.max(25, p2.s), Math.min(88, Math.max(68, p2.l + 18)))
    const rgbS3 = hslToRgb(p3.h, Math.max(25, p3.s), Math.min(86, Math.max(65, p3.l + 15)))
    const hexS1 = rgbToHex(rgbS1.r, rgbS1.g, rgbS1.b)
    const hexS2 = rgbToHex(rgbS2.r, rgbS2.g, rgbS2.b)
    const hexS3 = rgbToHex(rgbS3.r, rgbS3.g, rgbS3.b)
    const secondaryGradient = `linear-gradient(135deg, ${hexS1}, ${hexS2}, ${hexS3}, ${hexS1})`

    const dominantSample = selected[0] || { h: 220, s: 30, l: 50 }
    const themeRgb = hslToRgb(dominantSample.h, Math.max(40, dominantSample.s), 55)
    const themeColorHex = rgbToHex(themeRgb.r, themeRgb.g, themeRgb.b)

    const result = {
      colors: finalColors,
      primaryGradient,
      secondaryGradient,
      themeColorHex,
      isMonochrome,
      avgSaturation: avgSat,
    }

    if (cacheKey) {
      if (COLOR_CACHE.size >= 150) {
        const oldest = COLOR_CACHE.keys().next().value
        COLOR_CACHE.delete(oldest)
      }
      COLOR_CACHE.set(cacheKey, result)
    }

    return result
  } catch (err) {
    console.warn('Error extracting OG palette with Sharp:', err.message)
    return DEFAULT_FALLBACK_PALETTE
  }
}
