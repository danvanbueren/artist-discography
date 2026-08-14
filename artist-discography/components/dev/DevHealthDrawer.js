'use client'

import { useState } from 'react'
import {
  Box,
  Badge,
  IconButton,
  Drawer,
  Typography,
  Alert,
  AlertTitle,
  Stack,
  Divider,
} from '@mui/material'
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export default function DevHealthDrawer({ health }) {
  const [open, setOpen] = useState(false)
  const issues = health?.issues ?? []

  if (!health || (issues.length === 0 && health.isHealthy)) {
    return null
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
        }}
      >
        <IconButton
          color="warning"
          onClick={() => setOpen(true)}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid',
            borderColor: 'warning.main',
            p: 1.25,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Badge badgeContent={issues.length} color="error">
            <BugReportRoundedIcon />
          </Badge>
        </IconButton>
      </Box>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 400 },
              p: 3,
              bgcolor: 'background.paper',
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              Dev Data Health Report
            </Typography>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <Divider />

          <Alert severity={health.isHealthy ? 'success' : 'info'} icon={<InfoOutlinedIcon />}>
            <AlertTitle>JSON File Status</AlertTitle>
            {health.createdNewFile
              ? 'New scaffold created at data/artist-data.json'
              : health.isHealthy
              ? 'Data file is completely healthy.'
              : 'Structural adjustments detected.'}
          </Alert>

          {issues.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Issues / Repairs Log ({issues.length}):
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {issues.map((issue, idx) => (
                  <Typography key={idx} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {issue}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </Stack>
      </Drawer>
    </>
  )
}
