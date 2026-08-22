'use client'

import { useState, useCallback, memo } from 'react'
import { Stack, Alert } from '@mui/material'
import { DENSITY_SETTINGS } from '../devConstants'
import AuditHeaderControls from './AuditHeaderControls'
import ProjectAuditAccordion from './ProjectAuditAccordion'

function CatalogAuditTab({
  projects = [],
  artistName = '',
  health = {},
  mounted = false,
  playingAudioUrl = null,
  handleToggleAudio = () => {},
  handleSeekRelative = () => {},
}) {
  const [viewDensity, setViewDensity] = useState('cozy')
  // Default expansion: first project expanded, subsequent projects lazy/collapsed
  const [expandedProjects, setExpandedProjects] = useState({ 0: true })

  const density = DENSITY_SETTINGS[viewDensity] || DENSITY_SETTINGS.cozy

  const handleAccordionToggle = useCallback((idx) => {
    setExpandedProjects((prev) => {
      const isCurrentlyExpanded = prev[idx] === undefined ? idx === 0 : Boolean(prev[idx])
      return {
        ...prev,
        [idx]: !isCurrentlyExpanded,
      }
    })
  }, [])

  const handleExpandAll = useCallback(() => {
    const allOpen = {}
    projects.forEach((_, idx) => {
      allOpen[idx] = true
    })
    setExpandedProjects(allOpen)
  }, [projects])

  const handleCollapseAll = useCallback(() => {
    const allClosed = {}
    projects.forEach((_, idx) => {
      allClosed[idx] = false
    })
    setExpandedProjects(allClosed)
  }, [projects])

  const handleDensityChange = useCallback((_, newDensity) => {
    if (newDensity) setViewDensity(newDensity)
  }, [])

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
        onDensityChange={handleDensityChange}
        density={density}
      />

      {/* Projects List Accordion Cards */}
      {projects.length === 0 ? (
        <Alert severity='info' sx={{ borderRadius: 2 }}>
          No projects found in data/projects/.
        </Alert>
      ) : (
        projects.map((proj, idx) => {
          const isExpanded =
            expandedProjects[idx] === undefined ? idx === 0 : Boolean(expandedProjects[idx])
          return (
            <ProjectAuditAccordion
              key={proj.id || proj.name || idx}
              proj={proj}
              idx={idx}
              artistName={artistName}
              isExpanded={isExpanded}
              onToggle={handleAccordionToggle}
              density={density}
              viewDensity={viewDensity}
              playingAudioUrl={playingAudioUrl}
              handleToggleAudio={handleToggleAudio}
              handleSeekRelative={handleSeekRelative}
            />
          )
        })
      )}
    </Stack>
  )
}

export default memo(CatalogAuditTab)
