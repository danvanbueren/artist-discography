'use client'

import {
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AlbumIcon from '@mui/icons-material/Album'
import SyncIcon from '@mui/icons-material/Sync'

export default function ProjectSidebarList({
  projectsList = [],
  selectedProjIndex,
  isCreatingNew,
  dirtyFields,
  handleStartCreateNewProject,
  handleSelectProject,
  name,
  type,
  tracks = [],
  coverPreview,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(28, 28, 38, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        height: { md: '100%' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Button
        variant={isCreatingNew ? 'contained' : 'outlined'}
        color="secondary"
        size="large"
        fullWidth
        startIcon={<AddIcon />}
        onClick={handleStartCreateNewProject}
        sx={{
          mb: 2.5,
          py: 1.2,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.95rem',
          flexShrink: 0,
        }}
      >
        Add New Project
      </Button>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          px: 0.5,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: 'text.secondary' }}
        >
          Existing Releases ({projectsList.length})
        </Typography>
        {dirtyFields?.size > 0 && !isCreatingNew && (
          <Typography
            variant="caption"
            sx={{
              color: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 600,
            }}
          >
            <SyncIcon
              sx={{
                fontSize: 13,
                animation: 'spin 1s infinite linear',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(-360deg)' },
                },
              }}
            />
            {' '}
            Saving…
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          pr: 0.5,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.45) transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255, 255, 255, 0.45)',
            borderRadius: 3,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.75)' },
          },
        }}
      >
        <List sx={{ p: 0 }}>
          {isCreatingNew && (
            <ListItemButton
              selected={true}
              sx={{
                borderRadius: 2,
                mb: 1,
                border: '1px dashed',
                borderColor: 'secondary.main',
                backgroundColor: 'rgba(206, 147, 216, 0.12)',
                py: 1.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 44, mr: 1, alignSelf: 'center' }}>
                {coverPreview ? (
                  <Box
                    component="img"
                    src={coverPreview}
                    alt="Cover preview"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      objectFit: 'cover',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  />
                ) : (
                  <AlbumIcon color="secondary" />
                )}
              </ListItemIcon>
              <ListItemText
                slotProps={{
                  primary: { component: 'div' },
                  secondary: { component: 'div' },
                }}
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 700, color: 'secondary.main' }}
                    >
                      {name.trim() || 'New Project'}
                    </Typography>
                    <Chip
                      label="Draft"
                      color="secondary"
                      size="small"
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                    />
                  </Box>
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}
                  >
                    {type || 'Single'} • {tracks.length} track{tracks.length === 1 ? '' : 's'}
                  </Typography>
                }
              />
            </ListItemButton>
          )}

          {projectsList.map((p, idx) => {
            const hasCover = Boolean(p.cover || p.hasCover)
            const trks = p.tracks ?? []
            const audioCount = trks.filter((t) => Boolean(t.audioUrl || t.hasAudio || t.audio)).length
            const hasAllAudio = trks.length > 0 && audioCount === trks.length
            const linkCount = trks.reduce(
              (acc, t) => acc + Object.values(t.links ?? {}).filter((l) => l && typeof l === 'string' && l.trim() !== '').length,
              0
            )
            const hasLinks = linkCount > 0
            const isComplete = hasCover && hasAllAudio && hasLinks
            const isSelected = !isCreatingNew && selectedProjIndex === idx

            return (
              <ListItemButton
                key={idx}
                selected={isSelected}
                onClick={() => handleSelectProject(idx)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'rgba(255,255,255,0.08)',
                  backgroundColor: isSelected ? 'rgba(144, 202, 249, 0.08)' : 'transparent',
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 44, mr: 1, alignSelf: 'center' }}>
                  {p.cover ? (
                    <Box
                      component="img"
                      src={p.cover}
                      alt={p.name || 'Cover'}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        objectFit: 'cover',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    />
                  ) : (
                    <AlbumIcon color={isSelected ? 'primary' : 'action'} />
                  )}
                </ListItemIcon>
                <ListItemText
                  slotProps={{
                    primary: { component: 'div' },
                    secondary: { component: 'div' },
                  }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: isSelected ? 700 : 500 }}
                      >
                        {p.name || 'Untitled Project'}
                      </Typography>
                      {isComplete ? (
                        <Chip
                          label="Complete"
                          color="success"
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      ) : (
                        <Chip
                          label="Incomplete"
                          color="warning"
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {p.type || 'Single'} • {trks.length} track{trks.length === 1 ? '' : 's'}
                      </Typography>
                      {!isComplete && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {!hasCover && (
                            <Chip
                              label="No Art"
                              color="error"
                              variant="outlined"
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                          {!hasAllAudio && (
                            <Chip
                              label={audioCount === 0 ? 'No Audio' : `${audioCount}/${trks.length} Audio`}
                              color="warning"
                              variant="outlined"
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                          {!hasLinks && (
                            <Chip
                              label="No Links"
                              color="info"
                              variant="outlined"
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            )
          })}
        </List>
      </Box>
    </Paper>
  )
}
