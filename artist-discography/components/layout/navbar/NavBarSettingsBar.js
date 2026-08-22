'use client'

import { Box, Button } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LinkIcon from '@mui/icons-material/Link'
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded'
import HighQualityRoundedIcon from '@mui/icons-material/HighQualityRounded'
import DataSaverOnRoundedIcon from '@mui/icons-material/DataSaverOnRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import { SOCIAL_ICONS } from '@/components/discography/ArtistHero'

/**
 * Settings mode toolbar for Theme, Platform, Audio Quality, and Private Access.
 *
 * @param {Object} props
 * @param {boolean} props.hasAvailablePlatforms - Platform presence
 * @param {Function} props.onOpenPlatformModal - Trigger platform modal
 * @param {string} props.selectedPlatform - Active platform
 * @param {Function} [props.onOpenQualityModal] - Trigger quality modal
 * @param {boolean} props.isStuttering - Stutter indicator
 * @param {string} props.audioQuality - Current quality tier
 * @param {boolean} props.darkMode - Theme mode
 * @param {Function} props.onToggleTheme - Theme toggle handler
 * @param {Function} [props.onOpenPrivateAccessModal] - Trigger private access modal
 * @param {boolean} props.isPrivateAuthenticated - Whether unlocked
 * @param {Object} props.settingsDrag - useDragScroll object
 */
export default function NavBarSettingsBar({
  hasAvailablePlatforms = true,
  onOpenPlatformModal,
  selectedPlatform,
  onOpenQualityModal,
  isStuttering = false,
  audioQuality = '320k',
  darkMode,
  onToggleTheme,
  onOpenPrivateAccessModal,
  isPrivateAuthenticated = false,
  settingsDrag,
}) {
  return (
    <Box
      ref={settingsDrag.ref}
      {...settingsDrag.bind}
      sx={{
        display: 'flex',
        gap: 1.5,
        overflowX: 'auto',
        py: 0.5,
        px: 0.5,
        minWidth: 0,
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        cursor: settingsDrag.isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {/* Platform Selector */}
      <Button
        size='medium'
        variant='outlined'
        disabled={!hasAvailablePlatforms}
        onClick={() => {
          if (settingsDrag.hasDraggedRef.current) return
          onOpenPlatformModal()
        }}
        startIcon={
          selectedPlatform && SOCIAL_ICONS[selectedPlatform] ? (
            <Box
              component='img'
              src={SOCIAL_ICONS[selectedPlatform]}
              alt={selectedPlatform || 'Platform'}
              draggable={false}
              sx={{
                width: 20,
                height: 20,
                objectFit: 'contain',
                borderRadius: 0.5,
              }}
            />
          ) : (
            <LinkIcon />
          )
        }
        sx={{
          flexShrink: 0,
          whiteSpace: 'nowrap',
          borderRadius: 3,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          py: 1,
          px: 2,
          color: 'text.primary',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'text.primary',
            bgcolor: 'action.hover',
          },
        }}
      >
        Platform
      </Button>

      {/* Audio Quality */}
      <Button
        size='medium'
        variant='outlined'
        onClick={() => {
          if (settingsDrag.hasDraggedRef.current) return
          if (onOpenQualityModal) onOpenQualityModal()
        }}
        startIcon={
          isStuttering ? (
            <Box
              component='span'
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706'),
                color: (theme) => (theme.palette.mode === 'dark' ? '#1a1400' : '#ffffff'),
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PriorityHighRoundedIcon sx={{ fontSize: 11, color: 'inherit' }} />
            </Box>
          ) : audioQuality === 'lossless' ? (
            <GraphicEqRoundedIcon fontSize='small' />
          ) : audioQuality === '128k' ? (
            <DataSaverOnRoundedIcon fontSize='small' />
          ) : (
            <HighQualityRoundedIcon fontSize='small' />
          )
        }
        sx={{
          flexShrink: 0,
          whiteSpace: 'nowrap',
          borderRadius: 3,
          textTransform: 'none',
          fontWeight: isStuttering ? 700 : 600,
          fontSize: '0.9rem',
          py: 1,
          px: 2,
          color: isStuttering
            ? (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706')
            : 'text.primary',
          borderColor: isStuttering
            ? (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(245, 158, 11, 0.6)'
                  : 'rgba(217, 119, 6, 0.55)'
            : 'divider',
          bgcolor: isStuttering
            ? (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(245, 158, 11, 0.14)'
                  : 'rgba(245, 158, 11, 0.1)'
            : 'transparent',
          boxShadow: isStuttering
            ? (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 0 8px rgba(245, 158, 11, 0.3)'
                  : '0 0 6px rgba(217, 119, 6, 0.2)'
            : 'none',
          transition: 'all 0.25s ease',
          '&:hover': {
            borderColor: isStuttering
              ? (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706')
              : 'text.primary',
            bgcolor: isStuttering
              ? (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(245, 158, 11, 0.24)'
                    : 'rgba(245, 158, 11, 0.18)'
              : 'action.hover',
          },
        }}
      >
        Quality
      </Button>

      {/* Theme Toggle */}
      <Button
        size='medium'
        variant='outlined'
        onClick={() => {
          if (settingsDrag.hasDraggedRef.current) return
          onToggleTheme()
        }}
        startIcon={
          darkMode ? <DarkModeIcon fontSize='small' /> : <LightModeIcon fontSize='small' />
        }
        sx={{
          flexShrink: 0,
          whiteSpace: 'nowrap',
          borderRadius: 3,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          py: 1,
          px: 2,
          color: 'text.primary',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'text.primary',
            bgcolor: 'action.hover',
          },
        }}
      >
        Theme
      </Button>

      {/* Private Gated Access */}
      <Button
        size='medium'
        variant='outlined'
        onClick={() => {
          if (settingsDrag.hasDraggedRef.current) return
          if (onOpenPrivateAccessModal) onOpenPrivateAccessModal()
        }}
        startIcon={
          isPrivateAuthenticated ? (
            <LockOpenRoundedIcon fontSize='small' />
          ) : (
            <LockRoundedIcon fontSize='small' />
          )
        }
        sx={{
          flexShrink: 0,
          whiteSpace: 'nowrap',
          borderRadius: 3,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          py: 1,
          px: 2,
          color: isPrivateAuthenticated ? 'success.main' : 'text.primary',
          borderColor: isPrivateAuthenticated ? 'success.main' : 'divider',
          '&:hover': {
            borderColor: isPrivateAuthenticated ? 'success.main' : 'text.primary',
            bgcolor: 'action.hover',
          },
        }}
      >
        {isPrivateAuthenticated ? 'Unlocked' : 'Locked'}
      </Button>
    </Box>
  )
}
