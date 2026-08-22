'use client'

import { memo } from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LockIcon from '@mui/icons-material/Lock'
import { METHOD_COLORS } from '../devConstants'
import ApiRequestPanel from './ApiRequestPanel'
import ApiResponseViewer from './ApiResponseViewer'

const ApiEndpointAccordion = memo(function ApiEndpointAccordion({
  route,
  isExpanded = false,
  onAccordionChange,
  state,
  onUpdateState,
  onExecuteRequest,
  onCopyCurl,
}) {
  if (!route || !route.id) return null

  const methodKey = route.method || 'GET'
  const methodStyle = METHOD_COLORS[methodKey] || METHOD_COLORS.GET

  return (
    <Accordion
      expanded={isExpanded}
      onChange={onAccordionChange}
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
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', flexWrap: 'wrap' }}
        >
          <Chip
            label={methodKey}
            size='small'
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
            variant='subtitle1'
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'primary.light',
              fontSize: '0.95rem',
            }}
          >
            {route.path || '/api'}
          </Typography>

          <Typography variant='body2' sx={{ color: 'text.secondary', flexGrow: 1 }}>
            {route.summary || ''}
          </Typography>

          {route.requiresAdminAuth && (
            <Chip
              icon={<LockIcon fontSize='small' />}
              label='Admin Auth'
              color='warning'
              variant='outlined'
              size='small'
              sx={{ fontWeight: 600 }}
            />
          )}

          <Chip
            label={route.tag || 'API'}
            variant='outlined'
            size='small'
            sx={{ color: 'text.secondary', borderColor: 'rgba(255,255,255,0.1)' }}
          />
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 3, pb: 3, pt: 1 }}>
        <Divider sx={{ mb: 2.5 }} />

        <Typography variant='body2' sx={{ color: 'text.primary', mb: 3 }}>
          {route.description || ''}
        </Typography>

        <ApiRequestPanel
          route={route}
          state={state}
          onUpdateState={onUpdateState}
          onExecuteRequest={onExecuteRequest}
          onCopyCurl={onCopyCurl}
        />

        <ApiResponseViewer response={state?.response} />
      </AccordionDetails>
    </Accordion>
  )
})

export default ApiEndpointAccordion
