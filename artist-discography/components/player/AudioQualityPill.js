'use client'

import { Box, useTheme } from '@mui/material'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'

/**
 * Reusable audio quality pill badge.
 * Displays audio bitrate or format label with hover animations and optional click handler.
 */
export default function AudioQualityPill({
  label,
  onClick,
  size = 'medium',
  isStuttering = false,
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
  const alertDotSize = size === 'large' ? 12 : size === 'small' ? 9 : 10
  const alertDotFontSize = size === 'large' ? '0.55rem' : size === 'small' ? '0.425rem' : '0.475rem'

  return (
    <Box
      component="span"
      title={isStuttering ? 'Playback is struggling. Click to adjust audio quality.' : undefined}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation()
          onClick(e)
        }
      }}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.45,
        borderRadius: 9999,
        fontWeight: 700,
        textTransform: 'uppercase',
        lineHeight: 1.1,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        bgcolor: isStuttering
          ? isDark
            ? 'rgba(245, 158, 11, 0.18)'
            : 'rgba(245, 158, 11, 0.14)'
          : isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
        color: isStuttering
          ? isDark
            ? '#fbbf24'
            : '#d97706'
          : 'text.secondary',
        border: '1px solid',
        borderColor: isStuttering
          ? isDark
            ? 'rgba(245, 158, 11, 0.6)'
            : 'rgba(217, 119, 6, 0.55)'
          : isDark
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.1)',
        boxShadow: isStuttering
          ? isDark
            ? '0 0 10px rgba(245, 158, 11, 0.35)'
            : '0 0 8px rgba(217, 119, 6, 0.25)'
          : 'none',
        width: 'fit-content',
        userSelect: 'none',
        cursor: onClick ? 'pointer' : 'inherit',
        transformOrigin: 'left center',
        boxSizing: 'border-box',
        my: 0.1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick
          ? {
              transform: 'scale(1.04)',
              borderColor: isStuttering
                ? isDark
                  ? '#fbbf24'
                  : '#d97706'
                : 'primary.main',
              bgcolor: isStuttering
                ? isDark
                  ? 'rgba(245, 158, 11, 0.28)'
                  : 'rgba(245, 158, 11, 0.22)'
                : isDark
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(0, 0, 0, 0.1)',
            }
          : {},
        ...activeSize,
        ...sx,
      }}
    >
      {isStuttering && (
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: alertDotSize,
            height: alertDotSize,
            borderRadius: '50%',
            bgcolor: isDark ? '#fbbf24' : '#d97706',
            color: isDark ? '#1a1400' : '#ffffff',
            flexShrink: 0,
            animation: 'pulseStutterDot 2s ease-in-out infinite',
            '@keyframes pulseStutterDot': {
              '0%': { transform: 'scale(1)', opacity: 0.9 },
              '50%': { transform: 'scale(1.15)', opacity: 1 },
              '100%': { transform: 'scale(1)', opacity: 0.9 },
            },
          }}
        >
          <PriorityHighRoundedIcon sx={{ fontSize: alertDotFontSize, color: 'inherit' }} />
        </Box>
      )}
      {label}
    </Box>
  )
}
