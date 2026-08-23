import fs from 'fs'
import path from 'path'
import { slugify } from '@/lib/data/slugs'

/**
 * Safely renames a file or directory with exponential retry backoff for Windows EBUSY locks.
 *
 * @param {string} oldPath
 * @param {string} newPath
 * @param {number} [maxRetries=5]
 * @param {number} [delayMs=50]
 * @returns {boolean} True if rename succeeded
 */
export function safeRenameSync(oldPath, newPath, maxRetries = 5, delayMs = 50) {
  if (!fs.existsSync(oldPath)) return false
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.renameSync(oldPath, newPath)
      return true
    } catch (err) {
      if (
        (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') &&
        attempt < maxRetries
      ) {
        const start = Date.now()
        while (Date.now() - start < delayMs * attempt) {}
      } else {
        if (attempt === maxRetries) {
          console.error(
            `Failed to rename ${oldPath} to ${newPath} after ${maxRetries} attempts:`,
            err,
          )
        }
      }
    }
  }
  return false
}

/**
 * Safely unlinks a file with retry backoff.
 *
 * @param {string} targetPath
 * @param {number} [maxRetries=3]
 * @param {number} [delayMs=50]
 * @returns {boolean} True if file unlinked
 */
export function safeUnlinkSync(targetPath, maxRetries = 3, delayMs = 50) {
  if (!fs.existsSync(targetPath)) return false
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.unlinkSync(targetPath)
      return true
    } catch (err) {
      if (
        (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') &&
        attempt < maxRetries
      ) {
        const start = Date.now()
        while (Date.now() - start < delayMs * attempt) {}
      } else {
        if (attempt === maxRetries) {
          console.error(`Failed to unlink ${targetPath} after ${maxRetries} attempts:`, err)
        }
      }
    }
  }
  return false
}

/**
 * Synchronizes audio track files on disk, processing new file uploads, track renames, and deletions.
 *
 * @param {Object} params
 * @param {FormData} params.formData - Submitted multipart form data
 * @param {Array<Object>} params.parsedTracks - Array of raw track definitions
 * @param {Array<Object>} params.oldTracks - Previous track definitions
 * @param {string} params.projectDir - Absolute directory path for the target project
 * @param {string} params.newSlug - New project URL slug
 * @returns {Promise<Array<Object>>} Formatted track objects with updated audio paths
 */
export async function syncProjectTrackFiles({
  formData,
  parsedTracks = [],
  oldTracks = [],
  projectDir,
  newSlug,
  projectName = '',
}) {
  const updatedTracks = []
  const newlyUploadedFiles = []

  // Collect all preexisting audio files to detect removals/deletions
  const existingAudioFiles = new Set(
    oldTracks
      .map((t) => (t.audio || t.audioUrl ? path.basename(t.audio || t.audioUrl) : null))
      .filter(Boolean),
  )
  const retainedAudioFiles = new Set()

  for (let i = 0; i < parsedTracks.length; i++) {
    const rawTrack = parsedTracks[i] || {}
    const tName = String(rawTrack.name || '').trim()
    const tSlug = slugify(tName) || `track-${i + 1}`
    const originalName = String(rawTrack.originalName || rawTrack.name || '').trim()
    const oldTrack =
      oldTracks.find((ot) => ot.name === originalName || ot.name === tName) || oldTracks[i] || {}

    let audioRelativeUrl = ''

    // Check for staged audio file upload for this track
    const audioFile = formData.get(`track_${i}_audioFile`) || formData.get(`audioFile_${i}`)
    if (audioFile && typeof audioFile.arrayBuffer === 'function') {
      const ext = path.extname(audioFile.name || '.wav').toLowerCase() || '.wav'
      const audioFileName = `${tSlug}${ext}`
      const audioDestPath = path.join(/*turbopackIgnore: true*/ projectDir, audioFileName)

      const buffer = Buffer.from(await audioFile.arrayBuffer())
      fs.writeFileSync(/*turbopackIgnore: true*/ audioDestPath, buffer)
      audioRelativeUrl = `/api/audio/${newSlug}/${audioFileName}`
      retainedAudioFiles.add(audioFileName)

      newlyUploadedFiles.push({
        filePath: audioDestPath,
        target: `${projectName || newSlug} - Track: "${tName || `Track ${i + 1}`}"`,
        details: {
          projectSlug: newSlug,
          projectName: projectName || newSlug,
          trackSlug: tSlug,
          trackName: tName || `Track ${i + 1}`,
          fileName: audioFileName,
        },
      })
    } else if (rawTrack.audio) {
      // Audio was preserved by the client (rawTrack.audio is non-empty)
      const oldAudioUrl = rawTrack.audio || oldTrack.audio || oldTrack.audioUrl || ''
      const oldFileName = path.basename(oldAudioUrl)
      const oldExt = path.extname(oldFileName)
      const expectedFileName = `${tSlug}${oldExt}`

      if (oldFileName && oldFileName !== expectedFileName) {
        const oldFilePath = path.join(/*turbopackIgnore: true*/ projectDir, oldFileName)
        const newFilePath = path.join(/*turbopackIgnore: true*/ projectDir, expectedFileName)
        if (fs.existsSync(/*turbopackIgnore: true*/ oldFilePath)) {
          safeRenameSync(oldFilePath, newFilePath)
          audioRelativeUrl = `/api/audio/${newSlug}/${expectedFileName}`
          retainedAudioFiles.add(expectedFileName)
        } else {
          audioRelativeUrl = `/api/audio/${newSlug}/${oldFileName}`
          retainedAudioFiles.add(oldFileName)
        }
      } else {
        audioRelativeUrl = `/api/audio/${newSlug}/${oldFileName}`
        retainedAudioFiles.add(oldFileName)
      }
    } else {
      // Audio was explicitly removed by the client or never existed
      audioRelativeUrl = ''
    }

    updatedTracks.push({
      name: tName,
      artist: String(rawTrack.artist || '').trim(),
      audio: audioRelativeUrl,
      hasAudio: Boolean(audioRelativeUrl),
      links: rawTrack.links || {},
    })
  }

  // Safely unlink any orphaned audio files on disk that were removed or belonged to deleted tracks
  for (const oldFile of existingAudioFiles) {
    if (!retainedAudioFiles.has(oldFile)) {
      const oldFilePath = path.join(/*turbopackIgnore: true*/ projectDir, oldFile)
      safeUnlinkSync(oldFilePath)
    }
  }

  return { updatedTracks, newlyUploadedFiles }
}
