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
      'Streams optimized audio files with HTTP 206 Partial Content range requests, dynamic bitrate transcoding, and CORS headers.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    pathParams: [
      {
        name: 'path',
        example: 'projects/echoes-of-andromeda/01-starlight-odyssey.aac',
        description: 'Relative path to audio file under data/ (Required)',
      },
    ],
    queryParams: [
      {
        name: 'b',
        example: '320k',
        description: 'Audio bitrate tier: 320k, 192k, 128k',
      },
      {
        name: 't',
        example: '1710000000',
        description: 'Cache-busting timestamp',
      },
      {
        name: 'token',
        example: '',
        description: 'Private access token for casting to external receivers',
      },
    ],
    responses: [
      { status: 200, description: 'Complete audio stream' },
      { status: 206, description: 'Partial audio stream (Range request)' },
      { status: 403, description: 'Forbidden (Private gated access required)' },
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
      'Serves responsive scaled image variants (e.g. ?w=400&fmt=webp) with HTTP 304 ETag caching.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    pathParams: [
      {
        name: 'path',
        example: 'projects/echoes-of-andromeda/art.jpg',
        description: 'Relative path to image file under data/ (Required)',
      },
    ],
    queryParams: [
      {
        name: 'w',
        example: '400',
        description: 'Requested width in pixels',
      },
      {
        name: 'q',
        example: '80',
        description: 'Image compression quality (1-100)',
      },
      {
        name: 'fmt',
        example: 'webp',
        description: 'Target format: webp, avif, jpeg, png',
      },
      {
        name: 'blur',
        example: '0',
        description: 'Gaussian blur radius for placeholder rendering',
      },
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
    summary: 'Stream Dynamic Branding Logo Asset',
    description: 'Streams active branding mark with responsive thumbnail optimization.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    queryParams: [
      {
        name: 'w',
        example: '240',
        description: 'Target pixel width',
      },
      {
        name: 'fmt',
        example: 'webp',
        description: 'Target format: webp, png, original',
      },
      {
        name: 'blur',
        example: '0',
        description: 'Gaussian blur radius',
      },
    ],
    responses: [
      { status: 200, description: 'Logo image stream' },
      { status: 304, description: 'Not Modified (ETag match)' },
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
      'Streams dynamic square favicon or Apple touch icon generated from the artist branding mark.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    queryParams: [
      {
        name: 'w',
        example: '192',
        description: 'Icon square pixel dimension: 16, 32, 48, 192, 512',
      },
    ],
    responses: [
      { status: 200, description: 'Icon image stream' },
      { status: 304, description: 'Not Modified (ETag match)' },
      { status: 404, description: 'Icon not found' },
    ],
  },
  {
    id: 'media-background',
    path: '/api/background',
    method: 'GET',
    tag: 'Media & Streaming',
    summary: 'Stream Custom Default Ambient Background Asset',
    description:
      'Streams custom default ambient background image with on-the-fly Sharp resizing and Gaussian blur optimization.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    queryParams: [
      {
        name: 'w',
        example: '600',
        description: 'Target pixel width',
      },
      {
        name: 'q',
        example: '80',
        description: 'Target image quality (1-100)',
      },
      {
        name: 'fmt',
        example: 'webp',
        description: 'Target format: webp, avif, jpeg, png, original',
      },
      {
        name: 'blur',
        example: '8',
        description: 'Gaussian blur radius for placeholder rendering',
      },
    ],
    responses: [
      { status: 200, description: 'Background image stream' },
      { status: 304, description: 'Not Modified (ETag match)' },
      { status: 404, description: 'Custom background not found' },
    ],
  },
]
