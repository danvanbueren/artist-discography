import fs from 'fs'
import path from 'path'

const MAX_BACKUPS_TO_KEEP = 15

/**
 * Creates an automated timestamped snapshot backup in data/backups/
 * Bounded to keep the latest MAX_BACKUPS_TO_KEEP files for a given prefix.
 *
 * @param {string} sourceFilePath - Path to source file to backup
 * @param {string} [prefix='config'] - Backup filename prefix (e.g. 'config', 'project-slug')
 * @returns {string|null} Path to the created backup file or null on failure
 */
export function createRollingBackup(sourceFilePath, prefix = 'config') {
  try {
    if (!sourceFilePath || !fs.existsSync(sourceFilePath)) return null

    const dataDir = path.join(process.cwd(), 'data')
    const backupsDir = path.join(dataDir, 'backups')
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_')
    const backupFile = path.join(backupsDir, `${safePrefix}-${timestamp}.json`)
    fs.copyFileSync(sourceFilePath, backupFile)

    // Maintain bounded rolling window for this prefix
    try {
      const existingBackups = fs
        .readdirSync(backupsDir)
        .filter((f) => f.startsWith(`${safePrefix}-`) && f.endsWith('.json'))
        .map((f) => {
          const full = path.join(backupsDir, f)
          return { name: f, fullPath: full, time: fs.statSync(full).mtimeMs }
        })
        .sort((a, b) => b.time - a.time)

      if (existingBackups.length > MAX_BACKUPS_TO_KEEP) {
        for (const oldBackup of existingBackups.slice(MAX_BACKUPS_TO_KEEP)) {
          try {
            fs.unlinkSync(oldBackup.fullPath)
          } catch {}
        }
      }
    } catch (pruneErr) {
      console.warn('Warning during rolling backup pruning:', pruneErr)
    }

    return backupFile
  } catch (err) {
    console.warn('Warning: Failed to create rolling snapshot backup:', err)
    return null
  }
}

/**
 * Safely archives a malformed/corrupted JSON file to data/<prefix>.corrupted-<timestamp>.json
 * before any fallback scaffolding is initialized.
 *
 * @param {string} filePath - Path of corrupted file
 * @param {string} rawContent - Raw corrupted string content
 * @param {string} [prefix='config'] - Archival prefix
 * @returns {string|null} Path to archived file
 */
export function archiveMalformedFile(filePath, rawContent, prefix = 'config') {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_')
    const corruptedPath = path.join(dataDir, `${safePrefix}.corrupted-${timestamp}.json`)
    fs.writeFileSync(corruptedPath, rawContent, 'utf8')
    console.error(`CRITICAL: Malformed JSON file archived to ${corruptedPath}`)
    return corruptedPath
  } catch (err) {
    console.error('Failed to archive corrupted JSON file:', err)
    return null
  }
}

/**
 * Attempts heuristic syntax repairs on corrupted JSON strings
 * (removes JS comments, strips trailing commas, auto-closes unclosed quotes and braces).
 *
 * @param {string} raw - Raw corrupted JSON string
 * @returns {Object|null} Parsed object or null if repair is impossible
 */
export function tryHeuristicJsonRepair(raw) {
  if (typeof raw !== 'string') return null
  let text = raw.trim()
  if (!text) return null

  // 1. Remove JavaScript-style comments (// and /* */)
  text = text.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1').trim()

  // 2. Remove trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, '$1')

  // 3. Try standard parse
  try {
    return JSON.parse(text)
  } catch {}

  // 4. Check for unclosed string quote
  const quoteCount = (text.match(/(?<!\\)"/g) || []).length
  if (quoteCount % 2 !== 0) {
    text += '"'
  }

  // 5. Clean any trailing commas again
  text = text.replace(/,\s*([}\]])/g, '$1')

  // 6. Fix missing closing brackets/braces in matching nesting order
  const stack = []
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (ch === '{') stack.push('}')
      else if (ch === '[') stack.push(']')
      else if (ch === '}' || ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop()
        }
      }
    }
  }

  while (stack.length > 0) {
    text += stack.pop()
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * Atomically writes JSON data to disk using an adjacent temporary swap file
 * to eliminate partial write corruption.
 *
 * @param {string} filePath - Target file path
 * @param {Object} data - JavaScript data object to stringify
 */
export function atomicWriteJson(filePath, data) {
  const dirPath = path.dirname(filePath)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  const baseName = path.basename(filePath)
  const rand = Math.random().toString(36).substring(2, 8)
  const tempPath = path.join(dirPath, `.${baseName}.tmp.${process.pid}.${Date.now()}.${rand}`)
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8')

  const maxRetries = 5
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.renameSync(tempPath, filePath)
      return
    } catch (err) {
      if (
        (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') &&
        attempt < maxRetries
      ) {
        const start = Date.now()
        while (Date.now() - start < 40 * attempt) {}
      } else {
        if (attempt === maxRetries) {
          // If rename completely fails, fallback to direct write and clean temporary file
          try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
            try {
              fs.unlinkSync(tempPath)
            } catch {}
            return
          } catch (writeErr) {
            console.error(`Failed atomic write swap for ${filePath}:`, err)
            throw writeErr
          }
        }
      }
    }
  }
}
