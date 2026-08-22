import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { NextResponse } from 'next/server'
import { getOptimizedAudio } from '@/lib/media/audioOptimizer'
import { loadProjectData, loadConfigData } from '@/lib/data/artistData'
import { recordBandwidthUsage } from '@/lib/data/analyticsStorage'

const AUDIO_MIME_TYPES = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.mp4': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.webm': 'audio/webm',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers':
    'Range, Content-Type, Accept-Encoding, Cache-Control, If-None-Match, If-Range, Authorization',
  'Access-Control-Expose-Headers':
    'Content-Length, Content-Range, Accept-Ranges, ETag, Last-Modified, X-Audio-Cache',
}

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  })
}

async function resolveAudioRequest(request, params) {
  const resolvedParams = await params
  const pathSegments = resolvedParams?.path ?? []
  if (!pathSegments || pathSegments.length === 0) {
    return {
      errorResponse: new NextResponse('Audio path not specified', {
        status: 400,
        headers: CORS_HEADERS,
      }),
    }
  }

  // Gate private or uncleared audio files behind private access authentication
  let projectSlug = null
  if (pathSegments[0] === 'projects' && pathSegments.length > 1) {
    projectSlug = pathSegments[1]
  } else if (pathSegments[0] !== 'projects' && pathSegments[0] !== 'audio') {
    projectSlug = pathSegments[0]
  }

  const { searchParams } = new URL(request.url)
  const tokenParam = searchParams.get('token') || searchParams.get('auth')

  if (projectSlug) {
    const matchedProj = loadProjectData(projectSlug)
    if (matchedProj) {
      const isGated = matchedProj.visibility === 'private' || matchedProj.copyright === 'uncleared'
      if (isGated) {
        let isAuth = request.cookies.get('private_access_auth')?.value === 'true'
        if (!isAuth && tokenParam) {
          const cfg = loadConfigData()?.data
          const configuredCode = String(cfg?.privateAccessCode || '').trim()
          if (tokenParam === 'true' || (configuredCode && tokenParam === configuredCode)) {
            isAuth = true
          }
        }
        if (!isAuth) {
          return {
            errorResponse: new NextResponse(
              'Private access code authentication required to stream this track',
              {
                status: 403,
                headers: CORS_HEADERS,
              },
            ),
          }
        }
      }
    }
  }

  const dataDir = path.join(process.cwd(), 'data')
  const requestedPath = pathSegments.join('/')

  // Prevent directory traversal attacks
  const fullProjectsPath = path.resolve(path.join(dataDir, 'projects', requestedPath))
  const fullAudioPath = path.resolve(path.join(dataDir, 'audio', requestedPath))
  const fallbackPath = path.resolve(path.join(dataDir, requestedPath))

  let sourceFilePath = null
  if (
    fallbackPath.startsWith(dataDir) &&
    fs.existsSync(fallbackPath) &&
    fs.statSync(/*turbopackIgnore: true*/ fallbackPath).isFile()
  ) {
    sourceFilePath = fallbackPath
  } else if (
    fullProjectsPath.startsWith(dataDir) &&
    fs.existsSync(fullProjectsPath) &&
    fs.statSync(/*turbopackIgnore: true*/ fullProjectsPath).isFile()
  ) {
    sourceFilePath = fullProjectsPath
  } else if (
    fullAudioPath.startsWith(dataDir) &&
    fs.existsSync(fullAudioPath) &&
    fs.statSync(/*turbopackIgnore: true*/ fullAudioPath).isFile()
  ) {
    sourceFilePath = fullAudioPath
  }

  if (!sourceFilePath) {
    return {
      errorResponse: new NextResponse('Audio file not found', {
        status: 404,
        headers: CORS_HEADERS,
      }),
    }
  }

  const quality =
    searchParams.get('q') ||
    searchParams.get('quality') ||
    (searchParams.has('b') || searchParams.has('bitrate') ? 'custom' : 'high')
  const bitrate = searchParams.get('b') || searchParams.get('bitrate') || null
  const format =
    searchParams.get('fmt') ||
    searchParams.get('format') ||
    (quality === 'lossless' ||
    quality === 'original' ||
    bitrate === 'lossless' ||
    bitrate === 'original'
      ? 'flac'
      : 'mp3')

  // Process & retrieve optimized audio variant from data/cache/audio/
  const optimized = await getOptimizedAudio(sourceFilePath, {
    quality,
    bitrate,
    format,
  })

  const targetFilePath = optimized.filePath
  const ext = path.extname(targetFilePath).toLowerCase()
  const mimeType = optimized.mimeType || AUDIO_MIME_TYPES[ext] || 'application/octet-stream'
  const stat = fs.statSync(/*turbopackIgnore: true*/ targetFilePath)
  const fileSize = optimized.size || stat.size
  const etag = `W/"audio-${fileSize.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}-q${quality}-b${bitrate || 'def'}-f${ext.replace('.', '')}"`
  const lastModified = new Date(stat.mtimeMs).toUTCString()
  const cacheControl = 'public, max-age=86400, stale-while-revalidate=604800'

  return {
    targetFilePath,
    fileSize,
    mimeType,
    etag,
    lastModified,
    cacheControl,
    optimized,
    projectSlug,
  }
}

export async function HEAD(request, { params }) {
  try {
    const resolved = await resolveAudioRequest(request, params)
    if (resolved.errorResponse) return resolved.errorResponse

    const { fileSize, mimeType, etag, lastModified, cacheControl, optimized } = resolved

    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ...CORS_HEADERS,
          ETag: etag,
          'Cache-Control': cacheControl,
          'Last-Modified': lastModified,
          'X-Audio-Cache': optimized.isFromCache ? 'HIT' : 'MISS',
        },
      })
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize.toString(),
        'Content-Type': mimeType,
        'Cache-Control': cacheControl,
        ETag: etag,
        'Last-Modified': lastModified,
        'X-Audio-Cache': optimized.isFromCache ? 'HIT' : 'MISS',
      },
    })
  } catch (err) {
    console.error('Error handling HEAD for audio file:', err)
    return new NextResponse(null, {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
}

export async function GET(request, { params }) {
  try {
    const resolved = await resolveAudioRequest(request, params)
    if (resolved.errorResponse) return resolved.errorResponse

    const {
      targetFilePath,
      fileSize,
      mimeType,
      etag,
      lastModified,
      cacheControl,
      optimized,
      projectSlug,
    } = resolved

    // HTTP 304 Validation
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ...CORS_HEADERS,
          ETag: etag,
          'Cache-Control': cacheControl,
          'Last-Modified': lastModified,
          'X-Audio-Cache': optimized.isFromCache ? 'HIT' : 'MISS',
        },
      })
    }

    const rangeHeader = request.headers.get('range')
    const ifRange = request.headers.get('if-range')
    const isRangeValid = !ifRange || ifRange === etag || ifRange === lastModified

    // Handle HTTP Range Requests for HTML5 Audio seeking and initial chunk buffering
    if (rangeHeader && isRangeValid) {
      const match = rangeHeader.trim().match(/^bytes=(\d*)-(\d*)$/)
      if (match) {
        let start = match[1] ? parseInt(match[1], 10) : null
        let end = match[2] ? parseInt(match[2], 10) : null

        if (start === null && end !== null) {
          // Suffix range: bytes=-500 -> last 500 bytes
          const suffixLength = end
          if (suffixLength === 0) {
            return new NextResponse(null, {
              status: 416,
              headers: {
                ...CORS_HEADERS,
                'Content-Range': `bytes */${fileSize}`,
                'Accept-Ranges': 'bytes',
              },
            })
          }
          start = Math.max(0, fileSize - suffixLength)
          end = fileSize - 1
        } else if (start !== null) {
          if (end === null || end >= fileSize) {
            // Open-ended range (bytes=start-) or oversized end -> clamp to fileSize - 1
            end = fileSize - 1
          }
        }

        if (start === null || isNaN(start) || start >= fileSize || start > end) {
          return new NextResponse(null, {
            status: 416,
            headers: {
              ...CORS_HEADERS,
              'Content-Range': `bytes */${fileSize}`,
              'Accept-Ranges': 'bytes',
            },
          })
        }

        const chunkSize = end - start + 1
        const fileStream = fs.createReadStream(targetFilePath, { start, end })
        const stream = Readable.toWeb(fileStream)

        recordBandwidthUsage({ bytes: chunkSize, type: 'audio', projectSlug })

        return new NextResponse(stream, {
          status: 206,
          headers: {
            ...CORS_HEADERS,
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': mimeType,
            'Cache-Control': cacheControl,
            ETag: etag,
            'Last-Modified': lastModified,
            'X-Audio-Cache': optimized.isFromCache ? 'HIT' : 'MISS',
          },
        })
      }
    }

    // Standard Full Response
    const fileStream = fs.createReadStream(targetFilePath)
    const stream = Readable.toWeb(fileStream)

    recordBandwidthUsage({ bytes: fileSize, type: 'audio', projectSlug })

    return new NextResponse(stream, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize.toString(),
        'Content-Type': mimeType,
        'Cache-Control': cacheControl,
        ETag: etag,
        'Last-Modified': lastModified,
        'X-Audio-Cache': optimized.isFromCache ? 'HIT' : 'MISS',
      },
    })
  } catch (err) {
    console.error('Error streaming audio file:', err)
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
}
