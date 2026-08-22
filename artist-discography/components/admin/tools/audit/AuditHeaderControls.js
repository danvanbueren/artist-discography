'use client'

import { Box, Typography, Chip, Button, ToggleButton, ToggleButtonGroup } from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ViewComfyIcon from '@mui/icons-material/ViewComfy'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'

export default function AuditHeaderControls({
  projectsCount = 0,
  health = {},
  mounted = false,
  onExpandAll,
  onCollapseAll,
  viewDensity = 'cozy',
  onDensityChange,
  density = {},
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        p: density.cardPadding,
        backgroundColor: 'rgba(26, 26, 38, 0.75)',
        borderRadius: 2.5,
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant='h6' sx={{ fontWeight: 800 }}>
          Projects &amp; Tracks Media Audit ({projectsCount} Releases)
        </Typography>
        <Chip
          icon={mounted && health?.isHealthy ? <CheckCircleOutlineRoundedIcon /> : undefined}
          label={health?.isHealthy ? 'JSON File: Valid' : 'Health Warnings'}
          color={health?.isHealthy ? 'success' : 'warning'}
          variant='outlined'
          size='small'
          sx={{ fontWeight: 700 }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {/* Expand / Collapse All Controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size='small'
            variant='outlined'
            startIcon={<UnfoldMoreIcon />}
            onClick={onExpandAll}
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
          >
            Expand All
          </Button>
          <Button
            size='small'
            variant='outlined'
            startIcon={<UnfoldLessIcon />}
            onClick={onCollapseAll}
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
          >
            Collapse All
          </Button>
        </Box>

        {/* View Density Switcher */}
        <ToggleButtonGroup
          value={viewDensity}
          exclusive
          onChange={onDensityChange}
          size='small'
          aria-label='view density switcher'
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            '& .MuiToggleButton-root': {
              px: 1.5,
              py: 0.5,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
            },
          }}
        >
          <ToggleButton value='comfortable' aria-label='comfortable view'>
            <ViewComfyIcon sx={{ fontSize: 16, mr: 0.5 }} /> Comfortable
          </ToggleButton>
          <ToggleButton value='cozy' aria-label='cozy view'>
            <ViewStreamIcon sx={{ fontSize: 16, mr: 0.5 }} /> Cozy
          </ToggleButton>
          <ToggleButton value='compact' aria-label='compact view'>
            <ViewHeadlineIcon sx={{ fontSize: 16, mr: 0.5 }} /> Compact
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  )
}
