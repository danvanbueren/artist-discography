import { EventEmitter } from 'events'

// Global in-memory job store and event emitter for real-time progress broadcast
const jobEmitter = new EventEmitter()
jobEmitter.setMaxListeners(100)

const MAX_COMPLETED_JOBS = 50
const jobs = new Map()

/**
 * Creates or retrieves a media processing job.
 *
 * @param {Object} params
 * @param {string} params.id - Unique job ID
 * @param {'image' | 'audio'} params.type - Job type ('image' for Sharp, 'audio' for FFmpeg)
 * @param {string} params.file - Filename or relative path
 * @param {string} [params.target] - Friendly display label (e.g. 'Project Cover Art' or 'Track 1')
 * @param {number} [params.totalSteps=1] - Total number of sub-tasks/variants
 * @param {Object} [params.details={}] - Initial extra metadata
 * @returns {Object} The created job object
 */
export function createJob({
  id,
  type = 'image',
  file = '',
  target = '',
  totalSteps = 1,
  details = {},
}) {
  const existing = jobs.get(id)
  if (existing && existing.status === 'processing') {
    return existing
  }

  const job = {
    id,
    type,
    file,
    target: target || file,
    status: 'processing',
    progress: 0,
    currentStep: 'Starting optimization...',
    completedSteps: 0,
    totalSteps: Math.max(1, totalSteps),
    startTime: Date.now(),
    endTime: null,
    durationMs: null,
    error: null,
    details: { ...details },
  }

  jobs.set(id, job)
  pruneJobs()
  emitJobUpdate(job)
  return job
}

/**
 * Updates an ongoing job's progress and step description.
 *
 * @param {string} id
 * @param {Object} updates
 * @param {number} [updates.progress] - 0 to 100
 * @param {string} [updates.currentStep]
 * @param {number} [updates.completedSteps]
 * @param {Object} [updates.details]
 */
export function updateJobProgress(id, { progress, currentStep, completedSteps, details } = {}) {
  const job = jobs.get(id)
  if (!job) return

  if (typeof progress === 'number') {
    job.progress = Math.min(100, Math.max(0, Math.round(progress)))
  }
  if (currentStep) {
    job.currentStep = currentStep
  }
  if (typeof completedSteps === 'number') {
    job.completedSteps = completedSteps
    if (typeof progress !== 'number' && job.totalSteps > 0) {
      job.progress = Math.min(100, Math.round((job.completedSteps / job.totalSteps) * 100))
    }
  }
  if (details) {
    job.details = { ...job.details, ...details }
  }

  emitJobUpdate(job)
}

/**
 * Marks a job as successfully completed.
 *
 * @param {string} id
 * @param {Object} [finalDetails={}]
 */
export function completeJob(id, finalDetails = {}) {
  const job = jobs.get(id)
  if (!job) return

  job.status = 'completed'
  job.progress = 100
  job.completedSteps = job.totalSteps
  job.endTime = Date.now()
  job.durationMs = job.endTime - job.startTime
  job.currentStep = finalDetails.summary || 'Processing complete!'
  job.details = { ...job.details, ...finalDetails }

  emitJobUpdate(job)
}

/**
 * Marks a job as failed.
 *
 * @param {string} id
 * @param {string|Error} error
 * @param {Object} [finalDetails={}]
 */
export function failJob(id, error, finalDetails = {}) {
  const job = jobs.get(id)
  if (!job) return

  const errorMsg = error instanceof Error ? error.message : String(error || 'Unknown error occurred')
  job.status = 'failed'
  job.endTime = Date.now()
  job.durationMs = job.endTime - job.startTime
  job.error = errorMsg
  job.currentStep = `Failed: ${errorMsg}`
  job.details = { ...job.details, ...finalDetails }

  emitJobUpdate(job)
}

/**
 * Returns all current active and recent completed jobs.
 *
 * @returns {{ active: Array<Object>, completed: Array<Object>, totalCount: number }}
 */
export function getAllJobs() {
  const all = Array.from(jobs.values()).sort((a, b) => b.startTime - a.startTime)
  const active = all.filter(j => j.status === 'processing' || j.status === 'queued')
  const completed = all.filter(j => j.status === 'completed' || j.status === 'failed')

  return {
    active,
    completed,
    totalCount: all.length,
  }
}

/**
 * Clears completed and failed jobs from the store.
 */
export function clearCompletedJobs() {
  for (const [id, job] of jobs.entries()) {
    if (job.status === 'completed' || job.status === 'failed') {
      jobs.delete(id)
    }
  }
  jobEmitter.emit('jobs-cleared')
}

/**
 * Subscribes a listener to job update events.
 *
 * @param {function(Object): void} listener
 * @returns {function(): void} Unsubscribe function
 */
export function subscribeToJobs(listener) {
  jobEmitter.on('job-update', listener)
  return () => {
    jobEmitter.off('job-update', listener)
  }
}

function emitJobUpdate(job) {
  try {
    jobEmitter.emit('job-update', {
      job: { ...job },
      summary: getAllJobs(),
    })
  } catch (err) {
    console.warn('Error emitting job update:', err)
  }
}

function pruneJobs() {
  const completedKeys = []
  for (const [id, job] of jobs.entries()) {
    if (job.status === 'completed' || job.status === 'failed') {
      completedKeys.push({ id, endTime: job.endTime || job.startTime })
    }
  }

  if (completedKeys.length > MAX_COMPLETED_JOBS) {
    completedKeys.sort((a, b) => a.endTime - b.endTime)
    const toRemove = completedKeys.slice(0, completedKeys.length - MAX_COMPLETED_JOBS)
    for (const item of toRemove) {
      jobs.delete(item.id)
    }
  }
}
