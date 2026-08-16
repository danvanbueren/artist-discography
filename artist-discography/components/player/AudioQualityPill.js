'use client'

import { Box, useTheme } from '@mui/material'

/**
 * Reusable audio quality pill badge.
 * Displays audio bitrate or format label with hover animations and optional click handler.
 */
export default function AudioQualityPill({
  label,
  onClick,
  size = 'medium',
  sx = {},
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const sizeStyles = {
    small: {
      px: 0.5,
      py: 0.08,
      fontSize: '0.575rem',
      letterSpacing: '0.04em',
      mt: 0.1,
    },
    medium: {
      px: 0.65,
      py: 0.1,
      fontSize: '0.625rem',
      letterSpacing: '0.04em',
      mt: 0.15,
    },
    large: {
      px: 0.75,
      py: 0.12,
      fontSize: '0.625rem',
      letterSpacing: '0.05em',
      lineHeight: 1.2,
      mt: 0,
    },
  }

  const activeSize = sizeStyles[size] || sizeStyles.medium

  return (
    <Box
      component="span"
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation()
          onClick(e)
        }
      }}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 9999,
        fontWeight: 700,
        textTransform: 'uppercase',
        lineHeight: 1.1,
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        color: 'text.secondary',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
        width: 'fit-content',
        userSelect: 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        '&:hover': onClick
          ? {
              transform: 'scale(1.04)',
              borderColor: 'primary.main',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
            }
          : {},
        ...activeSize,
        ...sx,
      }}
    >
      {label}
    </Box>
  )
}
