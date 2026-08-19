import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { createJob, updateJobProgress, completeJob, failJob } from './jobTracker'

const execFileAsync = promisify(execFile)

export const AUDIO_CACHE_DIR = path.join(process.cwd(), 'data', 'cache', 'audio')
const ACTIVE_TRANSCODE_PROMISES = new Map()

/**
 * Computes deterministic cache key, filename, and format parameters for an audio transcode variant.
 */
export function computeAudioCacheKey(sourceFilePath, stat, options = {}) {
  const {
    quality = 'high',
    bitrate = null,
    format = 'mp3',
  } = options

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
 * Checks if ffmpeg is available in the execution environment
 */
let ffmpegAvailable = null
export async function isFfmpegAvailable() {
  if (ffmpegAvailable !== null) return ffmpegAvailable
  try {
    await execFileAsync('ffmpeg', ['-version'])
    ffmpegAvailable = true
  } catch (err) {
    console.warn('FFmpeg not available, audio optimizer will serve source files directly:', err.message)
    ffmpegAvailable = false
  }
  return ffmpegAvailable
}

/**
 * Transcodes an audio file into an optimized, web-ready audio stream and stores it in data/cache/audio/
 * Fully uncompressed WAV files are NEVER delivered to the client; at lossless quality, they are
 * converted to FLAC and cached.
 *
 * @param {string} sourceFilePath - Absolute path to original audio file (e.g. 70MB WAV, FLAC, MP3)
 * @param {Object} options
 * @param {'fast' | 'medium' | 'high' | 'lossless' | 'original'} [options.quality='high'] - Audio quality tier
 * @param {string} [options.bitrate] - Target bitrate (e.g. '128k', '192k', '320k', 'lossless')
 * @param {string} [options.format='mp3'] - Output format ('mp3' | 'm4a' | 'flac')
 * @returns {Promise<{ filePath: string, mimeType: string, isFromCache: boolean, size: number, mtimeMs: number }>}
 */
export async function getOptimizedAudio(sourceFilePath, options = {}) {
  const {
    quality = 'high',
    bitrate = null,
    format = 'mp3',
  } = options

  const ext = path.extname(sourceFilePath).toLowerCase().replace('.', '')
  const stat = fs.statSync(/*turbopackIgnore: true*/ sourceFilePath)

  const isUncompressedSource = ext === 'wav' || ext === 'aiff' || ext === 'aif' || ext === 'pcm'
  const isLosslessRequested =
    quality === 'original' ||
    quality === 'lossless' ||
    bitrate === 'original' ||
    bitrate === 'lossless' ||
    format === 'flac'

  // If source is already a compressed format and lossless/original is requested,
  // we can serve the source file directly (e.g. FLAC master or MP3 master)
  if (isLosslessRequested && !isUncompressedSource) {
    return {
      filePath: sourceFilePath,
      mimeType: AUDIO_MIME_MAP[ext] || 'application/octet-stream',
      isFromCache: false,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
    }
  }

  const { cacheHash, cacheFileName, targetFormat, targetBitrate } = computeAudioCacheKey(sourceFilePath, stat, options)

  const hasFfmpeg = await isFfmpegAvailable()
  if (!hasFfmpeg) {
    // If FFmpeg is missing and source is uncompressed, return what we have but log warning
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

  // 1. Check if cached audio file already exists and has valid non-zero content
  try {
    if (fs.existsSync(cacheFilePath)) {
      const cachedStat = fs.statSync(/*turbopackIgnore: true*/ cacheFilePath)
      if (cachedStat.size > 0) {
        return {
          filePath: cacheFilePath,
          mimeType: AUDIO_MIME_MAP[targetFormat] || (targetFormat === 'flac' ? 'audio/flac' : 'audio/mpeg'),
          isFromCache: true,
          size: cachedStat.size,
          mtimeMs: cachedStat.mtimeMs,
        }
      }
    }
  } catch {}

  // 2. Check if this exact transcode job is already running to prevent duplicate ffmpeg processes
  if (ACTIVE_TRANSCODE_PROMISES.has(cacheHash)) {
    return ACTIVE_TRANSCODE_PROMISES.get(cacheHash)
  }

  // 3. Spawn ffmpeg transcoding job
  const transcodePromise = (async () => {
    const tempFileName = `${cacheHash}.tmp.${Date.now()}.${targetFormat}`
    const tempFilePath = path.join(AUDIO_CACHE_DIR, tempFileName)
    try {
      const ffmpegArgs = [
        '-y',
        '-i', sourceFilePath,
        '-vn', // Disable video streams / album art extraction
      ]

      if (targetFormat === 'mp3') {
        ffmpegArgs.push(
          '-c:a', 'libmp3lame',
          '-b:a', targetBitrate || '320k',
          '-ar', '44100',
          '-ac', '2',
          '-id3v2_version', '3',
          '-write_xing', '1',
          '-f', 'mp3'
        )
      } else if (targetFormat === 'm4a') {
        ffmpegArgs.push(
          '-c:a', 'aac',
          '-b:a', targetBitrate || '320k',
          '-ar', '44100',
          '-ac', '2',
          '-movflags', '+faststart',
          '-f', 'ipod'
        )
      } else if (targetFormat === 'flac') {
        ffmpegArgs.push(
          '-c:a', 'flac',
          '-compression_level', '5',
          '-f', 'flac'
        )
      }

      ffmpegArgs.push(tempFilePath)

      await execFileAsync('ffmpeg', ffmpegArgs)

      // Atomically move temp file to destination cache path
      if (fs.existsSync(tempFilePath)) {
        fs.renameSync(tempFilePath, cacheFilePath)
        const finalStat = fs.statSync(/*turbopackIgnore: true*/ cacheFilePath)
        return {
          filePath: cacheFilePath,
          mimeType: AUDIO_MIME_MAP[targetFormat] || (targetFormat === 'flac' ? 'audio/flac' : 'audio/mpeg'),
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

      // If transcode failed and source was uncompressed, NEVER serve raw WAV!
      // Attempt fallback transcode to MP3 320k if FLAC failed
      if (targetFormat === 'flac') {
        try {
          const fallbackTemp = `${cacheHash}.fb.tmp.${Date.now()}.mp3`
          const fallbackTempPath = path.join(AUDIO_CACHE_DIR, fallbackTemp)
          await execFileAsync('ffmpeg', [
            '-y',
            '-i', sourceFilePath,
            '-vn',
            '-c:a', 'libmp3lame',
            '-b:a', '320k',
            '-ar', '44100',
            '-ac', '2',
            '-f', 'mp3',
            fallbackTempPath,
          ])
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
 * Standard audio quality tiers supported across the application.
 */
export const STANDARD_AUDIO_VARIANTS = [
  { quality: 'high', bitrate: '320k', format: 'mp3' },
  { quality: 'fast', bitrate: '128k', format: 'mp3' },
  { quality: 'medium', bitrate: '192k', format: 'mp3' },
  { quality: 'lossless', format: 'flac' },
]

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

    const {
      quality = 'high',
      bitrate = null,
      format = 'mp3',
    } = options

    const isLosslessRequested =
      quality === 'original' ||
      quality === 'lossless' ||
      bitrate === 'original' ||
      bitrate === 'lossless' ||
      format === 'flac'

    // If source is already compressed e.g. MP3/FLAC master and lossless is requested, served directly
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
    return STANDARD_AUDIO_VARIANTS.every(variant => isAudioVariantCached(sourceFilePath, variant))
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
export async function optimizeAndCacheAudio(sourceFilePath, variants = STANDARD_AUDIO_VARIANTS, jobOptions = {}) {
  const fileName = path.basename(sourceFilePath || '')
  const jobId = jobOptions.jobId || `aud_${crypto.createHash('md5').update(sourceFilePath || '').digest('hex').slice(0, 8)}_${Date.now()}`
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
      const tierName = variant.format === 'flac' || variant.quality === 'lossless'
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
