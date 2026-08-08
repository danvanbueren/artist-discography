'use client'

import { useState, useEffect } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export default function DevArtistDiscographyView({ data, health }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const artistName = data?.artist?.name ?? ''
  const artistBio = data?.artist?.bio ?? ''
  const isArtistNameEmpty = !artistName || artistName.trim() === ''
  const platforms = data?.artist?.links?.platforms ?? {}
  const socials = data?.artist?.links?.socials ?? {}
  const projects = data?.projects ?? []

  return (
    <Container
      maxWidth="md"
      sx={{
        py: 5,
      }}
    >
      <Stack
        spacing={3}
      >
        {isArtistNameEmpty && (
          <Alert
            severity="warning"
            icon={<WarningAmberRoundedIcon />}
            sx={{
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            <AlertTitle>
              Site Operator Alert
            </AlertTitle>
            Artist name is currently empty. Please update <strong>data/artist-data.json</strong> with the artist name and details.
          </Alert>
        )}

        {health?.issues?.length > 0 && (
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon />}
            sx={{
              borderRadius: 2,
            }}
          >
            <AlertTitle>
              Data File Health Report
            </AlertTitle>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2,
              }}
            >
              {health.issues.map((issue, idx) => (
                <li key={idx}>
                  {issue}
                </li>
              ))}
            </Box>
          </Alert>
        )}

        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(30,30,40,0.9) 0%, rgba(20,20,28,0.95) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                color: isArtistNameEmpty ? 'text.secondary' : 'text.primary',
                fontStyle: isArtistNameEmpty ? 'italic' : 'normal',
              }}
            >
              {isArtistNameEmpty ? 'Artist Name (Not Set)' : artistName}
            </Typography>

            <Chip
              icon={mounted && health?.isHealthy ? <CheckCircleOutlineRoundedIcon /> : undefined}
              label={health?.isHealthy ? 'JSON Status: Healthy' : 'JSON Status: Health Issues Found'}
              color={health?.isHealthy ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>

          <Typography
            variant="body1"
            sx={{
              color: artistBio ? 'text.primary' : 'text.secondary',
              fontStyle: artistBio ? 'normal' : 'italic',
              mb: 3,
              whiteSpace: 'pre-line',
            }}
          >
            {artistBio || 'No artist bio provided yet. Add artist bio in data/artist-data.json.'}
          </Typography>

          <Divider
            sx={{
              my: 3,
            }}
          />

          <Typography
            variant="h6"
            sx={{
              mb: 1.5,
              fontWeight: 600,
            }}
          >
            Platforms & Stores
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mb: 3,
            }}
          >
            {Object.entries(platforms).map(([platformKey, url]) => {
              const hasUrl = Boolean(url && typeof url === 'string' && url.trim() !== '')
              return (
                <Chip
                  key={platformKey}
                  label={`${platformKey}${hasUrl ? '' : ' (no link)'}`}
                  component={hasUrl ? 'a' : 'div'}
                  href={hasUrl ? url : undefined}
                  target={hasUrl ? '_blank' : undefined}
                  rel={hasUrl ? 'noopener noreferrer' : undefined}
                  clickable={hasUrl}
                  color={hasUrl ? 'primary' : 'default'}
                  variant={hasUrl ? 'filled' : 'outlined'}
                  icon={hasUrl && mounted ? <LaunchRoundedIcon fontSize="small" /> : undefined}
                />
              )
            })}
          </Box>

          <Typography
            variant="h6"
            sx={{
              mb: 1.5,
              fontWeight: 600,
            }}
          >
            Socials
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {Object.entries(socials).map(([socialKey, url]) => {
              const hasUrl = Boolean(url && typeof url === 'string' && url.trim() !== '')
              return (
                <Chip
                  key={socialKey}
                  label={`${socialKey}${hasUrl ? '' : ' (no link)'}`}
                  component={hasUrl ? 'a' : 'div'}
                  href={hasUrl ? url : undefined}
                  target={hasUrl ? '_blank' : undefined}
                  rel={hasUrl ? 'noopener noreferrer' : undefined}
                  clickable={hasUrl}
                  color={hasUrl ? 'secondary' : 'default'}
                  variant={hasUrl ? 'filled' : 'outlined'}
                  icon={hasUrl && mounted ? <LaunchRoundedIcon fontSize="small" /> : undefined}
                />
              )
            })}
          </Box>
        </Paper>

        <Box>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              mb: 2,
              fontWeight: 700,
            }}
          >
            Released Projects
          </Typography>

          {projects.length === 0 ? (
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
              }}
            >
              <Typography
                color="text.secondary"
              >
                No released projects listed in data/artist-data.json.
              </Typography>
            </Paper>
          ) : (
            <Stack
              spacing={2}
            >
              {projects.map((proj, idx) => {
                const projName = proj.name || 'Untitled Project'
                const projType = proj.type || 'Project'
                const projArtist = proj.artist || artistName || 'Artist'
                const projDate = proj.date || 'Release Date Unset'

                return (
                  <Card
                    key={idx}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h5"
                            component="h3"
                            sx={{
                              fontWeight: 600,
                            }}
                          >
                            {projName}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            By {projArtist} • Released {projDate}
                          </Typography>
                        </Box>
                        <Chip
                          label={projType}
                          size="small"
                          color="info"
                        />
                      </Box>

                      <Divider
                        sx={{
                          my: 1.5,
                        }}
                      />

                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        Tracks ({proj.tracks?.length ?? 0})
                      </Typography>

                      <Stack
                        spacing={1}
                      >
                        {(proj.tracks ?? []).map((track, trackIdx) => {
                          const trackName = track.name || `Track ${trackIdx + 1}`
                          return (
                            <Box
                              key={trackIdx}
                              sx={{
                                p: 1.5,
                                borderRadius: 1,
                                backgroundColor: 'action.hover',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                {mounted && (
                                  <MusicNoteRoundedIcon
                                    fontSize="small"
                                    color="action"
                                  />
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                  }}
                                >
                                  {trackName}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 0.5,
                                  flexWrap: 'wrap',
                                }}
                              >
                                {Object.entries(track.links ?? {}).map(([linkKey, linkUrl]) => {
                                  const hasTrackUrl = Boolean(linkUrl && typeof linkUrl === 'string' && linkUrl.trim() !== '')
                                  return (
                                    <Chip
                                      key={linkKey}
                                      size="small"
                                      label={linkKey}
                                      component={hasTrackUrl ? 'a' : 'div'}
                                      href={hasTrackUrl ? linkUrl : undefined}
                                      target={hasTrackUrl ? '_blank' : undefined}
                                      rel={hasTrackUrl ? 'noopener noreferrer' : undefined}
                                      clickable={hasTrackUrl}
                                      color={hasTrackUrl ? 'primary' : 'default'}
                                      variant="outlined"
                                    />
                                  )
                                })}
                              </Box>
                            </Box>
                          )
                        })}
                      </Stack>
                    </CardContent>
                  </Card>
                )
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  )
}
