'use client'

import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'

export default function DevQuickActionsCard({
  isGeneratingDummy = false,
  handleGenerateDummyData,
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor: 'rgba(26, 26, 36, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2.5,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Quick Developer Controls
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
          Seed sample data for testing responsive views or access administrative controls
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={isGeneratingDummy ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={handleGenerateDummyData}
            disabled={isGeneratingDummy}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {isGeneratingDummy ? 'Generating Data...' : 'Randomize Dummy Data'}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AdminPanelSettingsIcon />}
            href="/sys/admin"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Open Admin Portal
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
