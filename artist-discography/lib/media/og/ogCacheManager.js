import fs from 'fs'
import path from 'path'
import { ImageResponse } from 'next/og'
import { GeneralOgCard, ProjectOgCard, TrackOgCard } from './ogCardTemplates'
import {
  resolveGeneralOgContext,
  resolveProjectOgContext,
  resolveTrackOgContext,
} from './ogEntityResolver'
import {
  OG_CACHE_DIR,
  ensureOgCacheDir,
  readSidecar,
  writeSidecar,
  isSidecarValid,
} from './ogSidecarManager'
import { createJob, updateJobProgress, completeJob, failJob } from '@/lib/api/jobTracker'
import { loadArtistData } from '@/lib/data/artistData'
import { slugify } from '@/lib/data/slugs'

export { OG_CACHE_DIR, readSidecar, writeSidecar, isSidecarValid }

/**
 * Renders JSX card to PNG buffer using Next.js ImageResponse and saves to disk cache with JSON sidecar.
 *
 * @param {Object} context - Resolved entity context
 * @returns {Promise<{ buffer: Buffer, sidecar: Object }>}
 */
export async function renderAndCacheOgCard(context) {
  if (!context) throw new Error('Cannot render OG card without context')

  let jsx = null
  if (context.entityType === 'general') {
    jsx = (
      <GeneralOgCard
        artistName={context.artistName}
        bio={context.bio}
        logoDataUrl={context.logoDataUrl}
        backgroundDataUrl={context.backgroundDataUrl}
        primaryGradient={context.palette?.primaryGradient}
        secondaryGradient={context.palette?.secondaryGradient}
        themeColorHex={context.themeColorHex}
        displayPlatforms={context.displayPlatforms}
        socialLinks={context.socialLinks}
        stats={context.stats}
      />
    )
  } else if (context.entityType === 'project') {
    jsx = (
      <ProjectOgCard
        projectName={context.projectName}
        projectArtist={context.projectArtist}
        releaseDate={context.releaseDate}
        projectType={context.projectType}
        coverDataUrl={context.coverDataUrl}
        logoDataUrl={context.logoDataUrl}
        backgroundDataUrl={context.backgroundDataUrl}
        primaryGradient={context.palette?.primaryGradient}
        themeColorHex={context.themeColorHex}
        trackCount={context.trackCount}
        formattedDuration={context.formattedDuration}
      />
    )
  } else if (context.entityType === 'track') {
    jsx = (
      <TrackOgCard
        trackName={context.trackName}
        trackArtist={context.trackArtist}
        releaseDate={context.releaseDate}
        projectName={context.projectName}
        projectType={context.projectType}
        coverDataUrl={context.coverDataUrl}
        logoDataUrl={context.logoDataUrl}
        backgroundDataUrl={context.backgroundDataUrl}
        primaryGradient={context.palette?.primaryGradient}
        themeColorHex={context.themeColorHex}
        formattedDuration={context.formattedDuration}
      />
    )
  } else {
    throw new Error(`Unknown OG entity type: ${context.entityType}`)
  }

  const imageResponse = new ImageResponse(jsx, {
    width: 1200,
    height: 630,
  })

  const arrayBuffer = await imageResponse.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  ensureOgCacheDir()
  const pngPath = path.join(OG_CACHE_DIR, `${context.hash}.png`)
  const tempPath = `${pngPath}.${process.pid}.${Date.now()}.tmp`

  try {
    fs.writeFileSync(tempPath, buffer)
    fs.renameSync(tempPath, pngPath)
  } catch (err) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    } catch {}
  }

  const sidecarData = {
    entityType: context.entityType,
    slug: context.slug || '',
    imageFileName: `${context.hash}.png`,
    generatedAt: new Date().toISOString(),
    themeColorHex: context.palette?.themeColorHex || '#5865F2',
    palette: context.palette,
    sourceFingerprint: context.fingerprint,
    metadata: {
      title: context.trackName || context.projectName || context.artistName,
      artist: context.trackArtist || context.projectArtist || context.artistName,
      formattedDuration: context.formattedDuration,
      trackCount: context.trackCount,
    },
  }

  writeSidecar(context.hash, sidecarData)

  return { buffer, sidecar: sidecarData }
}

/**
 * Retrieves cached OG card or renders and caches on-demand.
 *
 * @param {Object} [params={}]
 * @param {string} [params.projSlug]
 * @param {string} [params.trackSlug]
 * @returns {Promise<{ buffer: Buffer, sidecar: Object, isFromCache: boolean }>}
 */
export async function getOrRenderOgCard(params = {}) {
  const { projSlug, trackSlug } = params
  let context = null

  if (projSlug && trackSlug) {
    context = await resolveTrackOgContext(projSlug, trackSlug)
  }
  if (!context && projSlug) {
    context = await resolveProjectOgContext(projSlug)
  }
  if (!context) {
    context = await resolveGeneralOgContext()
  }

  const pngPath = path.join(OG_CACHE_DIR, `${context.hash}.png`)
  const isValid = isSidecarValid(context.hash, context.fingerprint)

  if (isValid && fs.existsSync(pngPath)) {
    try {
      const cachedBuffer = fs.readFileSync(pngPath)
      if (cachedBuffer.length > 0) {
        const sidecar = readSidecar(context.hash)
        return {
          buffer: cachedBuffer,
          sidecar,
          isFromCache: true,
          hash: context.hash,
        }
      }
    } catch (err) {
      // Read failure, fall through to re-render
    }
  }

  const result = await renderAndCacheOgCard(context)
  return {
    buffer: result.buffer,
    sidecar: result.sidecar,
    isFromCache: false,
    hash: context.hash,
  }
}

/**
 * Validates, re-renders stale cards, and caches all Open Graph cards for the entire discography.
 *
 * @param {Object} [jobOptions={}]
 * @returns {Promise<{ total: number, generated: number, cached: number }>}
 */
export async function validateAndWarmAllOgCards(jobOptions = {}) {
  const jobId = jobOptions.jobId || `og_warm_${Date.now()}`
  const targetLabel = jobOptions.target || 'Open Graph Preview Cards'

  try {
    const artistResult = loadArtistData()
    const discography = artistResult?.data ?? {}
    const publicProjects = (discography?.projects ?? []).filter((p) => p.visibility !== 'private')

    const targets = [{ type: 'general', label: 'General Discography Card' }]
    for (const proj of publicProjects) {
      const pSlug = proj.slug || slugify(proj.name)
      if (!pSlug) continue
      targets.push({
        type: 'project',
        projSlug: pSlug,
        label: `Project: ${proj.name || pSlug}`,
      })
      for (const track of proj.tracks || []) {
        const tSlug = slugify(track.name)
        if (!tSlug) continue
        targets.push({
          type: 'track',
          projSlug: pSlug,
          trackSlug: tSlug,
          label: `Track: ${track.name || tSlug}`,
        })
      }
    }

    createJob({
      id: jobId,
      type: 'og',
      file: 'og-cards',
      target: targetLabel,
      totalSteps: targets.length,
      details: {
        totalEntities: targets.length,
      },
    })

    let generated = 0
    let cached = 0
    const activeHashes = new Set()

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i]
      updateJobProgress(jobId, {
        currentStep: `Validating ${item.label} (${i + 1}/${targets.length})`,
        completedSteps: i,
        progress: Math.round((i / targets.length) * 100),
      })

      try {
        const res = await getOrRenderOgCard({
          projSlug: item.projSlug,
          trackSlug: item.trackSlug,
        })
        if (res.hash) activeHashes.add(res.hash)
        if (res.isFromCache) {
          cached++
        } else {
          generated++
        }
      } catch (err) {
        console.warn(`Error generating OG card for ${item.label}:`, err.message)
      }
    }

    // Prune orphaned OG cache files
    try {
      if (fs.existsSync(OG_CACHE_DIR)) {
        const files = fs.readdirSync(OG_CACHE_DIR)
        for (const file of files) {
          const hash = file.replace(/\.(png|json)$/i, '')
          if (!activeHashes.has(hash)) {
            try {
              fs.unlinkSync(path.join(OG_CACHE_DIR, file))
            } catch {}
          }
        }
      }
    } catch {}

    completeJob(jobId, {
      summary: `OG Cards ready (${generated} generated, ${cached} cached)`,
      generated,
      cached,
      total: targets.length,
    })

    return { total: targets.length, generated, cached }
  } catch (err) {
    console.error('Failed to validate/warm OG cards:', err.message)
    failJob(jobId, err, { error: err.message })
    return { total: 0, generated: 0, cached: 0, error: err.message }
  }
}
