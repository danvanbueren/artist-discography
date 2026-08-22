import { ADMIN_ROUTES_SPEC } from './specs/adminRoutesSpec'
import { AUTH_ROUTES_SPEC } from './specs/authRoutesSpec'
import { MEDIA_ROUTES_SPEC } from './specs/mediaRoutesSpec'
import { UTILITY_ROUTES_SPEC } from './specs/utilityRoutesSpec'

export const API_TAGS = [
  {
    name: 'Admin Portal',
    description:
      'Endpoints for managing artist profile, projects, track copying, logo assets, and background media jobs',
  },
  {
    name: 'Private Access & Auth',
    description: 'Endpoints for verifying and unlocking gated discography releases',
  },
  {
    name: 'Media & Streaming',
    description: 'Public endpoints for streaming audio tracks, album artwork, and branding marks',
  },
  {
    name: 'Dev Utilities',
    description: 'Developer tools and real-time OpenAPI specification exports',
  },
]

export const API_ROUTES_SPEC = [
  ...ADMIN_ROUTES_SPEC,
  ...AUTH_ROUTES_SPEC,
  ...MEDIA_ROUTES_SPEC,
  ...UTILITY_ROUTES_SPEC,
]

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

    const pathParams = Array.isArray(route.pathParams)
      ? route.pathParams
      : Array.isArray(route.urlParams)
        ? route.urlParams
        : []

    pathParams.forEach((param) => {
      const pName = param.name || param.key
      if (pName && !openApiPath.includes(`{${pName}}`)) {
        openApiPath = `${openApiPath}/{${pName}}`
      }
    })

    if (!pathsObj[openApiPath]) {
      pathsObj[openApiPath] = {}
    }

    const methodKey = route.method.toLowerCase()
    const operation = {
      summary: route.summary,
      description: route.description,
      tags: [route.tag],
      operationId: route.id,
      parameters: [],
      responses: {},
    }

    if (route.requiresAdminAuth) {
      operation.security = [{ AdminAuth: [] }]
    }

    if (pathParams.length > 0) {
      pathParams.forEach((p) => {
        const pName = p.name || p.key
        operation.parameters.push({
          name: pName,
          in: 'path',
          required: true,
          description: p.description || '',
          schema: {
            type: 'string',
            example: p.example || p.value || '',
          },
        })
      })
    }

    if (Array.isArray(route.queryParams) && route.queryParams.length > 0) {
      route.queryParams.forEach((qp) => {
        const qpName = qp.name || qp.key
        operation.parameters.push({
          name: qpName,
          in: 'query',
          required: Boolean(qp.required),
          description: qp.description || '',
          schema: {
            type: 'string',
            example: qp.example || qp.value || '',
          },
        })
      })
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method.toUpperCase())) {
      if (route.requestFormat === 'json' && route.defaultBody) {
        let parsedExample = {}
        try {
          parsedExample = JSON.parse(route.defaultBody || '{}')
        } catch {
          parsedExample = {}
        }

        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' },
              example: parsedExample,
            },
          },
        }
      } else if (route.requestFormat === 'formdata' && Array.isArray(route.defaultParams)) {
        const properties = {}
        route.defaultParams.forEach((p) => {
          const pKey = p.key || p.name
          if (p.type === 'file') {
            properties[pKey] = {
              type: 'string',
              format: 'binary',
              description: p.description || '',
            }
          } else {
            properties[pKey] = {
              type: 'string',
              example: p.value || p.example || '',
              description: p.description || '',
            }
          }
        })

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

    if (Array.isArray(route.responses)) {
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
    }

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
