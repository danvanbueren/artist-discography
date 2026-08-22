'use client'

import { Stack, Alert, AlertTitle } from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import RawJsonInspectorTab from '../raw/RawJsonInspectorTab'

export default function SystemOverviewTab({
  isArtistNameEmpty = false,
  currentJsonSnapshot = {},
  jsonData,
  dataState,
}) {
  const activeSnapshot = currentJsonSnapshot || dataState || jsonData || {}

  return (
    <Stack spacing={3}>
      {/* Operator Alert */}
      {isArtistNameEmpty && (
        <Alert severity='warning' icon={<WarningAmberRoundedIcon />} sx={{ borderRadius: 2.5 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Site Operator Alert</AlertTitle>
          Artist name is currently empty. Update <code>data/config.json</code> with the artist name.
        </Alert>
      )}

      {/* Raw Configuration & Data Files Inspector */}
      <RawJsonInspectorTab dataState={activeSnapshot} />
    </Stack>
  )
}
