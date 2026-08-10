import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const IMAGE_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const publicDir = path.join(process.cwd(), 'public')

    // 1. Check data/ directory for custom logo override (e.g. logo.png, logo.svg, logo.jpg)
    if (fs.existsSync(dataDir)) {
      try {
        const files = fs.readdirSync(dataDir)
        const customLogoFile = files.find(file => {
          const lower = file.toLowerCase()
          const ext = path.extname(lower)
          return lower.startsWith('logo.') && Object.keys(IMAGE_MIME_TYPES).includes(ext)
        })

        if (customLogoFile) {
          const logoPath = path.join(dataDir, customLogoFile)
          const ext = path.extname(customLogoFile).toLowerCase()
          const mimeType = IMAGE_MIME_TYPES[ext] || 'application/octet-stream'
          const fileBuffer = fs.readFileSync(logoPath)

          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': mimeType,
              'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
          })
        }
      } catch (err) {
        console.error('Error reading custom logo from data directory:', err)
      }
    }

    // 2. Fallback to default logo in public/ directory (e.g. public/logo.png)
    if (fs.existsSync(publicDir)) {
      try {
        const files = fs.readdirSync(publicDir)
        const defaultLogoFile = files.find(file => {
          const lower = file.toLowerCase()
          const ext = path.extname(lower)
          return lower.startsWith('logo.') && Object.keys(IMAGE_MIME_TYPES).includes(ext)
        })

        if (defaultLogoFile) {
          const logoPath = path.join(publicDir, defaultLogoFile)
          const ext = path.extname(defaultLogoFile).toLowerCase()
          const mimeType = IMAGE_MIME_TYPES[ext] || 'application/octet-stream'
          const fileBuffer = fs.readFileSync(logoPath)

          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': mimeType,
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            },
          })
        }
      } catch (err) {
        console.error('Error reading default logo from public directory:', err)
      }
    }
  } catch (err) {
    console.error('Unexpected error in logo API route:', err)
  }

  return new NextResponse('Logo not found', { status: 404 })
}

