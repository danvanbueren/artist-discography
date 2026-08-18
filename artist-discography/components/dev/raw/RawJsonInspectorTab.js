'use client'

import { useState } from 'react'
import {
  Stack,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

export default function RawJsonInspectorTab({ dataState }) {
  const [copiedJson, setCopiedJson] = useState(false)

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(dataState, null, 2))
      setCopiedJson(true)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch (err) { }
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Raw artist-data.json Inspector
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyJson}
          sx={{ borderRadius: 2 }}
        >
          {copiedJson ? 'Copied to Clipboard!' : 'Copy JSON'}
        </Button>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          backgroundColor: '#0d0d12',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2.5,
          maxHeight: 550,
          overflowY: 'auto',
        }}
      >
        <Typography
          component="pre"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: '#81d4fa',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {JSON.stringify(dataState, null, 2)}
        </Typography>
      </Paper>
    </Stack>
  )
}
