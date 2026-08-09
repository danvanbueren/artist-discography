import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const MEDIA_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const pathSegments = resolvedParams?.path ?? []
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Media path not specified', { status: 400 })
    }

    const dataDir = path.join(process.cwd(), 'data')
    const requestedPath = pathSegments.join('/')

    // Prevent directory traversal attacks
    const fullCoversPath = path.resolve(path.join(dataDir, 'covers', requestedPath))
    const fallbackDataPath = path.resolve(path.join(dataDir, requestedPath))

    let targetFilePath = null
    if (fullCoversPath.startsWith(dataDir) && fs.existsSync(fullCoversPath) && fs.statSync(fullCoversPath).isFile()) {
      targetFilePath = fullCoversPath
    } else if (fallbackDataPath.startsWith(dataDir) && fs.existsSync(fallbackDataPath) && fs.statSync(fallbackDataPath).isFile()) {
      targetFilePath = fallbackDataPath
    }

    if (!targetFilePath) {
      return new NextResponse('Media file not found', { status: 404 })
    }

    const ext = path.extname(targetFilePath).toLowerCase()
    const mimeType = MEDIA_MIME_TYPES[ext] || 'application/octet-stream'
    const fileBuffer = fs.readFileSync(targetFilePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('Error reading media file:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
