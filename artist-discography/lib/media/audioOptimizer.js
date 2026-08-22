import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { createJob, updateJobProgress, completeJob, failJob } from '../api/jobTracker'
import {
  isFfmpegAvailable,
  executeAudioTranscode,
  executeFallbackMp3Transcode,
} from './ffmpegRunner'

export const AUDIO_CACHE_DIR = path.join(process.cwd(), 'data', 'cache', 'audio')
const ACTIVE_TRANSCODE_PROMISES = new Map()

export { isFfmpegAvailable }

const AUDIO_MIME_MAP = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  webm: 'audio/webm',
}

export const STANDARD_AUDIO_VARIANTS = [
  { quality: 'high', bitrate: '320k', format: 'mp3' },
  { quality: 'fast', bitrate: '128k', format: 'mp3' },
  { quality: 'medium', bitrate: '192k', format: 'mp3' },
  { quality: 'lossless', format: 'flac' },
]

/**
 * Computes deterministic cache key, filename, and format parameters for an audio transcode variant.
 *
 * @param {string} sourceFilePath
 * @param {fs.Stats} stat
 * @param {Object} [options={}]
 * @returns {{ cacheHash: string, cacheFileName: string, targetFormat: string, targetBitrate: string|null, isLosslessRequested: boolean }}
 */
export function computeAudioCacheKey(sourceFilePath, stat, options = {}) {
  const { quality = 'high', bitrate = null, format = 'mp3' } = options

  const isLosslessRequested =
    quality === 'original' ||
    quality === 'lossless' ||
    bitrate === 'original' ||
    bitrate === 'lossless' ||
    format === 'flac'

  let targetFormat = 'mp3'
  let targetBitrate = bitrate

  if (isLosslessRequested) {
    targetFormat = 'flac'
    targetBitrate = null
  } else if (format === 'm4a' || format === 'aac') {
    targetFormat = 'm4a'
  } else if (format === 'flac') {
    targetFormat = 'flac'
    targetBitrate = null
  } else {
    targetFormat = 'mp3'
  }

  if (targetFormat !== 'flac') {
    if (targetBitrate) {
      targetBitrate = targetBitrate.endsWith('k') ? targetBitrate : `${targetBitrate}k`
    } else if (quality === 'fast' || quality === 'low' || quality === 'preview') {
      targetBitrate = '128k'
    } else if (quality === 'medium' || quality === 'standard') {
      targetBitrate = '192k'
    } else {
      targetBitrate = '320k'
    }
  }

  const hashInput = `${sourceFilePath}:${stat.mtimeMs}:${stat.size}:fmt=${targetFormat}:b=${targetBitrate || 'lossless'}`
  const cacheHash = crypto.createHash('md5').update(hashInput).digest('hex')
  const cacheFileName = `${cacheHash}.${targetFormat}`

  return { cacheHash, cacheFileName, targetFormat, targetBitrate, isLosslessRequested }
}

function ensureAudioCacheDir() {
  try {
    if (!fs.existsSync(AUDIO_CACHE_DIR)) {
      fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true })
    }
  } catch (err) {
    console.warn('Could not create audio cache directory:', err)
  }
}

/**
 * Transcodes an audio file into an optimized, web-ready audio stream and stores it in data/cache/audio/
 * Fully uncompressed WAV files are NEVER delivered to the client; at lossless quality, they are
 * converted to FLAC and cached.
 *
 * @param {string} sourceFilePath - Absolute path to original audio file
 * @param {Object} options - Quality, bitrate, and format options
 * @returns {Promise<{ filePath: string, mimeType: string, isFromCache: boolean, size: number, mtimeMs: number }>}
 */
export async function getOptimizedAudio(sourceFilePath, options = {}) {
  const { quality = 'high', bitrate = null, format = 'mp3' } = options

  const ext = path.extname(sourceFilePath).toLowerCase().replace('.', '')
  const stat = fs.statSync(/*turbopackIgnore: true*/ sourceFilePath)

  const isUncompressedSource = ext === 'wav' || ext === 'aiff' || ext === 'aif' || ext === 'pcm'
  const isLosslessRequested =
    quality === 'original' ||
    quality === 'lossless' ||
    bitrate === 'original' ||
    bitrate === 'lossless' ||
    format === 'flac'

  // If source is already a compressed format and lossless is requested, serve source directly
  if (isLosslessRequested && !isUncompressedSource) {
    return {
      filePath: sourceFilePath,
      mimeType: AUDIO_MIME_MAP[ext] || 'application/octet-stream',
      isFromCache: false,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
    }
  }

  const { cacheHash, cacheFileName, targetFormat, targetBitrate } = computeAudioCacheKey(
    sourceFilePath,
    stat,
    options,
  )

  const hasFfmpeg = await isFfmpegAvailable()
  if (!hasFfmpeg) {
    return {
      filePath: sourceFilePath,
      mimeType: AUDIO_MIME_MAP[ext] || 'application/octet-stream',
      isFromCache: false,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
    }
  }

  ensureAudioCacheDir()

  const cacheFilePath = path.join(AUDIO_CACHE_DIR, cacheFileName)

  // 1. Check if cached audio file already exists
  try {
    if (fs.existsSync(cacheFilePath)) {
      const cachedStat = fs.statSync(/*turbopackIgnore: true*/ cacheFilePath)
      if (cachedStat.size > 0) {
        return {
          filePath: cacheFilePath,
          mimeType:
            AUDIO_MIME_MAP[targetFormat] || (targetFormat === 'flac' ? 'audio/flac' : 'audio/mpeg'),
          isFromCache: true,
          size: cachedStat.size,
          mtimeMs: cachedStat.mtimeMs,
        }
      }
    }
  } catch {}

  // 2. Return active transcode promise if currently running
  if (ACTIVE_TRANSCODE_PROMISES.has(cacheHash)) {
    return ACTIVE_TRANSCODE_PROMISES.get(cacheHash)
  }

  // 3. Spawn ffmpeg transcoding job
  const transcodePromise = (async () => {
    const tempFileName = `${cacheHash}.tmp.${Date.now()}.${targetFormat}`
    const tempFilePath = path.join(AUDIO_CACHE_DIR, tempFileName)
    try {
      await executeAudioTranscode(sourceFilePath, tempFilePath, targetFormat, targetBitrate)

      // Atomically move temp file to destination cache path
      if (fs.existsSync(tempFilePath)) {
        fs.renameSync(tempFilePath, cacheFilePath)
        const finalStat = fs.statSync(/*turbopackIgnore: true*/ cacheFilePath)
        return {
          filePath: cacheFilePath,
          mimeType:
            AUDIO_MIME_MAP[targetFormat] || (targetFormat === 'flac' ? 'audio/flac' : 'audio/mpeg'),
          isFromCache: false,
          size: finalStat.size,
          mtimeMs: finalStat.mtimeMs,
        }
      }
      throw new Error('Transcoded file was not created')
    } catch (err) {
      console.error(`Audio transcode failed for ${sourceFilePath}:`, err.message)
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath)
      } catch {}

      // Fallback transcode to MP3 320k if FLAC failed
      if (targetFormat === 'flac') {
        try {
          const fallbackTemp = `${cacheHash}.fb.tmp.${Date.now()}.mp3`
          const fallbackTempPath = path.join(AUDIO_CACHE_DIR, fallbackTemp)
          await executeFallbackMp3Transcode(sourceFilePath, fallbackTempPath)
          if (fs.existsSync(fallbackTempPath)) {
            const fallbackCachePath = path.join(AUDIO_CACHE_DIR, `${cacheHash}.mp3`)
            fs.renameSync(fallbackTempPath, fallbackCachePath)
            const fbStat = fs.statSync(/*turbopackIgnore: true*/ fallbackCachePath)
            return {
              filePath: fallbackCachePath,
              mimeType: 'audio/mpeg',
              isFromCache: false,
              size: fbStat.size,
              mtimeMs: fbStat.mtimeMs,
            }
          }
        } catch (fallbackErr) {
          console.error('Fallback MP3 transcode also failed:', fallbackErr.message)
        }
      }

      // If source is already compressed (e.g. MP3/FLAC master), return it as fallback
      if (!isUncompressedSource) {
        return {
          filePath: sourceFilePath,
          mimeType: AUDIO_MIME_MAP[ext] || 'application/octet-stream',
          isFromCache: false,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
        }
      }

      throw err
    } finally {
      ACTIVE_TRANSCODE_PROMISES.delete(cacheHash)
    }
  })()

  ACTIVE_TRANSCODE_PROMISES.set(cacheHash, transcodePromise)
  return transcodePromise
}

/**
 * Checks if a specific audio quality tier variant is already transcoded and cached on disk.
 *
 * @param {string} sourceFilePath
 * @param {Object} options
 * @returns {boolean}
 */
export function isAudioVariantCached(sourceFilePath, options = {}) {
  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) return false
    const stat = fs.statSync(sourceFilePath)
    if (!stat.isFile()) return false

    const ext = path.extname(sourceFilePath).toLowerCase().replace('.', '')
    const isUncompressedSource = ext === 'wav' || ext === 'aiff' || ext === 'aif' || ext === 'pcm'

    const { quality = 'high', bitrate = null, format = 'mp3' } = options

    const isLosslessRequested =
      quality === 'original' ||
      quality === 'lossless' ||
      bitrate === 'original' ||
      bitrate === 'lossless' ||
      format === 'flac'

    if (isLosslessRequested && !isUncompressedSource) {
      return true
    }

    const { cacheFileName } = computeAudioCacheKey(sourceFilePath, stat, options)
    const cacheFilePath = path.join(AUDIO_CACHE_DIR, cacheFileName)

    return fs.existsSync(cacheFilePath) && fs.statSync(cacheFilePath).size > 0
  } catch {
    return false
  }
}

/**
 * Checks whether all standard audio stream variants are present in the disk cache.
 *
 * @param {string} sourceFilePath
 * @returns {boolean}
 */
export function isAudioFullyCached(sourceFilePath) {
  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) return false
    return STANDARD_AUDIO_VARIANTS.every((variant) => isAudioVariantCached(sourceFilePath, variant))
  } catch {
    return false
  }
}

/**
 * Pre-transcodes and caches all standard audio stream variations for instant zero-latency playback.
 *
 * @param {string} sourceFilePath
 * @param {Array<Object>} [variants=STANDARD_AUDIO_VARIANTS]
 * @param {Object} [jobOptions={}]
 * @returns {Promise<{ total: number, generated: number, cached: number }>}
 */
export async function optimizeAndCacheAudio(
  sourceFilePath,
  variants = STANDARD_AUDIO_VARIANTS,
  jobOptions = {},
) {
  const fileName = path.basename(sourceFilePath || '')
  const jobId =
    jobOptions.jobId ||
    `aud_${crypto
      .createHash('md5')
      .update(sourceFilePath || '')
      .digest('hex')
      .slice(0, 8)}_${Date.now()}`
  const targetLabel = jobOptions.target || fileName

  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) {
      return { total: 0, generated: 0, cached: 0 }
    }

    const ext = path.extname(sourceFilePath).toLowerCase().replace('.', '')
    createJob({
      id: jobId,
      type: 'audio',
      file: fileName,
      target: targetLabel,
      totalSteps: variants.length,
      details: {
        sourcePath: sourceFilePath,
        sourceFormat: ext,
      },
    })

    let generated = 0
    let cached = 0

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i]
      const tierName =
        variant.format === 'flac' || variant.quality === 'lossless'
          ? 'Lossless FLAC Master'
          : `${variant.format?.toUpperCase() || 'MP3'} ${variant.bitrate || '320k'}`

      const stepDescription = `Transcoding Tier ${i + 1}/${variants.length}: ${tierName}`

      updateJobProgress(jobId, {
        currentStep: stepDescription,
        completedSteps: i,
        progress: Math.round((i / variants.length) * 100),
      })

      if (isAudioVariantCached(sourceFilePath, variant)) {
        cached++
      } else {
        await getOptimizedAudio(sourceFilePath, variant)
        generated++
      }
    }

    completeJob(jobId, {
      summary: `Audio transcoding complete (${generated} generated, ${cached} cached)`,
      generated,
      cached,
      total: variants.length,
    })

    return { total: variants.length, generated, cached }
  } catch (err) {
    console.error(`Failed to pre-cache audio variants for ${sourceFilePath}:`, err)
    failJob(jobId, err)
    return { total: variants.length, generated: 0, cached: 0 }
  }
}
