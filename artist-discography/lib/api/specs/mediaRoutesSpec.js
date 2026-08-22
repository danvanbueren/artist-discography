/**
 * OpenAPI route specifications for Media & Streaming endpoints.
 */
export const MEDIA_ROUTES_SPEC = [
  {
    id: 'media-audio',
    path: '/api/audio/{path}',
    method: 'GET',
    tag: 'Media & Streaming',
    summary: 'Stream Optimized Audio Track',
    description:
      'Streams optimized audio files with HTTP 206 Partial Content range requests and CORS support.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    urlParams: [
      {
        key: 'path',
        value: 'echoes-of-andromeda/01-starlight-odyssey.aac',
        description: 'Relative path to audio file',
      },
      { key: 'b', value: '320k', description: 'Audio bitrate tier: 320k, 192k, 128k' },
    ],
    responses: [
      { status: 200, description: 'Complete audio stream' },
      { status: 206, description: 'Partial audio stream (Range request)' },
      { status: 404, description: 'Audio file not found' },
    ],
  },
  {
    id: 'media-images',
    path: '/api/media/{path}',
    method: 'GET',
    tag: 'Media & Streaming',
    summary: 'Stream Project Artwork / Image',
    description:
      'Serves responsive scaled image variants (e.g. ?w=400&fmt=webp) with immutable caching.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    urlParams: [
      { key: 'path', value: 'echoes-of-andromeda/art.jpg', description: 'Relative path to image' },
      { key: 'w', value: '400', description: 'Requested width in pixels' },
    ],
    responses: [
      { status: 200, description: 'Image asset stream' },
      { status: 304, description: 'Not Modified (ETag match)' },
      { status: 404, description: 'Image not found' },
    ],
  },
  {
    id: 'media-logo',
    path: '/api/logo',
    method: 'GET',
    tag: 'Media & Streaming',
    summary: 'Stream Branding Logo Asset',
    description: 'Streams active branding mark with responsive thumbnail optimization.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    urlParams: [
      { key: 'w', value: '240', description: 'Target pixel width' },
      { key: 'fmt', value: 'webp', description: 'Target format' },
    ],
    responses: [
      { status: 200, description: 'Logo image stream' },
      { status: 404, description: 'Logo not found' },
    ],
  },
  {
    id: 'media-icon',
    path: '/api/icon',
    method: 'GET',
    tag: 'Media & Streaming',
    summary: 'Stream Favicon / App Icon Suite',
    description:
      'Streams dynamic square favicon or apple-touch-icon generated from the artist logo.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    urlParams: [
      { key: 'size', value: '192', description: 'Icon pixel size: 16, 32, 48, 192, 512' },
    ],
    responses: [
      { status: 200, description: 'Icon image stream' },
      { status: 404, description: 'Icon not found' },
    ],
  },
]
