/**
 * OpenAPI route specifications for Admin Portal endpoints.
 */
export const ADMIN_ROUTES_SPEC = [
  {
    id: 'admin-auth',
    path: '/api/admin/auth',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Authenticate Admin Password',
    description:
      'Verifies the provided password against the configured adminPassword in data/config.json.',
    requiresAdminAuth: false,
    requestFormat: 'json',
    defaultBody: JSON.stringify({ password: 'admin' }, null, 2),
    responses: [
      { status: 200, description: 'Authentication successful', example: { authenticated: true } },
      {
        status: 401,
        description: 'Incorrect password',
        example: { authenticated: false, error: 'Incorrect password' },
      },
      {
        status: 403,
        description: 'Admin access disabled',
        example: { authenticated: false, error: 'Admin access is disabled in config.json' },
      },
    ],
  },
  {
    id: 'admin-artist',
    path: '/api/admin/artist',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Update Profile, Settings & Links',
    description:
      'Updates artist metadata, platform/social streaming links, site URL, gated access code, and admin security settings in data/config.json.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify(
      {
        password: 'admin',
        name: 'Artist',
        bio: 'Ambient synthwave composer and sound designer.',
        siteUrl: 'http://localhost:3000',
        privateAccessCode: 'access123',
        adminAccess: true,
        adminPassword: 'admin',
        platforms: {
          spotify: 'https://open.spotify.com/artist/example',
          apple: 'https://music.apple.com/artist/example',
          bandcamp: '',
          soundcloud: '',
          youtube: '',
          deezer: '',
          tidal: '',
          amazon: '',
          pandora: '',
          itunes: '',
        },
        socials: {
          instagram: 'https://instagram.com/example',
          x: 'https://x.com/example',
          facebook: '',
          tiktok: '',
          threads: '',
          bluesky: '',
          mastodon: '',
          audius: '',
          discord: '',
          twitch: '',
          email: '',
        },
      },
      null,
      2,
    ),
    responses: [
      {
        status: 200,
        description: 'Profile and settings updated successfully',
        example: { success: true, message: 'Profile and server settings updated successfully!' },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid admin password' },
      },
      {
        status: 403,
        description: 'Admin access disabled',
        example: { success: false, error: 'Admin access is disabled in config.json' },
      },
    ],
  },
  {
    id: 'admin-logo-get',
    path: '/api/admin/logo',
    method: 'GET',
    tag: 'Admin Portal',
    summary: 'Get Logo Status & Details',
    description: 'Returns the current active logo metadata, whether custom or default.',
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
            hasDefault: true,
            filename: 'logo.webp',
            url: '/api/logo',
            previewUrl: '/api/logo?w=320',
          },
        },
      },
    ],
  },
  {
    id: 'admin-logo-post',
    path: '/api/admin/logo',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Upload Custom Branding Logo',
    description:
      'Uploads a custom image or vector SVG branding logo and triggers automated favicon suite generation.',
    requiresAdminAuth: true,
    requestFormat: 'formdata',
    defaultParams: [
      {
        key: 'password',
        value: 'admin',
        type: 'text',
        description: 'Admin authentication password (Required)',
      },
      {
        key: 'action',
        value: 'upload',
        type: 'text',
        description: 'Action: "upload" or "delete"/"reset"',
      },
      {
        key: 'logoFile',
        value: null,
        type: 'file',
        description: 'Logo image file (PNG, JPG, SVG, WebP) (Required for upload)',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Logo uploaded successfully',
        example: { success: true, message: 'Custom logo uploaded and optimized successfully!' },
      },
      {
        status: 400,
        description: 'Missing file',
        example: { success: false, error: 'No logo image file was provided.' },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid admin password' },
      },
    ],
  },
  {
    id: 'admin-logo-delete',
    path: '/api/admin/logo',
    method: 'DELETE',
    tag: 'Admin Portal',
    summary: 'Delete Custom Logo (Revert to Default)',
    description:
      'Removes the custom branding logo and purges cached assets, reverting to the default placeholder logo.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify({ password: 'admin' }, null, 2),
    responses: [
      {
        status: 200,
        description: 'Logo deleted and reset to default',
        example: {
          success: true,
          message: 'Custom logo removed. Reverted to default logo in public/logo.png.',
        },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid admin password' },
      },
    ],
  },
  {
    id: 'admin-upload-post',
    path: '/api/admin/upload',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Create New Project & Upload Media',
    description:
      'Creates a new project directory in data/projects/<slug>/ and stages artwork and audio files.',
    requiresAdminAuth: true,
    requestFormat: 'formdata',
    defaultParams: [
      {
        key: 'password',
        value: 'admin',
        type: 'text',
        description: 'Admin authentication password (Required)',
      },
      {
        key: 'name',
        value: 'Echoes of Andromeda',
        type: 'text',
        description: 'Project title (Required)',
      },
      {
        key: 'type',
        value: 'Single',
        type: 'text',
        description: 'Release type (Single, EP, Album, LP) (Required)',
      },
      {
        key: 'artist',
        value: 'Artist',
        type: 'text',
        description: 'Artist name',
      },
      {
        key: 'date',
        value: '2026-03-01',
        type: 'text',
        description: 'Release date (YYYY-MM-DD)',
      },
      {
        key: 'visibility',
        value: 'public',
        type: 'text',
        description: 'Visibility: "public" or "private"',
      },
      {
        key: 'copyright',
        value: 'cleared',
        type: 'text',
        description: 'Stream copyright: "cleared" or "uncleared"',
      },
      {
        key: 'tracks',
        value: '[{"name":"Starlight Odyssey","artist":"Artist","links":{}}]',
        type: 'text',
        description: 'JSON array of track definitions',
      },
      {
        key: 'coverFile',
        value: null,
        type: 'file',
        description: 'Album cover image (PNG, JPG, WebP)',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Project created successfully',
        example: { success: true, message: 'Project created successfully.' },
      },
      {
        status: 400,
        description: 'Validation error',
        example: { success: false, error: 'Project name is required' },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid admin password' },
      },
    ],
  },
  {
    id: 'admin-project-post',
    path: '/api/admin/project',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Update or Delete Project Release',
    description:
      'Performs in-place updates, metadata changes, or deletions for a release in data/projects/<slug>/project.json.',
    requiresAdminAuth: true,
    requestFormat: 'formdata',
    defaultParams: [
      {
        key: 'password',
        value: 'admin',
        type: 'text',
        description: 'Admin authentication password (Required)',
      },
      {
        key: 'action',
        value: 'update',
        type: 'text',
        description: 'Action: "update" or "delete" (Required)',
      },
      {
        key: 'projectIndex',
        value: '0',
        type: 'text',
        description: 'Zero-based index of target project (Required)',
      },
      {
        key: 'name',
        value: 'Echoes of Andromeda',
        type: 'text',
        description: 'Project title (Required for update)',
      },
      {
        key: 'type',
        value: 'EP',
        type: 'text',
        description: 'Release type (Single, EP, Album, LP)',
      },
      {
        key: 'artist',
        value: 'Artist',
        type: 'text',
        description: 'Artist name',
      },
      {
        key: 'date',
        value: '2026-03-01',
        type: 'text',
        description: 'Release date (YYYY-MM-DD)',
      },
      {
        key: 'visibility',
        value: 'public',
        type: 'text',
        description: 'Visibility: "public" or "private"',
      },
      {
        key: 'copyright',
        value: 'cleared',
        type: 'text',
        description: 'Stream copyright: "cleared" or "uncleared"',
      },
      {
        key: 'tracks',
        value: '[{"name":"Starlight Odyssey","artist":"Artist","links":{}}]',
        type: 'text',
        description: 'JSON array of track definitions',
      },
      {
        key: 'coverFile',
        value: null,
        type: 'file',
        description: 'Replacement album cover image (optional)',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Project modified successfully',
        example: { success: true, message: 'Project "Echoes of Andromeda" updated successfully.' },
      },
      {
        status: 400,
        description: 'Invalid project selection',
        example: { success: false, error: 'Invalid project selection or project not found' },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid admin password' },
      },
    ],
  },
  {
    id: 'admin-copy-track',
    path: '/api/admin/copy-track',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Duplicate Track to Another Project',
    description:
      'Copies a track and its underlying audio master and cover artwork from a source project to a target project release.',
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
      2,
    ),
    responses: [
      {
        status: 200,
        description: 'Track copied successfully',
        example: {
          success: true,
          message: 'Successfully copied track "Track 1" to project "Project 2"!',
        },
      },
      {
        status: 400,
        description: 'Invalid source or target selection',
        example: { success: false, error: 'Invalid source track selection' },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid admin password' },
      },
    ],
  },
  {
    id: 'admin-media-jobs-get',
    path: '/api/admin/media-jobs',
    method: 'GET',
    tag: 'Admin Portal',
    summary: 'List Active Background Media Jobs',
    description:
      'Returns the current queue of active and completed FFmpeg audio transcoding and Sharp image optimization tasks.',
    requiresAdminAuth: true,
    requestFormat: 'none',
    queryParams: [
      {
        name: 'stream',
        example: '0',
        description: 'Set to 1 for continuous real-time Server-Sent Events (SSE) stream',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Jobs list returned',
        example: {
          success: true,
          active: [],
          completed: [],
          totalActive: 0,
          totalCompleted: 0,
        },
      },
    ],
  },
  {
    id: 'admin-media-jobs-post',
    path: '/api/admin/media-jobs',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Trigger or Clear Media Processing Jobs',
    description:
      'Triggers automated background transcoding and optimization of all discography audio and artwork, or clears finished jobs.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify(
      {
        password: 'admin',
        action: 'warm-all',
      },
      null,
      2,
    ),
    responses: [
      {
        status: 200,
        description: 'Action triggered successfully',
        example: {
          success: true,
          message: 'Catalog media optimization and pre-transcoding started.',
        },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid admin password' },
      },
    ],
  },
  {
    id: 'admin-analytics-get',
    path: '/api/admin/analytics',
    method: 'GET',
    tag: 'Admin Portal',
    summary: 'Fetch Catalog Analytics & Timeline',
    description:
      'Retrieves aggregated streams, page visits, bandwidth usage, project breakdown, and recent activity from data/analytics/ JSON files.',
    requiresAdminAuth: true,
    requestFormat: 'query',
    parameters: [
      {
        name: 'range',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['7d', '30d', 'all'], default: '30d' },
        description: 'Timeframe range filter',
      },
      {
        name: 'password',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Admin password for authorization',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Analytics summary returned successfully',
        example: {
          success: true,
          analytics: {
            range: '30d',
            fidelity: 'day',
            summary: {
              totalStreams: 142,
              totalPageViews: 280,
              totalBandwidthBytes: 52428800,
              totalBandwidthFormatted: '50.0 MB',
              topProjectName: 'Sunset EP',
              topTrackName: 'Nightfall',
            },
            timeline: [],
            projectBreakdown: [],
            trackBreakdown: [],
            pageBreakdown: [],
            recentEvents: [],
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid admin password' },
      },
    ],
  },
  {
    id: 'admin-analytics-delete',
    path: '/api/admin/analytics',
    method: 'DELETE',
    tag: 'Admin Portal',
    summary: 'Archive and Reset Analytics Data',
    description:
      'Archives existing metrics to data/backups/ and resets daily, events, and totals analytics counters.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify({ password: 'admin' }, null, 2),
    responses: [
      {
        status: 200,
        description: 'Analytics reset successfully',
        example: {
          success: true,
          message: 'Analytics data has been archived and reset successfully.',
        },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid admin password' },
      },
    ],
  },
]
