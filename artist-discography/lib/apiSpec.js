export const API_TAGS = [
  { name: 'Admin Portal', description: 'Endpoints for managing artist profile, projects, track copying, and file uploads' },
  { name: 'Dev Utilities', description: 'Development tools, data seeding, and API specification exports' },
  { name: 'Media & Streaming', description: 'Public endpoints for streaming audio tracks, album artwork, and logo assets' },
]

export const API_ROUTES_SPEC = [
  {
    id: 'admin-auth',
    path: '/api/admin/auth',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Authenticate Admin Password',
    description: 'Verifies the provided password against the configured adminPassword in artist-data.json.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify({ password: 'admin' }, null, 2),
    responses: [
      { status: 200, description: 'Authentication successful', example: { authenticated: true } },
      { status: 401, description: 'Incorrect password', example: { authenticated: false, error: 'Incorrect password' } },
      { status: 403, description: 'Admin access disabled', example: { authenticated: false, error: 'Admin access is disabled in artist-data.json' } },
    ],
  },
  {
    id: 'admin-artist',
    path: '/api/admin/artist',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Update Artist Profile & Links',
    description: 'Updates artist name, biography, streaming platform URLs, and social media profile links.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify(
      {
        password: 'admin',
        name: 'Astraea & The Neon Sun',
        bio: 'Ambient synthwave composer and sound designer.',
        platforms: {
          spotify: 'https://open.spotify.com/artist/astraea',
          apple: 'https://music.apple.com/artist/astraea',
        },
        socials: {
          instagram: 'https://instagram.com/astraea',
          x: 'https://x.com/astraea',
        },
      },
      null,
      2
    ),
    responses: [
      { status: 200, description: 'Profile updated successfully', example: { success: true, message: 'Artist profile updated successfully!' } },
      { status: 401, description: 'Unauthorized', example: { success: false, error: 'Unauthorized: Invalid admin password' } },
    ],
  },
  {
    id: 'admin-logo-get',
    path: '/api/admin/logo',
    method: 'GET',
    tag: 'Admin Portal',
    summary: 'Get Logo Status & Details',
    description: 'Returns the current active logo metadata, whether it is custom (data/logo.*) or default (public/logo.*).',
    requiresAdminAuth: false,
    requestFormat: 'none',
    responses: [
      {
        status: 200,
        description: 'Logo metadata returned',
        example: {
          success: true,
          logo: {
            exists: true,
            isCustom: true,
            filename: 'logo.png',
            ext: '.png',
            mimeType: 'image/png',
            sizeBytes: 15420,
            url: '/api/logo',
          },
        },
      },
    ],
  },
  {
    id: 'admin-logo',
    path: '/api/admin/logo',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Upload, Replace, or Reset Artist Logo',
    description: 'Uploads a custom artist logo (stored in data/logo.<ext>), pre-warms media caches, or reverts to default public/logo.png if action is "delete".',
    requiresAdminAuth: true,
    requestFormat: 'formdata',
    defaultParams: [
      { key: 'password', value: 'admin', type: 'text', description: 'Admin access password' },
      { key: 'action', value: 'upload', type: 'text', description: 'Action: "upload" or "delete"' },
      { key: 'logoFile', value: '', type: 'file', description: 'Logo image file (.png, .jpg, .webp, .svg, .avif)' },
    ],
    responses: [
      { status: 200, description: 'Logo updated or reset', example: { success: true, message: 'Custom logo (logo.png) uploaded and optimized successfully!' } },
      { status: 400, description: 'Missing logo file', example: { success: false, error: 'No logo image file was provided.' } },
      { status: 401, description: 'Unauthorized', example: { success: false, error: 'Unauthorized: Invalid admin password' } },
    ],
  },
  {
    id: 'admin-project',
    path: '/api/admin/project',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Update or Delete Project',
    description: 'Updates an existing project release and its tracks, or deletes the project if action is "delete". Supports multipart/form-data for artwork and audio files.',
    requiresAdminAuth: true,
    requestFormat: 'formdata',
    defaultParams: [
      { key: 'password', value: 'admin', type: 'text', description: 'Admin access password' },
      { key: 'action', value: 'update', type: 'text', description: 'Action: "update" or "delete"' },
      { key: 'projectIndex', value: '0', type: 'text', description: '0-based index of project in array' },
      { key: 'name', value: 'Midnight Echoes', type: 'text', description: 'Project title' },
      { key: 'type', value: 'Album', type: 'text', description: 'Single | EP | Album' },
      { key: 'artist', value: '', type: 'text', description: 'Optional project artist override' },
      { key: 'date', value: '2026-01-15', type: 'text', description: 'Release date (YYYY-MM-DD)' },
      { key: 'tracks', value: '[{"name":"Track 1","links":{}}]', type: 'text', description: 'JSON string array of track objects' },
      { key: 'coverFile', value: '', type: 'file', description: 'Optional cover image file (.jpg, .png, .webp)' },
      { key: 'track_0_audioFile', value: '', type: 'file', description: 'Optional audio file for track index 0' },
    ],
    responses: [
      { status: 200, description: 'Project updated', example: { success: true, projectSlug: 'midnight-echoes', message: 'Project updated successfully!' } },
      { status: 400, description: 'Validation error', example: { success: false, error: 'Project name is required' } },
    ],
  },
  {
    id: 'admin-upload',
    path: '/api/admin/upload',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Create / Upload New Release Project',
    description: 'Creates a new project release along with optional cover artwork image and audio files for each track.',
    requiresAdminAuth: true,
    requestFormat: 'formdata',
    defaultParams: [
      { key: 'password', value: 'admin', type: 'text', description: 'Admin access password' },
      { key: 'name', value: 'Celestial Horizon', type: 'text', description: 'Project title' },
      { key: 'type', value: 'EP', type: 'text', description: 'Single | EP | Album' },
      { key: 'artist', value: '', type: 'text', description: 'Optional artist override' },
      { key: 'date', value: '2026-08-15', type: 'text', description: 'Release date (YYYY-MM-DD)' },
      { key: 'tracks', value: '[{"name":"Orbiting","links":{}}]', type: 'text', description: 'JSON string array of tracks' },
      { key: 'coverFile', value: '', type: 'file', description: 'Optional cover image file' },
      { key: 'track_0_audioFile', value: '', type: 'file', description: 'Optional audio file for track 0' },
    ],
    responses: [
      { status: 200, description: 'Project created', example: { success: true, projectSlug: 'celestial-horizon', message: 'Project created successfully!' } },
      { status: 400, description: 'Duplicate title or missing fields', example: { success: false, error: 'A project with title "Celestial Horizon" already exists.' } },
    ],
  },
  {
    id: 'admin-copy-track',
    path: '/api/admin/copy-track',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Duplicate Track Across Projects',
    description: 'Copies a track (including physical audio and custom cover artwork files if present) from a source project to a target project.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify(
      {
        password: 'admin',
        sourceProjectIndex: 0,
        sourceTrackIndex: 0,
        targetProjectIndex: 1,
      },
      null,
      2
    ),
    responses: [
      { status: 200, description: 'Track copied', example: { success: true, message: 'Successfully copied track "Track 1" to project "EP Title"!', targetProjectIndex: 1 } },
      { status: 400, description: 'Invalid selection', example: { success: false, error: 'Invalid project selection' } },
    ],
  },
  {
    id: 'admin-media-jobs-get',
    path: '/api/admin/media-jobs',
    method: 'GET',
    tag: 'Admin Portal',
    summary: 'Get Real-Time Media Processing Jobs',
    description: 'Returns active and recent Sharp image optimization and FFmpeg audio transcoding jobs. Supports SSE streaming with ?stream=1.',
    requiresAdminAuth: false,
    responses: [
      { status: 200, description: 'Active & completed jobs snapshot', example: { success: true, active: [], completed: [], totalCount: 0 } },
    ],
  },
  {
    id: 'admin-media-jobs-post',
    path: '/api/admin/media-jobs',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Trigger Catalog Media Warming / Clear Jobs',
    description: 'Triggers background warming/optimization across catalog media or clears completed jobs.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify(
      {
        password: 'admin',
        action: 'warm-all',
      },
      null,
      2
    ),
    responses: [
      { status: 200, description: 'Action executed', example: { success: true, message: 'Catalog media optimization and pre-transcoding started.' } },
      { status: 401, description: 'Unauthorized', example: { success: false, error: 'Unauthorized: Invalid admin password' } },
    ],
  },
  {
    id: 'dev-seed-dummy',
    path: '/api/dev/seed-dummy',
    method: 'POST',
    tag: 'Dev Utilities',
    summary: 'Randomize Dummy Data',
    description: 'Generates and saves randomized dummy artist information, projects, and track listings for development testing.',
    requiresAdminAuth: false,
    requestFormat: 'json',
    defaultBody: '{}',
    responses: [
      { status: 200, description: 'Dummy data generated', example: { success: true, message: 'Successfully randomized artist-data.json with dummy data!' } },
      { status: 403, description: 'Dev access disabled', example: { success: false, error: 'Dev access is disabled in artist-data.json' } },
    ],
  },
  {
    id: 'dev-openapi',
    path: '/api/dev/openapi',
    method: 'GET',
    tag: 'Dev Utilities',
    summary: 'OpenAPI 3.0 Specification Export',
    description: 'Returns formal OpenAPI 3.0 specification JSON for importing into Postman, OpenAPI tools, or API client generators.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    responses: [
      { status: 200, description: 'OpenAPI JSON spec', example: { openapi: '3.0.3', info: { title: 'Artist Discography API', version: '1.0.0' } } },
    ],
  },
  {
    id: 'audio-stream',
    path: '/api/audio/projects/{projectSlug}/{trackFilename}',
    method: 'GET',
    tag: 'Media & Streaming',
    summary: 'Stream Track Audio File',
    description: 'Streams project audio files (.mp3, .wav, .flac, .m4a, .ogg) with full HTTP 206 Range Request support for HTML5 seeking.',
    requiresAdminAuth: false,
    requestFormat: 'params',
    pathParams: [
      { name: 'projectSlug', example: 'midnight-echoes', description: 'Project directory slug' },
      { name: 'trackFilename', example: 'starlight-pulse.mp3', description: 'Audio filename with extension' },
    ],
    responses: [
      { status: 200, description: 'Audio Binary Stream (Full)' },
      { status: 206, description: 'Audio Binary Stream (Partial Range)' },
      { status: 404, description: 'Audio file not found' },
    ],
  },
  {
    id: 'media-stream',
    path: '/api/media/projects/{projectSlug}/{coverFilename}',
    method: 'GET',
    tag: 'Media & Streaming',
    summary: 'Stream Album Artwork / Media',
    description: 'Streams project cover artwork and image files (.jpg, .png, .webp, .svg, .avif).',
    requiresAdminAuth: false,
    requestFormat: 'params',
    pathParams: [
      { name: 'projectSlug', example: 'midnight-echoes', description: 'Project directory slug' },
      { name: 'coverFilename', example: 'art.jpg', description: 'Artwork filename with extension' },
    ],
    responses: [
      { status: 200, description: 'Image Binary Stream' },
      { status: 404, description: 'Media file not found' },
    ],
  },
  {
    id: 'logo-stream',
    path: '/api/logo',
    method: 'GET',
    tag: 'Media & Streaming',
    summary: 'Get Custom or Default Logo',
    description: 'Returns the artist logo from data/ directory override or public/ default logo asset.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    responses: [
      { status: 200, description: 'Logo Binary Stream' },
      { status: 404, description: 'Logo not found' },
    ],
  },
]

export function generateOpenApiSpec(baseUrl = 'http://localhost:3000') {
  const pathsObj = {}

  API_ROUTES_SPEC.forEach((route) => {
    // Standardize path template format e.g. /api/audio/projects/{projectSlug}/{trackFilename}
    const openApiPath = route.path

    if (!pathsObj[openApiPath]) {
      pathsObj[openApiPath] = {}
    }

    const methodKey = route.method.toLowerCase()
    const parameters = []

    if (route.pathParams) {
      route.pathParams.forEach((param) => {
        parameters.push({
          name: param.name,
          in: 'path',
          required: true,
          description: param.description,
          schema: { type: 'string', example: param.example },
        })
      })
    }

    const operation = {
      tags: [route.tag],
      summary: route.summary,
      description: route.description,
      operationId: route.id,
      parameters,
      responses: {},
    }

    if (route.requiresAdminAuth) {
      operation.security = [{ AdminAuth: [] }]
    }

    if (['post', 'put', 'patch'].includes(methodKey)) {
      if (route.requestFormat === 'json') {
        let parsedExample = {}
        try {
          parsedExample = JSON.parse(route.defaultBody || '{}')
        } catch (e) {}

        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
              example: parsedExample,
            },
          },
        }
      } else if (route.requestFormat === 'formdata') {
        const properties = {}
        if (route.defaultParams) {
          route.defaultParams.forEach((p) => {
            if (p.type === 'file') {
              properties[p.key] = { type: 'string', format: 'binary', description: p.description }
            } else {
              properties[p.key] = { type: 'string', example: p.value, description: p.description }
            }
          })
        }

        operation.requestBody = {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties,
              },
            },
          },
        }
      }
    }

    route.responses.forEach((resp) => {
      operation.responses[String(resp.status)] = {
        description: resp.description,
        ...(resp.example
          ? {
              content: {
                'application/json': {
                  example: resp.example,
                },
              },
            }
          : {}),
      }
    })

    pathsObj[openApiPath][methodKey] = operation
  })

  return {
    openapi: '3.0.3',
    info: {
      title: 'Artist Discography API',
      description: 'OpenAPI documentation for the Artist Discography application backend and media streaming routes.',
      version: '2026.3.0',
    },
    servers: [
      {
        url: baseUrl,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        AdminAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-admin-password',
          description: 'Admin access password for privileged data mutations.',
        },
      },
    },
    paths: pathsObj,
  }
}
