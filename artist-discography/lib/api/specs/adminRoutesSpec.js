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
      'Verifies the provided password against the configured adminPassword in config.json.',
    requiresAdminAuth: true,
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
    description: 'Updates artist metadata, platform/social links, and server/system settings.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify(
      {
        password: 'admin',
        name: 'Astraea & The Neon Sun',
        bio: 'Ambient synthwave composer and sound designer.',
        adminAccess: true,
        adminPassword: 'admin',
        siteUrl: 'https://example.com',
        privateAccessCode: 'access123',
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
        example: { isCustom: true, hasDefault: true, fileName: 'logo.webp', url: '/api/logo' },
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
      'Uploads a custom image or vector SVG branding logo and triggers favicon generation.',
    requiresAdminAuth: true,
    requestFormat: 'formdata',
    defaultParams: [
      {
        key: 'password',
        value: 'admin',
        type: 'text',
        description: 'Admin authentication password',
      },
      {
        key: 'logoFile',
        value: null,
        type: 'file',
        description: 'Logo image file (PNG, JPG, SVG, WebP)',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Logo uploaded successfully',
        example: { success: true, message: 'Logo uploaded and updated successfully!' },
      },
      {
        status: 401,
        description: 'Unauthorized',
        example: { success: false, error: 'Unauthorized: Invalid password' },
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
      'Performs in-place updates or deletions for a release in data/projects/<slug>/project.json.',
    requiresAdminAuth: true,
    requestFormat: 'formdata',
    defaultParams: [
      {
        key: 'password',
        value: 'admin',
        type: 'text',
        description: 'Admin authentication password',
      },
      { key: 'action', value: 'update', type: 'text', description: 'Action: "update" or "delete"' },
      {
        key: 'projectIndex',
        value: '0',
        type: 'text',
        description: 'Zero-based index of the target project',
      },
      { key: 'name', value: 'Echoes of Andromeda', type: 'text', description: 'Project title' },
      {
        key: 'type',
        value: 'EP',
        type: 'text',
        description: 'Release type (Single, EP, Album, LP)',
      },
      { key: 'tracks', value: '[]', type: 'text', description: 'JSON array of track definitions' },
    ],
    responses: [
      {
        status: 200,
        description: 'Project modified successfully',
        example: { success: true, message: 'Project "Echoes of Andromeda" updated successfully.' },
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
    description: 'Creates a new project directory and stages artwork and audio files.',
    requiresAdminAuth: true,
    requestFormat: 'formdata',
    defaultParams: [
      {
        key: 'password',
        value: 'admin',
        type: 'text',
        description: 'Admin authentication password',
      },
      { key: 'name', value: 'Starlight Odyssey', type: 'text', description: 'Project title' },
      { key: 'type', value: 'Single', type: 'text', description: 'Release type' },
      { key: 'artist', value: 'Astraea', type: 'text', description: 'Artist name' },
      { key: 'date', value: '2026-03-01', type: 'text', description: 'Release date (YYYY-MM-DD)' },
      {
        key: 'tracks',
        value: '[{"name":"Starlight Odyssey","artist":"Astraea"}]',
        type: 'text',
        description: 'JSON array of track objects',
      },
      { key: 'coverFile', value: null, type: 'file', description: 'Album cover image' },
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
        example: { error: 'Project name is required' },
      },
    ],
  },
  {
    id: 'admin-copy-track',
    path: '/api/admin/copy-track',
    method: 'POST',
    tag: 'Admin Portal',
    summary: 'Duplicate Track to Another Project',
    description: 'Copies a track and its audio master to another project release.',
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
        example: { success: true, message: 'Track copied to target project successfully.' },
      },
      {
        status: 400,
        description: 'Invalid source or target',
        example: { error: 'Target project does not exist' },
      },
    ],
  },
]
