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
  const dataDir = path.join(process.cwd(), 'data')

  if (fs.existsSync(dataDir)) {
    try {
      const files = fs.readdirSync(dataDir)
      const logoFile = files.find(file => {
        const lower = file.toLowerCase()
        const ext = path.extname(lower)
        return lower.startsWith('logo.') && Object.keys(IMAGE_MIME_TYPES).includes(ext)
      })

      if (logoFile) {
        const logoPath = path.join(dataDir, logoFile)
        const ext = path.extname(logoFile).toLowerCase()
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
      console.error('Error reading logo from data directory:', err)
    }
  }

  // Fallback to public/logo.png
  const fallbackPath = path.join(process.cwd(), 'public', 'logo.png')
  if (fs.existsSync(fallbackPath)) {
    const fileBuffer = fs.readFileSync(fallbackPath)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    })
  }

  return new NextResponse('Logo not found', { status: 404 })
}
