'use client'

import { useState, memo } from 'react'
import {
  Stack,
  Alert,
} from '@mui/material'
import { DENSITY_SETTINGS } from '../devConstants'
import AuditHeaderControls from './AuditHeaderControls'
import ProjectAuditAccordion from './ProjectAuditAccordion'

function DevDiscographyAuditView({
  projects = [],
  artistName = '',
  health = {},
  mounted = false,
  playingAudioUrl = null,
  handleToggleAudio = () => {},
}) {
  const [viewDensity, setViewDensity] = useState('cozy')
  // Track open state for each project index (default to all expanded)
  const [expandedProjects, setExpandedProjects] = useState({})

  const density = DENSITY_SETTINGS[viewDensity] || DENSITY_SETTINGS.cozy

  const handleAccordionToggle = (idx) => {
    setExpandedProjects((prev) => {
      const isCurrentlyExpanded = prev[idx] !== false
      return {
        ...prev,
        [idx]: !isCurrentlyExpanded,
      }
    })
  }

  const handleExpandAll = () => {
    const allOpen = {}
    projects.forEach((_, idx) => {
      allOpen[idx] = true
    })
    setExpandedProjects(allOpen)
  }

  const handleCollapseAll = () => {
    const allClosed = {}
    projects.forEach((_, idx) => {
      allClosed[idx] = false
    })
    setExpandedProjects(allClosed)
  }

  return (
    <Stack spacing={density.spacing}>
      {/* Top Header & View Controls Bar */}
      <AuditHeaderControls
        projectsCount={projects.length}
        health={health}
        mounted={mounted}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        viewDensity={viewDensity}
        onDensityChange={(_, newDensity) => {
          if (newDensity) setViewDensity(newDensity)
        }}
        density={density}
      />

      {/* Projects List Accordion Cards */}
      {projects.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No projects found in artist-data.json.
        </Alert>
      ) : (
        projects.map((proj, idx) => (
          <ProjectAuditAccordion
            key={idx}
            proj={proj}
            idx={idx}
            artistName={artistName}
            isExpanded={expandedProjects[idx] !== false}
            onToggle={handleAccordionToggle}
            density={density}
            viewDensity={viewDensity}
            playingAudioUrl={playingAudioUrl}
            handleToggleAudio={handleToggleAudio}
          />
        ))
      )}
    </Stack>
  )
}

export default memo(DevDiscographyAuditView)
