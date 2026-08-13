import { NextResponse } from 'next/server'
import { generateOpenApiSpec } from '../../../../lib/apiSpec'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const spec = generateOpenApiSpec(baseUrl)

    return NextResponse.json(spec, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to generate OpenAPI spec: ${err.message}` },
      { status: 500 }
    )
  }
}
