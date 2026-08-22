/**
 * OpenAPI route specifications for Dev Utilities endpoints.
 */
export const UTILITY_ROUTES_SPEC = [
  {
    id: 'dev-seed',
    path: '/api/dev/seed',
    method: 'POST',
    tag: 'Dev Utilities',
    summary: 'Seed Demo Discography Catalog',
    description: 'Populates the discography with demo releases, artwork, and test audio tracks.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify({ password: 'admin' }, null, 2),
    responses: [
      {
        status: 200,
        description: 'Catalog seeded successfully',
        example: { success: true, message: 'Seeded test discography successfully.' },
      },
      { status: 401, description: 'Unauthorized', example: { error: 'Invalid password' } },
    ],
  },
  {
    id: 'dev-sync',
    path: '/api/dev/sync',
    method: 'POST',
    tag: 'Dev Utilities',
    summary: 'Rescan & Synchronize Data Directory',
    description:
      'Rescans data/projects to discover newly created directories and repairs corrupted json files.',
    requiresAdminAuth: true,
    requestFormat: 'json',
    defaultBody: JSON.stringify({ password: 'admin' }, null, 2),
    responses: [
      {
        status: 200,
        description: 'Directory synced successfully',
        example: { success: true, projectCount: 5 },
      },
    ],
  },
]
