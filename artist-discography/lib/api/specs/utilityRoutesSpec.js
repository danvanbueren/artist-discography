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
]
