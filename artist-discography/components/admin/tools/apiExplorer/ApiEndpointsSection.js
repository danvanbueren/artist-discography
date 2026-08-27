'use client'

import { memo } from 'react'
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CodeIcon from '@mui/icons-material/Code'
import { DevApiExplorerInner } from './ApiExplorerTab'

/**
 * ApiEndpointsSection
 * Collapsible API explorer section inside the Admin API tab.
 */
export const ApiEndpointsSection = memo(function ApiEndpointsSection({
  adminPassword = '',
  expanded = true,
  onToggle,
}) {
  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      slotProps={{
        transition: {
          timeout: 0,
        },
      }}
      sx={{
        borderRadius: 2.5,
        backgroundColor: 'rgba(26, 26, 38, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:before': { display: 'none' },
        ...(expanded
          ? {
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
              '& .MuiCollapse-root, & .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner, & .MuiAccordion-region':
                {
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                },
            }
          : {
              flexShrink: 0,
            }),
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2.5,
          minHeight: 56,
          flexShrink: 0,
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CodeIcon sx={{ color: 'primary.main', fontSize: 24 }} />
          <Box>
            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              API Endpoints
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              Interactive endpoint testing, parameter builder, live request execution, and OpenAPI
              specification
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          px: 2.5,
          pt: 0,
          pb: 2.5,
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <DevApiExplorerInner adminPassword={adminPassword} />
      </AccordionDetails>
    </Accordion>
  )
})
