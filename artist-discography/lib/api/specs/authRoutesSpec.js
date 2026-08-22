/**
 * OpenAPI route specifications for Private Access & Authentication endpoints.
 */
export const AUTH_ROUTES_SPEC = [
  {
    id: 'auth-private-access-get',
    path: '/api/auth/private-access',
    method: 'GET',
    tag: 'Private Access & Auth',
    summary: 'Check Private Access Clearance Status',
    description:
      'Checks if the current client session cookie (private_access_auth) has unlocked private gated releases.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    responses: [
      {
        status: 200,
        description: 'Clearance status returned',
        example: { success: true, authenticated: false },
      },
    ],
  },
  {
    id: 'auth-private-access-post',
    path: '/api/auth/private-access',
    method: 'POST',
    tag: 'Private Access & Auth',
    summary: 'Unlock Private Gated Catalog Releases',
    description:
      'Validates the submitted access code against privateAccessCode in config.json and establishes a 30-day authenticated cookie session.',
    requiresAdminAuth: false,
    requestFormat: 'json',
    defaultBody: JSON.stringify({ accessCode: 'access123' }, null, 2),
    responses: [
      {
        status: 200,
        description: 'Private access unlocked successfully',
        example: {
          success: true,
          authenticated: true,
          message: 'Private access unlocked successfully!',
        },
      },
      {
        status: 400,
        description: 'Missing access code',
        example: { success: false, error: 'Please enter a private access code' },
      },
      {
        status: 401,
        description: 'Invalid access code',
        example: { success: false, error: 'Invalid private access code' },
      },
    ],
  },
  {
    id: 'auth-private-access-delete',
    path: '/api/auth/private-access',
    method: 'DELETE',
    tag: 'Private Access & Auth',
    summary: 'Lock Private Access (Logout Session)',
    description:
      'Clears the private_access_auth authentication cookie, immediately re-gating unreleased and locked catalog items.',
    requiresAdminAuth: false,
    requestFormat: 'none',
    responses: [
      {
        status: 200,
        description: 'Private access locked successfully',
        example: {
          success: true,
          authenticated: false,
          message: 'Private access locked successfully',
        },
      },
    ],
  },
]
