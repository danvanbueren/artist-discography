'use client'

import { Box, Stack } from '@mui/material'
import { slugify } from '@/lib/data/slugs'
import SubduedText from '@/components/ui/SubduedText'
import ProjectCard from '../ProjectCard'

/**
 * AllProjectsGridView
 * Grid/List layout for all catalog projects with search and filter state matching.
 *
 * @param {Object} props
 * @param {Array} props.filteredProjects - Array of projects matching active filter/search
 * @param {Object} props.artist - Artist configuration object
 * @param {Function} props.onSelectProject - Project selection handler
 * @param {Function} props.onPlayTrack - Play track handler
 * @param {Function} props.onAddToQueue - Add track to queue handler
 * @param {Function} props.onShowToast - Toast message trigger
 * @param {Object|null} props.playingTrack - Currently playing track
 * @param {boolean} props.isPlaying - Playback status
 * @param {string|null} props.highlightedTrackSlug - Selected track slug
 * @param {Function} props.onSelectTrackTitle - Track title navigation handler
 * @param {string} props.selectedPlatform - Preferred music platform ID
 * @param {boolean} props.isPrivateAuthenticated - Whether private code is validated
 */
export default function AllProjectsGridView({
  filteredProjects = [],
  artist = {},
  onSelectProject,
  onPlayTrack,
  onAddToQueue,
  onShowToast,
  playingTrack,
  isPlaying,
  highlightedTrackSlug,
  onSelectTrackTitle,
  selectedPlatform,
  isPrivateAuthenticated,
}) {
  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={4}>
        {filteredProjects.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <SubduedText
              value=''
              placeholder='No projects match your selected filter or search query.'
              variant='h6'
            />
          </Box>
        ) : (
          filteredProjects.map((proj, idx) => {
            const pSlug = slugify(proj.name || '')
            return (
              <Box
                key={proj.id || pSlug || idx}
                id={`project-${pSlug}`}
                sx={{ scrollMarginTop: { xs: 80, sm: 100 } }}
              >
                <ProjectCard
                  project={proj}
                  artistName={artist?.name || 'Artist'}
                  onSelectProject={onSelectProject}
                  isSingleView={false}
                  onPlayTrack={onPlayTrack}
                  onAddToQueue={onAddToQueue}
                  onShowToast={onShowToast}
                  playingTrack={playingTrack}
                  isPlaying={isPlaying}
                  highlightedTrackSlug={highlightedTrackSlug}
                  onSelectTrackRow={null}
                  onSelectTrackTitle={(track) => onSelectTrackTitle(track, proj)}
                  selectedPlatform={selectedPlatform}
                  isPrivateAuthenticated={isPrivateAuthenticated}
                />
              </Box>
            )
          })
        )}
      </Stack>
    </Box>
  )
}
