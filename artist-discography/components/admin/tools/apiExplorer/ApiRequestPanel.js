'use client'

import { memo } from 'react'
import { Box, Typography, Grid, TextField, Button, CircularProgress } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

const ApiRequestPanel = memo(function ApiRequestPanel({
  route,
  state,
  onUpdateState,
  onExecuteRequest,
  onCopyCurl,
}) {
  const pathParamsList = Array.isArray(route?.pathParams)
    ? route.pathParams
    : Array.isArray(route?.urlParams)
      ? route.urlParams
      : []
  const queryParamsList = Array.isArray(route?.queryParams) ? route.queryParams : []
  const defaultParamsList = Array.isArray(route?.defaultParams) ? route.defaultParams : []
  const hasRequestBody =
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route?.method) && route?.requestFormat !== 'none'

  return (
    <>
      {/* Path Parameters Section */}
      {pathParamsList.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
            Path Parameters
          </Typography>
          <Grid container spacing={2}>
            {pathParamsList.map((p) => {
              const paramName = p?.name || p?.key
              if (!paramName) return null
              const paramDesc = p.description || ''
              const paramExample = p.example || p.value || ''
              const currentVal = state?.pathParams?.[paramName] ?? paramExample

              return (
                <Grid key={paramName} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size='small'
                    label={`{${paramName}} (${paramDesc})`}
                    value={currentVal}
                    onChange={(e) => {
                      const val = e.target.value
                      onUpdateState?.((prev) => ({
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

      {/* Query Parameters Section */}
      {queryParamsList.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
            Query Parameters
          </Typography>
          <Grid container spacing={2}>
            {queryParamsList.map((qp) => {
              const qpName = qp?.name || qp?.key
              if (!qpName) return null
              const qpDesc = qp.description || ''
              const qpExample = qp.example ?? qp.value ?? ''
              const currentVal = state?.queryParams?.[qpName] ?? qpExample

              return (
                <Grid key={qpName} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size='small'
                    label={`?${qpName} (${qpDesc})`}
                    value={currentVal}
                    onChange={(e) => {
                      const val = e.target.value
                      onUpdateState?.((prev) => ({
                        ...prev,
                        queryParams: { ...(prev?.queryParams ?? {}), [qpName]: val },
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
      {hasRequestBody && (
        <Box sx={{ mb: 3 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
            Request Body ({route.requestFormat === 'json' ? 'JSON' : 'Multipart Form-Data'})
          </Typography>

          {route.requestFormat === 'json' && (
            <TextField
              fullWidth
              multiline
              rows={6}
              size='small'
              value={state?.body ?? ''}
              onChange={(e) => {
                const val = e.target.value
                onUpdateState?.((prev) => ({ ...prev, body: val }))
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
                const pKey = p?.key || p?.name
                if (!pKey) return null
                const pDesc = p.description || ''
                const currentFormVal = state?.formDataParams?.[pKey] ?? ''

                return (
                  <Grid key={pKey} size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size='small'
                      label={`${pKey} (${pDesc})`}
                      value={currentFormVal}
                      onChange={(e) => {
                        const val = e.target.value
                        onUpdateState?.((prev) => ({
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
          variant='contained'
          color='primary'
          startIcon={
            state?.isLoading ? <CircularProgress size={18} color='inherit' /> : <PlayArrowIcon />
          }
          disabled={Boolean(state?.isLoading)}
          onClick={onExecuteRequest}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
        >
          {state?.isLoading ? 'Sending Request...' : 'Try It Out (Execute)'}
        </Button>

        <Button
          variant='outlined'
          startIcon={<ContentCopyIcon />}
          onClick={onCopyCurl}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {state?.copiedCurl ? 'Copied cURL!' : 'Copy cURL'}
        </Button>
      </Box>
    </>
  )
})

export default ApiRequestPanel
