'use client'

import {
  Box,
  IconButton,
  Drawer,
  Typography,
  Alert,
  AlertTitle,
  Stack,
  Divider,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export default function DevHealthDrawer({ health, open, onClose }) {
  const issues = health?.issues ?? []

  if (!health) {
    return null
  }

  return (
    <Drawer
      anchor="right"
      open={Boolean(open)}
      onClose={onClose}
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
          <IconButton onClick={onClose} size="small" aria-label="Close Health Report">
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
  )
}
