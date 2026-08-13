'use client'

import React, { useState, Component } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  AlertTitle,
  CircularProgress,
  Stack,
  InputAdornment,
  Grid,
} from '@mui/material'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import LaunchIcon from '@mui/icons-material/Launch'
import SearchIcon from '@mui/icons-material/Search'
import LockIcon from '@mui/icons-material/Lock'
import CodeIcon from '@mui/icons-material/Code'

import { API_TAGS, API_ROUTES_SPEC } from '../lib/apiSpec'

const METHOD_COLORS = {
  GET: {
    textColor: '#81c784',
    bg: 'rgba(46, 125, 50, 0.35)',
    border: 'rgba(76, 175, 80, 0.6)',
    boxShadow: '0 0 10px rgba(76, 175, 80, 0.2)',
  },
  POST: {
    textColor: '#64b5f6',
    bg: 'rgba(25, 118, 210, 0.35)',
    border: 'rgba(33, 150, 243, 0.6)',
    boxShadow: '0 0 10px rgba(33, 150, 243, 0.2)',
  },
  PUT: {
    textColor: '#ffb74d',
    bg: 'rgba(237, 108, 2, 0.35)',
    border: 'rgba(255, 152, 0, 0.6)',
    boxShadow: '0 0 10px rgba(255, 152, 0, 0.2)',
  },
  DELETE: {
    textColor: '#e57373',
    bg: 'rgba(211, 47, 47, 0.35)',
    border: 'rgba(244, 67, 54, 0.6)',
    boxShadow: '0 0 10px rgba(244, 67, 54, 0.2)',
  },
}

// React Error Boundary class to guarantee whole-app safety
class ApiExplorerErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('API Explorer Component Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 3, borderRadius: 2.5, backgroundColor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>API Explorer Encountered an Error</AlertTitle>
            {this.state.error?.message || 'An unexpected rendering error occurred inside the API Explorer console.'}
          </Alert>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => this.setState({ hasError: false, error: null })}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Reload API Explorer
          </Button>
        </Paper>
      )
    }
    return this.props.children
  }
}

function DevApiExplorerInner() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('ALL')
  const [expandedId, setExpandedId] = useState(false)
  const [adminPassword, setAdminPassword] = useState('admin')
  
  // Endpoint trial state: keyed by endpoint id
  const [requestState, setRequestState] = useState({})

  const handleAccordionChange = (id) => (_, isExpanded) => {
    setExpandedId(isExpanded ? id : false)
  }

  const getEndpointState = (id, route) => {
    try {
      if (requestState?.[id]) return requestState[id]
      
      // Safe initial defaults
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

  const updateEndpointState = (id, updater) => {
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
  }

  // Construct target URL with path parameters safely evaluated
  const buildTargetUrl = (route, pathParams = {}) => {
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

  // Generate cURL command string safely
  const generateCurlCommand = (route, state = {}) => {
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

  const handleCopyCurl = (route, id) => {
    try {
      const currentState = getEndpointState(id, route)
      const cmd = generateCurlCommand(route, currentState)
      navigator.clipboard.writeText(cmd)
      updateEndpointState(id, (prev) => ({ ...prev, copiedCurl: true }))
      setTimeout(() => {
        updateEndpointState(id, (prev) => ({ ...prev, copiedCurl: false }))
      }, 2000)
    } catch (e) {}
  }

  // Execute test request against API endpoint
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
          durationMs: Math.round(endTime - startTime),
          headers: {},
          body: `Error: ${err.message}`,
          isOk: false,
        },
      }))
    }
  }

  // Download OpenAPI 3.0 spec JSON file
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

  // Filter routes based on search and tag selection safely
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
      {/* Top Header & OpenAPI Download Action Bar */}
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
            <CodeIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Interactive API Explorer & Console
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Interactive endpoint testing, parameter builder, live request execution, and OpenAPI specification
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadOpenApi}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Download OpenAPI Spec
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LaunchIcon />}
            href="/api/dev/openapi"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Raw JSON Spec
          </Button>
        </Box>
      </Box>

      {/* Global Controls & Filter Bar */}
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
              size="small"
              placeholder="Search endpoints by path, summary, or method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                htmlInput: {
                  sx: { fontSize: '0.9rem' },
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All Routes"
                clickable
                color={selectedTag === 'ALL' ? 'primary' : 'default'}
                variant={selectedTag === 'ALL' ? 'filled' : 'outlined'}
                size="small"
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
                  size="small"
                  onClick={() => setSelectedTag(tag?.name || 'ALL')}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Global Admin Password Header"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" color="action" />
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
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No API endpoints found matching search query "{searchQuery}".
        </Alert>
      ) : (
        filteredRoutes.map((route) => {
          try {
            if (!route || !route.id) return null

            const methodKey = route.method || 'GET'
            const methodStyle = METHOD_COLORS[methodKey] || METHOD_COLORS.GET
            const state = getEndpointState(route.id, route)
            const isExpanded = expandedId === route.id

            const pathParamsList = Array.isArray(route.pathParams) ? route.pathParams : []
            const defaultParamsList = Array.isArray(route.defaultParams) ? route.defaultParams : []

            return (
              <Accordion
                key={route.id}
                expanded={isExpanded}
                onChange={handleAccordionChange(route.id)}
                sx={{
                  backgroundColor: 'rgba(22, 22, 32, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  '&:before': { display: 'none' },
                  mb: 1.5,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    px: 2.5,
                    py: 1,
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', flexWrap: 'wrap' }}>
                    <Chip
                      label={methodKey}
                      size="small"
                      sx={{
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        minWidth: 68,
                        color: methodStyle.textColor,
                        backgroundColor: methodStyle.bg,
                        border: `1px solid ${methodStyle.border}`,
                        boxShadow: methodStyle.boxShadow,
                        letterSpacing: '0.04em',
                      }}
                    />

                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: 'primary.light',
                        fontSize: '0.95rem',
                      }}
                    >
                      {route.path || '/api'}
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                      {route.summary || ''}
                    </Typography>

                    {route.requiresAdminAuth && (
                      <Chip
                        icon={<LockIcon fontSize="small" />}
                        label="Admin Auth"
                        color="warning"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}

                    <Chip
                      label={route.tag || 'API'}
                      variant="outlined"
                      size="small"
                      sx={{ color: 'text.secondary', borderColor: 'rgba(255,255,255,0.1)' }}
                    />
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 3, pb: 3, pt: 1 }}>
                  <Divider sx={{ mb: 2.5 }} />

                  <Typography variant="body2" sx={{ color: 'text.primary', mb: 3 }}>
                    {route.description || ''}
                  </Typography>

                  {/* Path Parameters Section */}
                  {pathParamsList.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                        Path Parameters
                      </Typography>
                      <Grid container spacing={2}>
                        {pathParamsList.map((p) => {
                          if (!p || !p.name) return null
                          const paramName = p.name
                          const paramDesc = p.description || ''
                          const paramExample = p.example || ''
                          const currentVal = state?.pathParams?.[paramName] ?? paramExample

                          return (
                            <Grid key={paramName} size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label={`{${paramName}} (${paramDesc})`}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value
                                  updateEndpointState(route.id, (prev) => ({
                                    ...prev,
                                    pathParams: { ...(prev?.pathParams ?? {}), [paramName]: val },
                                  }))
                                }}
                              />
                            </Grid>
                          )
                        })}
                      </Grid>
                    </Box>
                  )}

                  {/* Request Body Builder Section */}
                  {route.method === 'POST' && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                        Request Body ({route.requestFormat === 'json' ? 'JSON' : 'Multipart Form-Data'})
                      </Typography>

                      {route.requestFormat === 'json' && (
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          size="small"
                          value={state?.body ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            updateEndpointState(route.id, (prev) => ({ ...prev, body: val }))
                          }}
                          slotProps={{
                            htmlInput: {
                              sx: {
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                backgroundColor: '#0c0c12',
                                color: '#90caf9',
                              },
                            },
                          }}
                        />
                      )}

                      {route.requestFormat === 'formdata' && (
                        <Grid container spacing={2}>
                          {defaultParamsList.map((p) => {
                            if (!p || !p.key) return null
                            const pKey = p.key
                            const pDesc = p.description || ''
                            const currentFormVal = state?.formDataParams?.[pKey] ?? ''

                            return (
                              <Grid key={pKey} size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label={`${pKey} (${pDesc})`}
                                  value={currentFormVal}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    updateEndpointState(route.id, (prev) => ({
                                      ...prev,
                                      formDataParams: {
                                        ...(prev?.formDataParams ?? {}),
                                        [pKey]: val,
                                      },
                                    }))
                                  }}
                                />
                              </Grid>
                            )
                          })}
                        </Grid>
                      )}
                    </Box>
                  )}

                  {/* Action Buttons: Execute & cURL Generator */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={state?.isLoading ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                      disabled={Boolean(state?.isLoading)}
                      onClick={() => handleExecuteRequest(route, route.id)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
                    >
                      {state?.isLoading ? 'Sending Request...' : 'Try It Out (Execute)'}
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => handleCopyCurl(route, route.id)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {state?.copiedCurl ? 'Copied cURL!' : 'Copy cURL'}
                    </Button>
                  </Box>

                  {/* Live Response Panel */}
                  {state?.response && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        backgroundColor: '#0a0a0f',
                        borderColor: state.response.isOk ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Chip
                            label={`Status: ${state.response.status ?? 0} ${state.response.statusText ?? ''}`}
                            color={state.response.isOk ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 800 }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                            Time: {state.response.durationMs ?? 0} ms
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
                        Response Body:
                      </Typography>

                      <Typography
                        component="pre"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          color: state.response.isOk ? '#a5d6a7' : '#ef9a9a',
                          m: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: 400,
                          overflowY: 'auto',
                          p: 1.5,
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          borderRadius: 1.5,
                        }}
                      >
                        {state.response.body || ''}
                      </Typography>
                    </Paper>
                  )}
                </AccordionDetails>
              </Accordion>
            )
          } catch (routeRenderErr) {
            console.error(`Error rendering route card for ${route?.id}:`, routeRenderErr)
            return (
              <Alert key={route?.id || Math.random()} severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
                Error rendering endpoint card for {route?.path || 'route'}: {routeRenderErr.message}
              </Alert>
            )
          }
        })
      )}
    </Stack>
  )
}

export default function DevApiExplorer(props) {
  return (
    <ApiExplorerErrorBoundary>
      <DevApiExplorerInner {...props} />
    </ApiExplorerErrorBoundary>
  )
}
