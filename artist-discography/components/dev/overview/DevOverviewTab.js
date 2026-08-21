'use client'

import { Stack, Alert, AlertTitle, Box } from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import DevMetricsCards from './DevMetricsCards'
import DevQuickActionsCard from './DevQuickActionsCard'

export default function DevOverviewTab({
  isArtistNameEmpty = false,
  health = {},
  projects = [],
  totalTracksCount = 0,
  coverCoveragePct = 0,
  audioCoveragePct = 0,
  totalPlatformLinksCount = 0,
  adminAccess = false,
  isGeneratingDummy = false,
  handleGenerateDummyData,
}) {
  return (
    <Stack spacing={3}>
      {/* Operator Alert */}
      {isArtistNameEmpty && (
        <Alert severity='warning' icon={<WarningAmberRoundedIcon />} sx={{ borderRadius: 2.5 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Site Operator Alert</AlertTitle>
          Artist name is currently empty. Update <code>data/config.json</code> with the artist name.
        </Alert>
      )}

      {/* Data Health Log */}
      {health?.issues?.length > 0 && (
        <Alert severity='info' icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2.5 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>
            Data File Health Log ({health.issues.length} notes)
          </AlertTitle>
          <Box component='ul' sx={{ m: 0, pl: 2 }}>
            {health.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </Box>
        </Alert>
      )}

      {/* High-level metrics row */}
      <DevMetricsCards
        projects={projects}
        totalTracksCount={totalTracksCount}
        coverCoveragePct={coverCoveragePct}
        audioCoveragePct={audioCoveragePct}
        totalPlatformLinksCount={totalPlatformLinksCount}
        adminAccess={adminAccess}
      />

      {/* Quick developer controls */}
      <DevQuickActionsCard
        isGeneratingDummy={isGeneratingDummy}
        handleGenerateDummyData={handleGenerateDummyData}
      />
    </Stack>
  )
}
