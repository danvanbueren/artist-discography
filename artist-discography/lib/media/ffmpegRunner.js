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
