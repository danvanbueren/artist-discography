'use client'

import { Box, Button, Paper } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LinkIcon from '@mui/icons-material/Link'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded'
import HighQualityRoundedIcon from '@mui/icons-material/HighQualityRounded'
import DataSaverOnRoundedIcon from '@mui/icons-material/DataSaverOnRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import { SOCIAL_ICONS } from '@/components/discography/ArtistHero'
import { useDragScroll } from '@/lib/hooks/useDragScroll'

/**
 * Compact horizontal action pill bar (Home, Platform, Quality, Theme, Unlocked) in CompactArtistHeader.
 *
 * @param {Object} props
 * @param {Function} [props.onNavigateHome] - Home click handler
 * @param {boolean} [props.hasAvailablePlatforms=true] - Platform presence
 * @param {Function} [props.onOpenPlatformModal] - Platform modal trigger
 * @param {string} [props.selectedPlatform] - Active platform
 * @param {Function} [props.onOpenQualityModal] - Quality modal trigger
 * @param {boolean} [props.isStuttering=false] - Stutter alert indicator
 * @param {string} [props.audioQuality='320k'] - Quality tier
 * @param {boolean} props.darkMode - Active theme mode
 * @param {Function} [props.onToggleTheme] - Theme toggle handler
 * @param {Function} [props.onOpenPrivateAccessModal] - Private access modal trigger
 * @param {boolean} [props.isPrivateAuthenticated=false] - Private unlocked status
 */
export default function CompactHeaderActions({
  onNavigateHome,
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
}) {
  const {
    ref: headerDragRef,
    bind: headerDragBind,
    isDragging: isHeaderDragging,
    hasDraggedRef,
  } = useDragScroll()

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 4,
        p: { xs: 0.5, sm: 0.75 },
        backdropFilter: 'blur(16px)',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(18, 18, 26, 0.75)' : 'rgba(255, 255, 255, 0.75)',
        border: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.35)'
            : '0 8px 32px rgba(0,0,0,0.1)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        maxWidth: '100%',
        width: { xs: '100%', sm: 'fit-content' },
        mx: { xs: 0, sm: 'auto' },
      }}
    >
      <Box
        ref={headerDragRef}
        {...headerDragBind}
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          gap: { xs: 0.75, sm: 1.5 },
          overflowX: 'auto',
          minWidth: 0,
          maxWidth: '100%',
          width: '100%',
          justifyContent: { xs: 'flex-start', sm: 'center' },
          py: 0.5,
          px: 0.5,
          cursor: isHeaderDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {onNavigateHome && (
          <Button
            size='medium'
            variant='text'
            onClick={() => {
              if (hasDraggedRef.current) return
              onNavigateHome()
            }}
            startIcon={<HomeRoundedIcon />}
            sx={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.85rem', sm: '0.92rem' },
              borderRadius: 3,
              px: { xs: 1.25, sm: 2 },
              py: 0.85,
              minWidth: 0,
              color: 'text.primary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Home
          </Button>
        )}

        <Button
          size='medium'
          variant='text'
          disabled={!hasAvailablePlatforms}
          onClick={() => {
            if (hasDraggedRef.current) return
            if (onOpenPlatformModal) onOpenPlatformModal()
          }}
          startIcon={
            selectedPlatform && SOCIAL_ICONS[selectedPlatform] ? (
              <Box
                component='img'
                src={SOCIAL_ICONS[selectedPlatform]}
                alt={selectedPlatform || 'Platform'}
                draggable={false}
                sx={{
                  width: 18,
                  height: 18,
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
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.85rem', sm: '0.92rem' },
            borderRadius: 3,
            px: { xs: 1.25, sm: 2 },
            py: 0.85,
            minWidth: 0,
            color: 'text.primary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          Platform
        </Button>

        <Button
          size='medium'
          variant='text'
          onClick={() => {
            if (hasDraggedRef.current) return
            if (onOpenQualityModal) onOpenQualityModal()
          }}
          startIcon={
            isStuttering ? (
              <Box
                component='span'
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706'),
                  color: (theme) => (theme.palette.mode === 'dark' ? '#1a1400' : '#ffffff'),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <PriorityHighRoundedIcon sx={{ fontSize: 12, color: 'inherit' }} />
              </Box>
            ) : audioQuality === 'lossless' ? (
              <GraphicEqRoundedIcon />
            ) : audioQuality === '128k' ? (
              <DataSaverOnRoundedIcon />
            ) : (
              <HighQualityRoundedIcon />
            )
          }
          sx={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
            textTransform: 'none',
            fontWeight: isStuttering ? 700 : 600,
            fontSize: { xs: '0.85rem', sm: '0.92rem' },
            borderRadius: 3,
            px: { xs: 1.25, sm: 2 },
            py: 0.85,
            minWidth: 0,
            color: isStuttering
              ? (theme) => (theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706')
              : 'text.primary',
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
            '&:hover': {
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

        <Button
          size='medium'
          variant='text'
          onClick={() => {
            if (hasDraggedRef.current) return
            if (onToggleTheme) onToggleTheme()
          }}
          startIcon={darkMode ? <DarkModeIcon /> : <LightModeIcon />}
          sx={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.85rem', sm: '0.92rem' },
            borderRadius: 3,
            px: { xs: 1.25, sm: 2 },
            py: 0.85,
            minWidth: 0,
            color: 'text.primary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          Theme
        </Button>

        <Button
          size='medium'
          variant='text'
          onClick={() => {
            if (hasDraggedRef.current) return
            if (onOpenPrivateAccessModal) onOpenPrivateAccessModal()
          }}
          startIcon={isPrivateAuthenticated ? <LockOpenRoundedIcon /> : <LockRoundedIcon />}
          sx={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.85rem', sm: '0.92rem' },
            borderRadius: 3,
            px: { xs: 1.25, sm: 2 },
            py: 0.85,
            minWidth: 0,
            color: isPrivateAuthenticated ? 'success.main' : 'text.primary',
            '&:hover': {
              bgcolor: isPrivateAuthenticated
                ? (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(102, 187, 106, 0.12)'
                      : 'rgba(46, 125, 50, 0.08)'
                : 'action.hover',
            },
          }}
        >
          {isPrivateAuthenticated ? 'Unlocked' : 'Locked'}
        </Button>
      </Box>
    </Paper>
  )
}
