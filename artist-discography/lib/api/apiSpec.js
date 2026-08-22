import { ADMIN_ROUTES_SPEC } from './specs/adminRoutesSpec'
import { MEDIA_ROUTES_SPEC } from './specs/mediaRoutesSpec'
import { UTILITY_ROUTES_SPEC } from './specs/utilityRoutesSpec'

export const API_TAGS = [
  {
    name: 'Admin Portal',
    description: 'Endpoints for managing artist profile, projects, track copying, and file uploads',
  },
  {
    name: 'Dev Utilities',
    description: 'Development tools, data seeding, and API specification exports',
  },
  {
    name: 'Media & Streaming',
    description: 'Public endpoints for streaming audio tracks, album artwork, and logo assets',
  },
]

export const API_ROUTES_SPEC = [...ADMIN_ROUTES_SPEC, ...MEDIA_ROUTES_SPEC, ...UTILITY_ROUTES_SPEC]

/**
 * Generates an OpenAPI 3.0.3 compliant JSON specification from route definitions.
 *
 * @param {string} [baseUrl='http://localhost:3000'] - Host base URL
 * @returns {Object} OpenAPI JSON schema
 */
export function generateOpenApiSpec(baseUrl = 'http://localhost:3000') {
  const pathsObj = {}

  API_ROUTES_SPEC.forEach((route) => {
    let openApiPath = route.path
    if (route.urlParams) {
      route.urlParams.forEach((param) => {
        if (!openApiPath.includes(`{${param.key}}`)) {
          openApiPath = `${openApiPath}/{${param.key}}`
        }
      })
    }

    if (!pathsObj[openApiPath]) {
      pathsObj[openApiPath] = {}
    }

    const methodKey = route.method.toLowerCase()
    const operation = {
      summary: route.summary,
      description: route.description,
      tags: [route.tag],
      operationId: route.id,
      responses: {},
    }

    if (route.requiresAdminAuth) {
      operation.security = [{ AdminAuth: [] }]
    }

    if (route.urlParams && route.urlParams.length > 0) {
      operation.parameters = route.urlParams.map((p) => ({
        name: p.key,
        in: 'path',
        required: true,
        description: p.description,
        schema: {
          type: 'string',
          example: p.value,
        },
      }))
    }

    if (route.method === 'POST' || route.method === 'PUT') {
      if (route.requestFormat === 'json') {
        let parsedExample = {}
        try {
          parsedExample = JSON.parse(route.defaultBody || '{}')
        } catch (e) {}

        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' },
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
      description:
        'OpenAPI documentation for the Artist Discography application backend and media streaming routes.',
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
