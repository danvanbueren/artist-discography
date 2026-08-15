import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const AUDIO_CACHE_DIR = path.join(process.cwd(), 'data', 'cache', 'audio')
const ACTIVE_TRANSCODE_PROMISES = new Map()

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
 *
 * @param {string} sourceFilePath - Absolute path to original audio file (e.g. 70MB WAV, FLAC, MP3)
 * @param {Object} options
 * @param {'fast' | 'high' | 'original'} [options.quality='high'] - Audio quality tier
 * @param {string} [options.bitrate] - Target bitrate (e.g. '96k', '128k', '256k', '320k')
 * @param {string} [options.format='mp3'] - Output format ('mp3' | 'm4a')
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

  // Determine target audio parameters based on quality tier
  let targetBitrate = bitrate
  let targetFormat = format === 'm4a' || format === 'aac' ? 'm4a' : 'mp3'

  if (quality === 'original' || quality === 'lossless' || bitrate === 'original' || bitrate === 'lossless') {
    // Return original uncompressed / master source
    return {
      filePath: sourceFilePath,
      mimeType: AUDIO_MIME_MAP[ext] || 'application/octet-stream',
      isFromCache: false,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
    }
  } else if (targetBitrate) {
    targetBitrate = targetBitrate.endsWith('k') ? targetBitrate : `${targetBitrate}k`
  } else if (quality === 'fast' || quality === 'low' || quality === 'preview') {
    targetBitrate = '128k'
  } else if (quality === 'medium' || quality === 'standard') {
    targetBitrate = '192k'
  } else if (quality === 'high') {
    targetBitrate = '320k'
  } else {
    targetBitrate = '320k'
  }

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

  // Generate deterministic cache hash based on source mtime, size, and transcode parameters
  const hashInput = `${sourceFilePath}:${stat.mtimeMs}:${stat.size}:q=${quality}:b=${targetBitrate}:fmt=${targetFormat}`
  const cacheHash = crypto.createHash('md5').update(hashInput).digest('hex')
  const cacheFileName = `${cacheHash}.${targetFormat}`
  const cacheFilePath = path.join(AUDIO_CACHE_DIR, cacheFileName)

  // 1. Check if cached audio file already exists and has valid non-zero content
  try {
    if (fs.existsSync(cacheFilePath)) {
      const cachedStat = fs.statSync(/*turbopackIgnore: true*/ cacheFilePath)
      if (cachedStat.size > 0) {
        return {
          filePath: cacheFilePath,
          mimeType: AUDIO_MIME_MAP[targetFormat] || 'audio/mpeg',
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
          '-b:a', targetBitrate,
          '-ar', '44100',
          '-ac', '2',
          '-id3v2_version', '3',
          '-write_xing', '1',
          '-f', 'mp3'
        )
      } else if (targetFormat === 'm4a') {
        ffmpegArgs.push(
          '-c:a', 'aac',
          '-b:a', targetBitrate,
          '-ar', '44100',
          '-ac', '2',
          '-movflags', '+faststart',
          '-f', 'ipod'
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
          mimeType: AUDIO_MIME_MAP[targetFormat] || 'audio/mpeg',
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
      // Fallback to original file on any transcode failure
      return {
        filePath: sourceFilePath,
        mimeType: AUDIO_MIME_MAP[ext] || 'application/octet-stream',
        isFromCache: false,
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      }
    } finally {
      ACTIVE_TRANSCODE_PROMISES.delete(cacheHash)
    }
  })()

  ACTIVE_TRANSCODE_PROMISES.set(cacheHash, transcodePromise)
  return transcodePromise
}
