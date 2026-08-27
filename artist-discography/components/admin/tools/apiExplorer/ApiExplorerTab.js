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
  IconButton,
  Grid,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import LaunchIcon from '@mui/icons-material/Launch'
import SearchIcon from '@mui/icons-material/Search'
import LockIcon from '@mui/icons-material/Lock'
import CodeIcon from '@mui/icons-material/Code'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import { API_TAGS, API_ROUTES_SPEC } from '@/lib/api/apiSpec'
import ApiExplorerErrorBoundary from './ApiExplorerErrorBoundary'
import ApiEndpointAccordion from './ApiEndpointAccordion'
import RawJsonInspectorTab from '../raw/RawJsonInspectorTab'
import { ApiEndpointsSection } from './ApiEndpointsSection'

function buildTargetUrl(route, pathParams = {}, queryParams = {}) {
  try {
    let url = route?.path ?? ''
    const effectivePathParams = Array.isArray(route?.pathParams)
      ? route.pathParams
      : Array.isArray(route?.urlParams)
        ? route.urlParams
        : []

    effectivePathParams.forEach((p) => {
      const pName = p?.name || p?.key
      if (pName) {
        const val = pathParams?.[pName] ?? p.example ?? p.value ?? `{${pName}}`
        url = url.replace(`{${pName}}`, encodeURIComponent(String(val)))
      }
    })

    const effectiveQueryParams = Array.isArray(route?.queryParams) ? route.queryParams : []
    const searchParams = new URLSearchParams()
    effectiveQueryParams.forEach((qp) => {
      const qpName = qp?.name || qp?.key
      if (qpName) {
        const val = queryParams?.[qpName] ?? qp.example ?? qp.value ?? ''
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          searchParams.append(qpName, String(val).trim())
        }
      }
    })

    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }

    return url
  } catch {
    return route?.path ?? ''
  }
}

function generateCurlCommand(route, state = {}, adminPassword = '') {
  try {
    const targetUrl = buildTargetUrl(route, state?.pathParams ?? {}, state?.queryParams ?? {})
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const fullUrl = `${origin}${targetUrl}`
    const method = (route?.method ?? 'GET').toUpperCase()
    const parts = [`curl -X ${method} "${fullUrl}"`]

    if (route?.requiresAdminAuth) {
      parts.push(`-H "x-admin-password: ${adminPassword || 'YOUR_PASSWORD'}"`)
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (route?.requestFormat === 'json' && state?.body) {
        parts.push('-H "Content-Type: application/json"')
        try {
          const minified = JSON.stringify(JSON.parse(state.body))
          parts.push(`-d '${minified}'`)
        } catch {
          parts.push(`-d '${state.body}'`)
        }
      } else if (route?.requestFormat === 'formdata' && state?.formDataParams) {
        Object.entries(state.formDataParams).forEach(([k, v]) => {
          parts.push(`-F "${k}=${v}"`)
        })
      }
    }

    return parts.join(' \\\n  ')
  } catch {
    return `curl -X ${route?.method ?? 'GET'} "${route?.path ?? ''}"`
  }
}

export function DevApiExplorerInner({ adminPassword: initialAdminPassword = 'admin' }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('ALL')
  const [expandedId, setExpandedId] = useState(false)
  const [adminPassword, setAdminPassword] = useState(() => initialAdminPassword || 'admin')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
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
      const initialPathParams = {}
      const effectivePathParams = Array.isArray(route?.pathParams)
        ? route.pathParams
        : Array.isArray(route?.urlParams)
          ? route.urlParams
          : []
      effectivePathParams.forEach((p) => {
        const pName = p?.name || p?.key
        if (pName) {
          initialPathParams[pName] = p.example ?? p.value ?? ''
        }
      })

      const initialQueryParams = {}
      if (Array.isArray(route?.queryParams)) {
        route.queryParams.forEach((qp) => {
          const qpName = qp?.name || qp?.key
          if (qpName) {
            initialQueryParams[qpName] = qp.example ?? qp.value ?? ''
          }
        })
      }

      const initialFormData = {}
      if (Array.isArray(route?.defaultParams)) {
        route.defaultParams.forEach((p) => {
          const pKey = p?.key || p?.name
          if (pKey) {
            initialFormData[pKey] = p.value ?? p.example ?? ''
          }
        })
      }

      return {
        body: initialBody,
        pathParams: initialPathParams,
        queryParams: initialQueryParams,
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
        queryParams: {},
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
    } catch {}
  }

  const handleExecuteRequest = async (route, id) => {
    try {
      const currentState = getEndpointState(id, route)
      const targetUrl = buildTargetUrl(
        route,
        currentState?.pathParams ?? {},
        currentState?.queryParams ?? {},
      )

      updateEndpointState(id, (prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        response: null,
      }))

      const startTime = performance.now()
      const method = (route?.method ?? 'GET').toUpperCase()
      const headers = {}
      const fetchOptions = {
        method,
        headers,
      }

      if (route?.requiresAdminAuth && adminPassword) {
        headers['x-admin-password'] = adminPassword
      }

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if (route?.requestFormat === 'json') {
          headers['Content-Type'] = 'application/json'
          if (currentState?.body) {
            fetchOptions.body = currentState.body
          }
        } else if (route?.requestFormat === 'formdata') {
          const fd = new FormData()
          if (currentState?.formDataParams) {
            Object.entries(currentState.formDataParams).forEach(([k, v]) => {
              if (v !== null && v !== undefined) {
                fd.append(k, String(v))
              }
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
              type={showAdminPassword ? 'text' : 'password'}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <LockIcon fontSize='small' color='action' />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        onClick={() => setShowAdminPassword((prev) => !prev)}
                        edge='end'
                        sx={{ color: 'text.secondary' }}
                        aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                      >
                        {showAdminPassword ? (
                          <VisibilityOffRoundedIcon fontSize='small' />
                        ) : (
                          <VisibilityRoundedIcon fontSize='small' />
                        )}
                      </IconButton>
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

function ApiExplorerTabComponent({
  currentJsonSnapshot = {},
  jsonData,
  dataState,
  adminPassword = '',
}) {
  const activeSnapshot = currentJsonSnapshot || dataState || jsonData || {}
  const [activeSection, setActiveSection] = useState('endpoints') // 'database' | 'endpoints'

  const handleToggle = (section) => (_, isExpanded) => {
    if (isExpanded) {
      setActiveSection(section)
    } else {
      // Closing active switches to the other
      setActiveSection(section === 'database' ? 'endpoints' : 'database')
    }
  }

  const isDatabaseActive = activeSection === 'database'

  const databaseSection = (
    <RawJsonInspectorTab
      key='database'
      dataState={activeSnapshot}
      expanded={isDatabaseActive}
      onToggle={handleToggle('database')}
    />
  )

  const endpointsSection = (
    <ApiEndpointsSection
      key='endpoints'
      adminPassword={adminPassword}
      expanded={!isDatabaseActive}
      onToggle={handleToggle('endpoints')}
    />
  )

  return (
    <ApiExplorerErrorBoundary>
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: '100%',
          gap: 2,
        }}
      >
        {/* Always render closed accordion on top, open accordion below */}
        {isDatabaseActive ? (
          <>
            {endpointsSection}
            {databaseSection}
          </>
        ) : (
          <>
            {databaseSection}
            {endpointsSection}
          </>
        )}
      </Box>
    </ApiExplorerErrorBoundary>
  )
}

export default memo(ApiExplorerTabComponent)
