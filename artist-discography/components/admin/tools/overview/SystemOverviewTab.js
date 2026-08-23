'use client'

import { useState } from 'react'
import { Box, Alert, AlertTitle } from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import RawJsonInspectorTab from '../raw/RawJsonInspectorTab'
import { AnalyticsDashboardSection } from '../analytics/AnalyticsDashboardSection'

export default function SystemOverviewTab({
  isArtistNameEmpty = false,
  currentJsonSnapshot = {},
  jsonData,
  dataState,
  adminPassword = '',
}) {
  const activeSnapshot = currentJsonSnapshot || dataState || jsonData || {}
  const [activeSection, setActiveSection] = useState('analytics') // 'analytics' | 'raw'

  const handleToggle = (section) => (_, isExpanded) => {
    if (isExpanded) {
      setActiveSection(section)
    } else {
      // Closing the active accordion switches directly to the other accordion
      setActiveSection(section === 'analytics' ? 'raw' : 'analytics')
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

  const rawJsonSection = (
    <RawJsonInspectorTab
      key='raw'
      dataState={activeSnapshot}
      expanded={!isAnalyticsActive}
      onToggle={handleToggle('raw')}
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
          {rawJsonSection}
          {analyticsSection}
        </>
      ) : (
        <>
          {analyticsSection}
          {rawJsonSection}
        </>
      )}
    </Box>
  )
}

