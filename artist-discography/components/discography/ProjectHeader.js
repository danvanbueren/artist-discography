'use client'

import { useState } from 'react'
import { Box, Stack, Typography, Chip, Tooltip, useTheme } from '@mui/material'
import AlbumRoundedIcon from '@mui/icons-material/AlbumRounded'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import ProgressiveImage from '@/components/ui/ProgressiveImage'
import SubduedText from '@/components/ui/SubduedText'
import { useDynamicThemeGradients } from '@/lib/hooks/useDynamicThemeGradients'
import { formatProjectDate } from '@/lib/data/dateUtils'
import { useTouchDevice } from '@/lib/hooks/useTouchDevice'
import PlatformButtonsRow from './header/PlatformButtonsRow'
import ProjectArtLightboxModal from './header/ProjectArtLightboxModal'

/**
 * ProjectHeader
 * Top metadata hero component for each project, displaying square artwork thumbnail,
 * release type badge, project name, artist, release date, and external streaming link buttons.
 */
export default function ProjectHeader({
  project,
  artistName,
  onSelectProject,
  selectedPlatform,
  isSingleView = false,
  isPrivateAuthenticated = false,
}) {
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const isTouch = useTouchDevice()
  const [artModalOpen, setArtModalOpen] = useState(false)

  const name = project?.name ?? ''
  const pArtist = project?.artist || artistName || ''
  const type = project?.type ?? ''
  const date = formatProjectDate(project?.date ?? '')
  const cover = project?.cover ?? project?.image ?? ''
  const { primaryTextSx, secondaryTextSx } = useDynamicThemeGradients(cover, isDarkMode)
  const links = project?.links ?? {}

  const handleHeaderClick = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) {
      return
    }
    if (onSelectProject) {
      onSelectProject(project)
    }
  }

  const canOpenModal = Boolean(cover && (isSingleView || !isTouch))

  const handleCoverClick = (e) => {
    if (!isSingleView && isTouch) {
      if (onSelectProject) {
        onSelectProject(project)
      }
      return
    }
    if (cover) {
      e.stopPropagation()
      setArtModalOpen(true)
    }
  }

  return (
    <>
      <Box
        onClick={handleHeaderClick}
        sx={{
          p: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          gap: { xs: 2.5, sm: 3 },
          cursor: onSelectProject ? 'pointer' : 'default',
          borderRadius: 3,
          transition: 'background-color 0.25s ease',
          '&:hover': onSelectProject ? { bgcolor: 'action.hover' } : {},
        }}
      >
        {/* Left: Album Cover Art */}
        <Tooltip
          title={canOpenModal ? 'Click to view full album art' : ''}
          arrow
          disableHoverListener={!canOpenModal}
          disableTouchListener={!canOpenModal}
        >
          <Box
            onClick={handleCoverClick}
            sx={{
              position: 'relative',
              width: { xs: 200, sm: 130, md: 150 },
              height: { xs: 200, sm: 130, md: 150 },
              aspectRatio: '1 / 1',
              borderRadius: 3.5,
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
              bgcolor: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(60,60,80,0.8) 0%, rgba(30,30,45,0.9) 100%)',
              cursor: cover ? 'pointer' : 'default',
              transition: 'transform 0.22s ease, box-shadow 0.22s ease',
              '&:hover': cover
                ? {
                    transform: canOpenModal ? 'scale(1.04)' : undefined,
                    boxShadow: canOpenModal ? '0 12px 36px rgba(0,0,0,0.5)' : undefined,
                    '& .cover-zoom-icon': { opacity: 1 },
                  }
                : {},
            }}
          >
            {cover ? (
              <>
                <ProgressiveImage
                  src={cover}
                  alt={name || 'Project Cover'}
                  targetWidth={400}
                  placeholderWidth={40}
                  priority
                  sx={{ width: '100%', height: '100%' }}
                />
                {canOpenModal && (
                  <Box
                    className='cover-zoom-icon'
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <ZoomInRoundedIcon sx={{ color: 'common.white', fontSize: 32 }} />
                  </Box>
                )}
              </>
            ) : (
              <AlbumRoundedIcon
                sx={{
                  fontSize: { xs: 72, sm: 72 },
                  color: 'rgba(255,255,255,0.35)',
                }}
              />
            )}
          </Box>
        </Tooltip>

        {/* Right: Metadata Stack */}
        <Stack
          spacing={1}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            width: '100%',
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          {/* Type Badge & Unlocked Status */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: { xs: 'center', sm: 'flex-start' },
              width: '100%',
            }}
          >
            {type ? (
              <Chip
                label={type.toUpperCase()}
                size='small'
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                }}
              />
            ) : (
              <Chip
                label='PROJECT'
                size='small'
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  opacity: 0.6,
                  bgcolor: 'action.disabledBackground',
                  borderRadius: 1,
                }}
              />
            )}

            {isPrivateAuthenticated &&
              (project?.visibility === 'private' || project?.copyright === 'uncleared') && (
                <Chip
                  icon={<LockOpenRoundedIcon sx={{ fontSize: '13px !important' }} />}
                  label={project?.visibility === 'private' ? 'PRIVATE • UNLOCKED' : 'UNLOCKED'}
                  size='small'
                  color='success'
                  variant='outlined'
                  sx={{
                    height: 22,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    borderRadius: 1,
                  }}
                />
              )}
          </Box>

          {/* Project Title */}
          <SubduedText
            value={name}
            placeholder='Untitled Project'
            variant='h5'
            component='h2'
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.35rem', sm: '1.75rem' },
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: { xs: 'center', sm: 'left' },
              width: '100%',
              ...primaryTextSx,
            }}
          />

          {/* Artist Name & Release Date */}
          <Stack
            direction='row'
            spacing={1}
            sx={{
              alignItems: 'center',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            <SubduedText
              value={pArtist}
              placeholder='Artist'
              variant='subtitle1'
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                ...secondaryTextSx,
              }}
            />

            {pArtist && date && (
              <Typography variant='body2' sx={{ color: 'text.disabled', mx: 0.5 }}>
                •
              </Typography>
            )}

            <SubduedText
              value={date}
              placeholder='Release Date'
              variant='caption'
              sx={{ fontSize: '0.9rem', color: 'text.secondary' }}
            />
          </Stack>

          {/* Platform Streaming Icons */}
          <PlatformButtonsRow
            links={links}
            selectedPlatform={selectedPlatform}
            isDarkMode={isDarkMode}
          />
        </Stack>
      </Box>

      {/* Full View Album Art Lightbox Modal */}
      <ProjectArtLightboxModal
        open={artModalOpen}
        onClose={() => setArtModalOpen(false)}
        cover={cover}
        name={name}
      />
    </>
  )
}
