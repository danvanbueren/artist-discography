/**
 * OpenAPI route specifications for Dev Utilities endpoints.
 */
export const UTILITY_ROUTES_SPEC = [
  {
    id: 'dev-openapi',
    path: '/api/dev/openapi',
    method: 'GET',
    tag: 'Dev Utilities',
    summary: 'Export Complete OpenAPI 3.1 Specification',
    description:
      'Generates and returns the complete real-time OpenAPI 3.0.3/3.1 compliant JSON specification for all API routes.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    responses: [
      {
        status: 200,
        description: 'OpenAPI specification JSON object',
        example: { openapi: '3.0.3', info: { title: 'Artist Discography API' } },
      },
    ],
  },
  {
    id: 'analytics-track',
    path: '/api/analytics/track',
    method: 'POST',
    tag: 'Dev Utilities',
    summary: 'Record Stream or Page View Event',
    description:
      'Public beacon/fetch endpoint to record audio streams and page visits with debouncing and atomic JSON persistence.',
    requiresAdminAuth: false,
    requestFormat: 'json',
    defaultBody: JSON.stringify(
      {
        type: 'stream',
        project: 'Sunset EP',
        projectSlug: 'sunset-ep',
        track: 'Nightfall',
        path: '/sunset-ep/nightfall',
        referrer: 'direct',
      },
      null,
      2,
    ),
    responses: [
      {
        status: 200,
        description: 'Event recorded successfully',
        example: { success: true },
      },
    ],
  },
]
