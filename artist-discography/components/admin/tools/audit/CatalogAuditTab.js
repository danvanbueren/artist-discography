'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import { Stack, Alert } from '@mui/material'
import { DENSITY_SETTINGS } from '../devConstants'
import { AuditMetricsCards } from './AuditMetricsCards'
import AuditHeaderControls from './AuditHeaderControls'
import ProjectAuditAccordion from './ProjectAuditAccordion'
import { CatalogHealthModal } from './CatalogHealthModal'

function CatalogAuditTab({
  projects = [],
  totalTracksCount = 0,
  tracksWithAudioCount = 0,
  projectsWithCoverCount = 0,
  audioCoveragePct = 0,
  coverCoveragePct = 0,
  artistName = '',
  health = {},
  mounted = true,
  playingAudioUrl = null,
  handleToggleAudio = () => {},
  handleSeekRelative = () => {},
}) {
  const [viewDensity, setViewDensity] = useState('cozy')
  const [healthModalOpen, setHealthModalOpen] = useState(false)
  // Default expansion: first project expanded, subsequent projects collapsed
  const [expandedProjects, setExpandedProjects] = useState({ 0: true })

  const density = DENSITY_SETTINGS[viewDensity] || DENSITY_SETTINGS.cozy

  // Compute live catalog health & specific issues for modal & status indicator
  const combinedHealth = useMemo(() => {
    const issues = [...(health?.issues || [])]

    projects.forEach((proj) => {
      const projName = proj.name || 'Untitled Project'
      if (!proj.cover && !proj.hasCover) {
        issues.push(`Project "${projName}": Missing cover artwork.`)
      }
      const trks = proj.tracks || []
      const missingAudio = trks.filter((t) => !t.hasAudio && !t.audioUrl && !t.audio).length
      if (missingAudio > 0) {
        issues.push(
          `Project "${projName}": ${missingAudio} of ${trks.length} track(s) missing audio master.`,
        )
      }
    })

    const uniqueIssues = Array.from(new Set(issues))

    return {
      isHealthy: Boolean((health?.isHealthy ?? true) && uniqueIssues.length === 0),
      issues: uniqueIssues,
    }
  }, [health, projects])

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
    <Stack spacing={2.5}>
      {/* 1. Top Metrics Cards (Total Projects, Total Tracks, Audio Ready, Artwork Ready) */}
      <AuditMetricsCards
        projectsCount={projects.length}
        totalTracksCount={totalTracksCount}
        tracksWithAudioCount={tracksWithAudioCount}
        projectsWithCoverCount={projectsWithCoverCount}
        audioCoveragePct={audioCoveragePct}
        coverCoveragePct={coverCoveragePct}
      />

      {/* 2. Controls & View Switcher Bar */}
      <AuditHeaderControls
        projectsCount={projects.length}
        health={combinedHealth}
        mounted={mounted}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        viewDensity={viewDensity}
        onDensityChange={handleDensityChange}
        density={density}
        onOpenHealthModal={() => setHealthModalOpen(true)}
      />

      {/* 3. Projects List Accordion Cards */}
      {projects.length === 0 ? (
        <Alert severity='info' sx={{ borderRadius: 2.5 }}>
          No projects found in data/projects/.
        </Alert>
      ) : (
        projects.map((proj, idx) => {
          const isExpanded =
            expandedProjects[idx] === undefined ? idx === 0 : Boolean(expandedProjects[idx])
          return (
            <ProjectAuditAccordion
              key={proj.slug || proj.name || idx}
              project={proj}
              pIdx={idx}
              artistName={artistName}
              isExpanded={isExpanded}
              onToggleExpand={handleAccordionToggle}
              density={density}
              viewDensity={viewDensity}
              playingTrackUrl={playingAudioUrl}
              onToggleAudio={handleToggleAudio}
              onSeekRelative={handleSeekRelative}
            />
          )
        })
      )}

      {/* 4. Interactive Data File & Catalog Health Modal */}
      <CatalogHealthModal
        open={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        health={health}
        projects={projects}
      />
    </Stack>
  )
}

export default memo(CatalogAuditTab)
