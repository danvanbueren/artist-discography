'use client'

import { useState } from 'react'
import { Stack, Alert, AlertTitle } from '@mui/material'
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
    // Only switch if being expanded, guaranteeing exactly one remains open at all times
    if (isExpanded) {
      setActiveSection(section)
    }
  }

  return (
    <Stack spacing={2.5}>
      {/* Operator Alert */}
      {isArtistNameEmpty && (
        <Alert severity='warning' icon={<WarningAmberRoundedIcon />} sx={{ borderRadius: 2.5 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Site Operator Alert</AlertTitle>
          Artist name is currently empty. Update <code>data/config.json</code> with the artist name.
        </Alert>
      )}

      {/* Catalog Analytics & Insights Section */}
      <AnalyticsDashboardSection
        adminPassword={adminPassword}
        expanded={activeSection === 'analytics'}
        onToggle={handleToggle('analytics')}
      />

      {/* Raw Configuration & Data Files Inspector */}
      <RawJsonInspectorTab
        dataState={activeSnapshot}
        expanded={activeSection === 'raw'}
        onToggle={handleToggle('raw')}
      />
    </Stack>
  )
}
