'use client'

import { memo } from 'react'
import {
  Paper,
  Box,
  Typography,
  Chip,
} from '@mui/material'

const ApiResponseViewer = memo(function ApiResponseViewer({ response }) {
  if (!response) return null

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        backgroundColor: '#0a0a0f',
        borderColor: response.isOk ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={`Status: ${response.status ?? 0} ${response.statusText ?? ''}`}
            color={response.isOk ? 'success' : 'error'}
            size="small"
            sx={{ fontWeight: 800 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
            Time: {response.durationMs ?? 0} ms
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
          color: response.isOk ? '#a5d6a7' : '#ef9a9a',
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
        {response.body || ''}
      </Typography>
    </Paper>
  )
})

export default ApiResponseViewer
