import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

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

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const pathSegments = resolvedParams?.path ?? []
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Audio path not specified', { status: 400 })
    }

    const dataDir = path.join(process.cwd(), 'data')
    const requestedPath = pathSegments.join('/')
    
    // Prevent directory traversal attacks
    const fullProjectsPath = path.resolve(path.join(dataDir, 'projects', requestedPath))
    const fullAudioPath = path.resolve(path.join(dataDir, 'audio', requestedPath))
    const fallbackPath = path.resolve(path.join(dataDir, requestedPath))

    let targetFilePath = null
    if (fallbackPath.startsWith(dataDir) && fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
      targetFilePath = fallbackPath
    } else if (fullProjectsPath.startsWith(dataDir) && fs.existsSync(fullProjectsPath) && fs.statSync(fullProjectsPath).isFile()) {
      targetFilePath = fullProjectsPath
    } else if (fullAudioPath.startsWith(dataDir) && fs.existsSync(fullAudioPath) && fs.statSync(fullAudioPath).isFile()) {
      targetFilePath = fullAudioPath
    }

    if (!targetFilePath) {
      return new NextResponse('Audio file not found', { status: 404 })
    }

    const ext = path.extname(targetFilePath).toLowerCase()
    const mimeType = AUDIO_MIME_TYPES[ext] || 'application/octet-stream'
    const stat = fs.statSync(targetFilePath)
    const fileSize = stat.size

    // Handle HTTP Range Requests for HTML5 Audio seeking
    const rangeHeader = request.headers.get('range')
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

      if (isNaN(start) || start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        })
      }

      const chunkSize = end - start + 1
      const fileStream = fs.createReadStream(targetFilePath, { start, end })

      // Convert Node read stream to Web ReadableStream
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', chunk => controller.enqueue(chunk))
          fileStream.on('end', () => controller.close())
          fileStream.on('error', err => controller.error(err))
        },
        cancel() {
          fileStream.destroy()
        },
      })

      return new NextResponse(stream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      })
    }

    // Standard Full Response
    const fileStream = fs.createReadStream(targetFilePath)
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on('data', chunk => controller.enqueue(chunk))
        fileStream.on('end', () => controller.close())
        fileStream.on('error', err => controller.error(err))
      },
      cancel() {
        fileStream.destroy()
      },
    })

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize.toString(),
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('Error streaming audio file:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
