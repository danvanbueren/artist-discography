import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

let ffmpegAvailable = null

/**
 * Checks if ffmpeg is available in the system path.
 * Caches the result in-memory.
 *
 * @returns {Promise<boolean>} True if ffmpeg command succeeds
 */
export async function isFfmpegAvailable() {
  if (ffmpegAvailable !== null) return ffmpegAvailable
  try {
    await execFileAsync('ffmpeg', ['-version'])
    ffmpegAvailable = true
  } catch (err) {
    console.warn(
      'FFmpeg not available, audio optimizer will serve source files directly:',
      err.message,
    )
    ffmpegAvailable = false
  }
  return ffmpegAvailable
}

/**
 * Executes an FFmpeg transcode command for a target format and bitrate.
 *
 * @param {string} sourceFilePath - Path to source audio file
 * @param {string} tempOutputPath - Path to write temporary transcode output
 * @param {'mp3' | 'm4a' | 'flac'} targetFormat - Target audio container/format
 * @param {string} [targetBitrate='320k'] - Bitrate string (e.g. '128k', '192k', '320k')
 * @returns {Promise<void>}
 */
export async function executeAudioTranscode(
  sourceFilePath,
  tempOutputPath,
  targetFormat,
  targetBitrate = '320k',
) {
  const ffmpegArgs = [
    '-y',
    '-i',
    sourceFilePath,
    '-vn', // Disable video streams & embedded images
  ]

  if (targetFormat === 'mp3') {
    ffmpegArgs.push(
      '-c:a',
      'libmp3lame',
      '-b:a',
      targetBitrate || '320k',
      '-ar',
      '44100',
      '-ac',
      '2',
      '-id3v2_version',
      '3',
      '-write_xing',
      '1',
      '-f',
      'mp3',
    )
  } else if (targetFormat === 'm4a') {
    ffmpegArgs.push(
      '-c:a',
      'aac',
      '-b:a',
      targetBitrate || '320k',
      '-ar',
      '44100',
      '-ac',
      '2',
      '-movflags',
      '+faststart',
      '-f',
      'ipod',
    )
  } else if (targetFormat === 'flac') {
    ffmpegArgs.push('-c:a', 'flac', '-compression_level', '5', '-f', 'flac')
  }

  ffmpegArgs.push(tempOutputPath)

  await execFileAsync('ffmpeg', ffmpegArgs)
}

/**
 * Executes a fallback MP3 320k transcode if a lossless FLAC encoding fails.
 *
 * @param {string} sourceFilePath
 * @param {string} tempOutputPath
 * @returns {Promise<void>}
 */
export async function executeFallbackMp3Transcode(sourceFilePath, tempOutputPath) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    sourceFilePath,
    '-vn',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '320k',
    '-ar',
    '44100',
    '-ac',
    '2',
    '-f',
    'mp3',
    tempOutputPath,
  ])
}

/**
 * Extracts a concise, human-readable error description from raw FFmpeg stderr output.
 *
 * @param {Error|Object|string} rawError
 * @returns {string}
 */
export function extractCleanFfmpegError(rawError) {
  if (!rawError) return 'Audio transcoding failed'
  const text = String(rawError.stderr || rawError.message || rawError)
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\[[^\]]+@\s*0x?[0-9a-fA-F]+\]\s*/g, '').trim())
    .filter(Boolean)

  const matched = lines.filter(
    (l) =>
      /invalid data found/i.test(l) ||
      /error opening/i.test(l) ||
      /failed to find/i.test(l) ||
      /unsupported codec/i.test(l) ||
      /cannot decode/i.test(l) ||
      /no such file/i.test(l) ||
      /conversion failed/i.test(l) ||
      /invalid argument/i.test(l),
  )

  const candidates = matched.length > 0 ? matched : lines
  const unique = Array.from(new Set(candidates))

  const cleanLines = unique.filter(
    (l) =>
      !l.startsWith('ffmpeg version') &&
      !l.startsWith('configuration:') &&
      !l.startsWith('built with') &&
      !l.startsWith('lib') &&
      !l.startsWith('Command failed:'),
  )

  return cleanLines.slice(-3).join('; ') || 'Audio transcoding failed'
}
