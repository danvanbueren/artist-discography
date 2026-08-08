'use client'

import { Box } from '@mui/material'

export default function HeaderLogo({ onClick }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pt: { xs: 3, sm: 4 },
        pb: { xs: 1, sm: 2 },
      }}
    >
      <Box
        component="img"
        src="/api/logo"
        alt="Artist Logo"
        onClick={onClick}
        sx={{
          maxHeight: { xs: 70, sm: 90, md: 110 },
          maxWidth: '85%',
          objectFit: 'contain',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.25s ease-in-out, filter 0.25s ease-in-out',
          filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.25))',
          '&:hover': onClick
            ? {
                transform: 'scale(1.03)',
                filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.35))',
              }
            : {},
        }}
      />
    </Box>
  )
}
