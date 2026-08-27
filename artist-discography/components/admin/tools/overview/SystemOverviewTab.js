'use client'

import { useState } from 'react'
import { Box, Alert, AlertTitle } from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import FormatShareProjectsSection from '../share/FormatShareProjectsSection'
import { AnalyticsDashboardSection } from '../analytics/AnalyticsDashboardSection'

/**
 * SystemOverviewTab (Utilities Tab)
 * Hosts two mutually exclusive accordions: Server Analytics & Format & Share Projects.
 */
export default function SystemOverviewTab({
  isArtistNameEmpty = false,
  currentJsonSnapshot = {},
  jsonData,
  dataState,
  adminPassword = '',
}) {
  const activeSnapshot = currentJsonSnapshot || dataState || jsonData || {}
  const [activeSection, setActiveSection] = useState('analytics') // 'analytics' | 'share'

  const handleToggle = (section) => (_, isExpanded) => {
    if (isExpanded) {
      setActiveSection(section)
    } else {
      // Closing the active accordion switches directly to the other accordion
      setActiveSection(section === 'analytics' ? 'share' : 'analytics')
    }
  }

  const isAnalyticsActive = activeSection === 'analytics'

  const analyticsSection = (
    <AnalyticsDashboardSection
      key='analytics'
      adminPassword={adminPassword}
      expanded={isAnalyticsActive}
      onToggle={handleToggle('analytics')}
    />
  )

  const shareSection = (
    <FormatShareProjectsSection
      key='share'
      projects={activeSnapshot?.projects || []}
      siteArtist={activeSnapshot?.artist?.name || 'Polybit'}
      siteUrl={activeSnapshot?.siteUrl || 'https://polybitmusic.com'}
      expanded={!isAnalyticsActive}
      onToggle={handleToggle('share')}
    />
  )

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        gap: 2,
      }}
    >
      {/* Operator Alert */}
      {isArtistNameEmpty && (
        <Alert
          severity='warning'
          icon={<WarningAmberRoundedIcon />}
          sx={{ borderRadius: 2.5, flexShrink: 0 }}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Site Operator Alert</AlertTitle>
          Artist name is currently empty. Update <code>data/config.json</code> with the artist name.
        </Alert>
      )}

      {/* Always render closed accordion on top, open accordion below */}
      {isAnalyticsActive ? (
        <>
          {shareSection}
          {analyticsSection}
        </>
      ) : (
        <>
          {analyticsSection}
          {shareSection}
        </>
      )}
    </Box>
  )
}
