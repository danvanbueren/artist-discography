'use client'

import { memo } from 'react'
import { Accordion, AccordionSummary, AccordionDetails, Typography, Grid } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LinkIcon from '@mui/icons-material/Link'
import { PLATFORM_KEYS } from '../adminConstants'
import { SOCIAL_ICONS } from '@/components/discography/ArtistHero'
import { TrackStreamingPlatformInput } from './TrackStreamingPlatformInput'

/**
 * Accordion container for editing all streaming platform links for a track.
 */
export const TrackLinksGrid = memo(function TrackLinksGrid({
  index,
  track,
  defaultArtist,
  projectName = '',
  currentProjectIndex = -1,
  isPending = false,
  currentTracks = [],
  allProjects = [],
  onUpdateLink,
  isDirty = () => false,
  isSaved = () => false,
}) {
  const links = track.links || {}
  const configuredCount = PLATFORM_KEYS.filter((p) => Boolean(links[p.key]?.trim())).length

  return (
    <Accordion
      defaultExpanded
      variant='outlined'
      sx={{
        mt: 1.5,
        borderRadius: 2,
        '&:before': { display: 'none' },
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <LinkIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
        <Typography variant='body2' sx={{ fontWeight: 600 }}>
          Streaming Platform Links {configuredCount > 0 && `(${configuredCount})`}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 2 }}>
        <Grid container spacing={1.5}>
          {PLATFORM_KEYS.map(({ key, label }) => (
            <TrackStreamingPlatformInput
              key={key}
              platformKey={key}
              label={label}
              iconSrc={SOCIAL_ICONS[key]}
              index={index}
              linkVal={links[key] || ''}
              isDirty={isDirty(key)}
              isSaved={isSaved(key)}
              trackArtist={track.artist}
              trackName={track.name}
              defaultArtist={defaultArtist}
              projectName={projectName}
              currentProjectIndex={currentProjectIndex}
              isPending={isPending}
              currentTracks={currentTracks}
              currentTrackLinks={links}
              allProjects={allProjects}
              onUpdateLink={onUpdateLink}
            />
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
})
