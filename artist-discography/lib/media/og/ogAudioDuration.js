import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const DURATION_CACHE = new Map()

/**
 * Formats a duration in seconds to standard playback timestamp (e.g., '2:54' or '1:14:05').
 *
 * @param {number} totalSeconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(totalSeconds) {
  if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds <= 0) {
    return '0:00'
  }

  const rounded = Math.round(totalSeconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60

  const paddedSeconds = seconds.toString().padStart(2, '0')

  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, '0')
    return `${hours}:${paddedMinutes}:${paddedSeconds}`
  }

  return `${minutes}:${paddedSeconds}`
}

/**
 * Probes the duration of an audio file in seconds using ffprobe.
 * Caches results in memory based on file modification timestamp and size.
 *
 * @param {string} filePath - Absolute path to audio file
 * @returns {Promise<number|null>} Duration in seconds or null if probing fails
 */
export async function probeAudioDurationSeconds(filePath) {
  if (!filePath || typeof filePath !== 'string') return null

  try {
    if (!fs.existsSync(filePath)) return null
    const stat = fs.statSync(filePath)
    if (!stat.isFile()) return null

    const cacheKey = `${filePath}:${stat.mtimeMs}:${stat.size}`
    if (DURATION_CACHE.has(cacheKey)) {
      return DURATION_CACHE.get(cacheKey)
    }

    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ])

    const durationVal = parseFloat(stdout.trim())
    if (!isNaN(durationVal) && durationVal > 0) {
      if (DURATION_CACHE.size >= 500) {
        const oldest = DURATION_CACHE.keys().next().value
        DURATION_CACHE.delete(oldest)
      }
      DURATION_CACHE.set(cacheKey, durationVal)
      return durationVal
    }
  } catch (err) {
    // Non-fatal ffprobe error
  }

  return null
}

/**
 * Resolves local audio file path for a track inside data/projects/<projectSlug>/.
 *
 * @param {string} projectSlug
 * @param {Object} track
 * @returns {string|null} Full path to track audio file or null
 */
export function resolveTrackAudioPath(projectSlug, track) {
  if (!projectSlug || !track) return null
  const projectsDir = path.join(process.cwd(), 'data', 'projects', projectSlug)

  if (track.audioFile && typeof track.audioFile === 'string') {
    const candidate = path.join(projectsDir, track.audioFile)
    if (fs.existsSync(candidate)) return candidate
  }

  const baseAudioName = (track.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const exts = ['.wav', '.mp3', '.flac', '.m4a', '.aac', '.ogg', '.webm']

  for (const ext of exts) {
    const candidate = path.join(projectsDir, `${baseAudioName}${ext}`)
    if (fs.existsSync(candidate)) return candidate
  }

  // Also check if directory contains matching files
  try {
    if (fs.existsSync(projectsDir)) {
      const files = fs.readdirSync(projectsDir)
      for (const file of files) {
        const ext = path.extname(file).toLowerCase()
        if (exts.includes(ext)) {
          const stem = path.basename(file, ext).toLowerCase()
          if (
            stem === baseAudioName ||
            stem.includes(baseAudioName) ||
            baseAudioName.includes(stem)
          ) {
            return path.join(projectsDir, file)
          }
        }
      }
    }
  } catch {}

  return null
}

/**
 * Computes total playback duration in seconds for all tracks in a project.
 *
 * @param {string} projectSlug
 * @param {Array<Object>} tracks
 * @returns {Promise<{ totalSeconds: number, formattedDuration: string }>}
 */
export async function computeProjectAudioDuration(projectSlug, tracks = []) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return { totalSeconds: 0, formattedDuration: '0:00' }
  }

  let totalSeconds = 0
  for (const track of tracks) {
    const audioPath = resolveTrackAudioPath(projectSlug, track)
    if (audioPath) {
      const sec = await probeAudioDurationSeconds(audioPath)
      if (sec) {
        totalSeconds += sec
      }
    }
  }

  return {
    totalSeconds,
    formattedDuration: formatDuration(totalSeconds),
  }
}
