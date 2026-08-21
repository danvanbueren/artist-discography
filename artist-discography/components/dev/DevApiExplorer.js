'use client'

import { useState, useCallback, useEffect, memo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  TextField,
  Alert,
  Stack,
  InputAdornment,
  Grid,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import LaunchIcon from '@mui/icons-material/Launch'
import SearchIcon from '@mui/icons-material/Search'
import LockIcon from '@mui/icons-material/Lock'
import CodeIcon from '@mui/icons-material/Code'
import { API_TAGS, API_ROUTES_SPEC } from '../../lib/apiSpec'
import ApiExplorerErrorBoundary from './apiExplorer/ApiExplorerErrorBoundary'
import ApiEndpointAccordion from './apiExplorer/ApiEndpointAccordion'

function buildTargetUrl(route, pathParams = {}) {
  try {
    let url = route?.path ?? ''
    if (Array.isArray(route?.pathParams)) {
      route.pathParams.forEach((p) => {
        if (p?.name) {
          const val = pathParams?.[p.name] ?? p.example ?? `{${p.name}}`
          url = url.replace(`{${p.name}}`, encodeURIComponent(String(val)))
        }
      })
    }
    return url
  } catch (err) {
    return route?.path ?? ''
  }
}

function generateCurlCommand(route, state = {}, adminPassword = '') {
  try {
    const targetUrl = buildTargetUrl(route, state?.pathParams ?? {})
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const fullUrl = `${origin}${targetUrl}`
    const parts = [`curl -X ${route?.method ?? 'GET'} "${fullUrl}"`]

    if (route?.requiresAdminAuth) {
      parts.push(`-H "x-admin-password: ${adminPassword || 'YOUR_PASSWORD'}"`)
    }

    if (route?.method === 'POST') {
      if (route?.requestFormat === 'json') {
        parts.push('-H "Content-Type: application/json"')
        if (state?.body) {
          try {
            const minified = JSON.stringify(JSON.parse(state.body))
            parts.push(`-d '${minified}'`)
          } catch (e) {
            parts.push(`-d '${state.body}'`)
          }
        }
      } else if (route?.requestFormat === 'formdata') {
        if (state?.formDataParams) {
          Object.entries(state.formDataParams).forEach(([k, v]) => {
            parts.push(`-F "${k}=${v}"`)
          })
        }
      }
    }

    return parts.join(' \\\n  ')
  } catch (err) {
    return `curl -X ${route?.method ?? 'GET'} "${route?.path ?? ''}"`
  }
}

function DevApiExplorerInner({ adminPassword: initialAdminPassword = 'admin' }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('ALL')
  const [expandedId, setExpandedId] = useState(false)
  const [adminPassword, setAdminPassword] = useState(() => initialAdminPassword || 'admin')
  const [requestState, setRequestState] = useState({})

  useEffect(() => {
    if (initialAdminPassword) {
      setAdminPassword(initialAdminPassword)
    }
  }, [initialAdminPassword])

  const handleAccordionChange = (id) => (_, isExpanded) => {
    setExpandedId(isExpanded ? id : false)
  }

  const getEndpointState = (id, route) => {
    try {
      if (requestState?.[id]) return requestState[id]

      const initialBody = route?.defaultBody ?? ''
      const initialParams = {}
      if (Array.isArray(route?.pathParams)) {
        route.pathParams.forEach((p) => {
          if (p?.name) {
            initialParams[p.name] = p.example ?? ''
          }
        })
      }
      const initialFormData = {}
      if (Array.isArray(route?.defaultParams)) {
        route.defaultParams.forEach((p) => {
          if (p?.key) {
            initialFormData[p.key] = p.value ?? ''
          }
        })
      }

      return {
        body: initialBody,
        pathParams: initialParams,
        formDataParams: initialFormData,
        isLoading: false,
        response: null,
        error: null,
        copiedCurl: false,
      }
    } catch (err) {
      return {
        body: '',
        pathParams: {},
        formDataParams: {},
        isLoading: false,
        response: null,
        error: `State init error: ${err.message}`,
        copiedCurl: false,
      }
    }
  }

  const updateEndpointState = useCallback((id, updater) => {
    try {
      setRequestState((prev) => {
        const current = prev?.[id] ?? {}
        return {
          ...prev,
          [id]: updater(current),
        }
      })
    } catch (err) {
      console.error('Error updating endpoint state:', err)
    }
  }, [])

  const handleCopyCurl = (route, id) => {
    try {
      const currentState = getEndpointState(id, route)
      const cmd = generateCurlCommand(route, currentState, adminPassword)
      navigator.clipboard.writeText(cmd)
      updateEndpointState(id, (prev) => ({ ...prev, copiedCurl: true }))
      setTimeout(() => {
        updateEndpointState(id, (prev) => ({ ...prev, copiedCurl: false }))
      }, 2000)
    } catch (e) {}
  }

  const handleExecuteRequest = async (route, id) => {
    try {
      const currentState = getEndpointState(id, route)
      const targetUrl = buildTargetUrl(route, currentState?.pathParams ?? {})

      updateEndpointState(id, (prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        response: null,
      }))

      const startTime = performance.now()
      const headers = {}
      let fetchOptions = {
        method: route?.method ?? 'GET',
        headers,
      }

      if (route?.requiresAdminAuth && adminPassword) {
        headers['x-admin-password'] = adminPassword
      }

      if (route?.method === 'POST') {
        if (route?.requestFormat === 'json') {
          headers['Content-Type'] = 'application/json'
          fetchOptions.body = currentState?.body ?? '{}'
        } else if (route?.requestFormat === 'formdata') {
          const fd = new FormData()
          if (currentState?.formDataParams) {
            Object.entries(currentState.formDataParams).forEach(([k, v]) => {
              fd.append(k, String(v))
            })
          }
          fetchOptions.body = fd
        }
      }

      const res = await fetch(targetUrl, fetchOptions)
      const endTime = performance.now()
      const durationMs = Math.round(endTime - startTime)

      const responseHeaders = {}
      res.headers.forEach((val, key) => {
        responseHeaders[key] = val
      })

      const contentType = res.headers.get('content-type') || ''
      let responseBody = ''

      if (contentType.includes('application/json')) {
        const json = await res.json()
        responseBody = JSON.stringify(json, null, 2)
      } else if (contentType.includes('text/') || contentType.includes('json')) {
        responseBody = await res.text()
      } else {
        responseBody = `[Binary Output Stream - Content-Type: ${contentType}, Status: ${res.status}]`
      }

      updateEndpointState(id, (prev) => ({
        ...prev,
        isLoading: false,
        response: {
          status: res.status,
          statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
          durationMs,
          headers: responseHeaders,
          body: responseBody,
          isOk: res.ok,
        },
      }))
    } catch (err) {
      const endTime = performance.now()
      updateEndpointState(id, (prev) => ({
        ...prev,
        isLoading: false,
        error: `Request failed: ${err.message}`,
        response: {
          status: 0,
          statusText: 'Network Error',
          durationMs: Math.round(endTime - performance.now()),
          headers: {},
          body: `Error: ${err.message}`,
          isOk: false,
        },
      }))
    }
  }

  const handleDownloadOpenApi = async () => {
    try {
      const res = await fetch('/api/dev/openapi')
      const data = await res.json()
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', jsonString)
      downloadAnchor.setAttribute('download', 'openapi-discography-spec.json')
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (err) {
      alert(`Failed to download spec: ${err.message}`)
    }
  }

  const routesList = Array.isArray(API_ROUTES_SPEC) ? API_ROUTES_SPEC : []
  const filteredRoutes = routesList.filter((route) => {
    try {
      if (!route) return false
      const matchesTag = selectedTag === 'ALL' || route.tag === selectedTag
      const query = (searchQuery || '').toLowerCase().trim()
      if (!query) return matchesTag

      const matchesSearch =
        (route.path || '').toLowerCase().includes(query) ||
        (route.summary || '').toLowerCase().includes(query) ||
        (route.description || '').toLowerCase().includes(query) ||
        (route.method || '').toLowerCase().includes(query)

      return matchesTag && matchesSearch
    } catch (e) {
      return false
    }
  })

  const safeTagsList = Array.isArray(API_TAGS) ? API_TAGS : []

  return (
    <Stack spacing={3}>
      {/* Top Header & Actions Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          p: 2.5,
          backgroundColor: 'rgba(26, 26, 38, 0.7)',
          borderRadius: 2.5,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <CodeIcon color='primary' />
            <Typography variant='h6' sx={{ fontWeight: 800 }}>
              Interactive API Explorer &amp; Console
            </Typography>
          </Box>
          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
            Interactive endpoint testing, parameter builder, live request execution, and OpenAPI
            specification
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant='contained'
            color='primary'
            size='small'
            startIcon={<DownloadIcon />}
            onClick={handleDownloadOpenApi}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Download OpenAPI Spec
          </Button>
          <Button
            variant='outlined'
            size='small'
            startIcon={<LaunchIcon />}
            href='/api/dev/openapi'
            target='_blank'
            rel='noopener noreferrer'
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Raw JSON Spec
          </Button>
        </Box>
      </Box>

      {/* Filter & Controls Bar */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2.5,
          backgroundColor: 'rgba(20, 20, 30, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size='small'
              placeholder='Search endpoints by path, summary, or method...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                htmlInput: {
                  sx: { fontSize: '0.9rem' },
                },
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon fontSize='small' />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label='All Routes'
                clickable
                color={selectedTag === 'ALL' ? 'primary' : 'default'}
                variant={selectedTag === 'ALL' ? 'filled' : 'outlined'}
                size='small'
                onClick={() => setSelectedTag('ALL')}
                sx={{ fontWeight: 600 }}
              />
              {safeTagsList.map((tag) => (
                <Chip
                  key={tag?.name || 'tag'}
                  label={tag?.name || 'Tag'}
                  clickable
                  color={selectedTag === tag?.name ? 'primary' : 'default'}
                  variant={selectedTag === tag?.name ? 'filled' : 'outlined'}
                  size='small'
                  onClick={() => setSelectedTag(tag?.name || 'ALL')}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size='small'
              label='Global Admin Password Header'
              type='password'
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <LockIcon fontSize='small' color='action' />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Endpoints Accordion List */}
      {filteredRoutes.length === 0 ? (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No API endpoints found matching search query &quot;{searchQuery}&quot;.
        </Alert>
      ) : (
        filteredRoutes.map((route) => {
          if (!route?.id) return null
          const state = getEndpointState(route.id, route)
          const isExpanded = expandedId === route.id

          return (
            <ApiEndpointAccordion
              key={route.id}
              route={route}
              isExpanded={isExpanded}
              onAccordionChange={handleAccordionChange(route.id)}
              state={state}
              onUpdateState={(updater) => updateEndpointState(route.id, updater)}
              onExecuteRequest={() => handleExecuteRequest(route, route.id)}
              onCopyCurl={() => handleCopyCurl(route, route.id)}
            />
          )
        })
      )}
    </Stack>
  )
}

function DevApiExplorer(props) {
  return (
    <ApiExplorerErrorBoundary>
      <DevApiExplorerInner {...props} />
    </ApiExplorerErrorBoundary>
  )
}

export default memo(DevApiExplorer)
