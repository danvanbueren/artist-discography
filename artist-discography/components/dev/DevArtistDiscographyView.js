'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
} from '@mui/material'

import { useDevAudioPreview } from './hooks/useDevAudioPreview'
import { useDevDummySeeder } from './hooks/useDevDummySeeder'

import DevHeader from './layout/DevHeader'
import DevOverviewTab from './overview/DevOverviewTab'
import DevApiExplorer from './DevApiExplorer'
import DevDiscographyAuditView from './DevDiscographyAuditView'
import DevPlatformsSocialsView from './DevPlatformsSocialsView'
import RawJsonInspectorTab from './raw/RawJsonInspectorTab'

export default function DevArtistDiscographyView({ data: initialData, health }) {
  const [mounted, setMounted] = useState(false)
  const [dataState, setDataState] = useState(initialData)
  const [activeTab, setActiveTab] = useState(0)

  // 1. Audio preview playback hook
  const { playingAudioUrl, handleToggleAudio } = useDevAudioPreview()

  // 2. Dummy data generator hook
  const {
    isGeneratingDummy,
    seedMessage,
    setSeedMessage,
    seedError,
    setSeedError,
    handleGenerateDummyData,
  } = useDevDummySeeder((newData) => {
    setDataState(newData)
  })

  useEffect(() => {
    setMounted(true)
    try {
      const savedTab = sessionStorage.getItem('dev_active_tab')
      if (savedTab !== null) {
        const parsed = parseInt(savedTab, 10)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
          setActiveTab(parsed)
        }
      }
    } catch (e) { }
  }, [])

  useEffect(() => {
    if (initialData) {
      setDataState(initialData)
    }
  }, [initialData])

  const handleTabChange = (_, val) => {
    setActiveTab(val)
    try {
      sessionStorage.setItem('dev_active_tab', String(val))
    } catch (e) { }
  }

  const artistName = dataState?.artist?.name ?? ''
  const isArtistNameEmpty = !artistName || artistName.trim() === ''
  const platforms = dataState?.artist?.links?.platforms ?? {}
  const socials = dataState?.artist?.links?.socials ?? {}
  const projects = dataState?.projects ?? []

  // Metrics computation
  let totalTracksCount = 0
  let tracksWithAudioCount = 0
  let projectsWithCoverCount = 0
  let totalPlatformLinksCount = 0

  projects.forEach((p) => {
    if (p.cover || p.hasCover) projectsWithCoverCount++
    const trks = p.tracks ?? []
    totalTracksCount += trks.length
    trks.forEach((t) => {
      if (t.audioUrl || t.hasAudio || t.audio) tracksWithAudioCount++
      const links = t.links ?? {}
      Object.values(links).forEach((l) => {
        if (l && typeof l === 'string' && l.trim() !== '') totalPlatformLinksCount++
      })
    })
  })

  const audioCoveragePct = totalTracksCount > 0 ? Math.round((tracksWithAudioCount / totalTracksCount) * 100) : 0
  const coverCoveragePct = projects.length > 0 ? Math.round((projectsWithCoverCount / projects.length) * 100) : 0

  return (
    <Box
      sx={{
        height: '100vh',
        maxHeight: '100vh',
        width: '100%',
        bgcolor: '#0a0a0f',
        color: 'text.primary',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 5 }}>
        {/* Top Header & Tab Bar */}
        <DevHeader
          seedMessage={seedMessage}
          setSeedMessage={setSeedMessage}
          seedError={seedError}
          setSeedError={setSeedError}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
        />

        {/* Tab Content Panels */}
        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            backgroundColor: 'rgba(20, 20, 28, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            p: 3,
            mt: 4,
          }}
        >
          {/* TAB 0: System Overview & Health */}
          <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
            <DevOverviewTab
              isArtistNameEmpty={isArtistNameEmpty}
              health={health}
              projects={projects}
              totalTracksCount={totalTracksCount}
              coverCoveragePct={coverCoveragePct}
              audioCoveragePct={audioCoveragePct}
              totalPlatformLinksCount={totalPlatformLinksCount}
              adminAccess={Boolean(dataState?.adminAccess)}
              devAccess={Boolean(dataState?.devAccess)}
              isGeneratingDummy={isGeneratingDummy}
              handleGenerateDummyData={handleGenerateDummyData}
            />
          </Box>

          {/* TAB 1: API Explorer */}
          <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
            <DevApiExplorer />
          </Box>

          {/* TAB 2: Discography & Media Audit */}
          <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
            <DevDiscographyAuditView
              projects={projects}
              artistName={artistName}
              health={health}
              mounted={mounted}
              playingAudioUrl={playingAudioUrl}
              handleToggleAudio={handleToggleAudio}
            />
          </Box>

          {/* TAB 3: Platforms & Socials */}
          <Box sx={{ display: activeTab === 3 ? 'block' : 'none' }}>
            <DevPlatformsSocialsView
              platforms={platforms}
              socials={socials}
            />
          </Box>

          {/* TAB 4: Raw JSON Inspector */}
          <Box sx={{ display: activeTab === 4 ? 'block' : 'none' }}>
            <RawJsonInspectorTab dataState={dataState} />
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
