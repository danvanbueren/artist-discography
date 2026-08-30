/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { SVG_ICONS } from './ogIcons'

const CARD_CONTAINER_STYLE = {
  width: '1200px',
  height: '630px',
  display: 'flex',
  flexDirection: 'row',
  position: 'relative',
  padding: '56px',
  backgroundColor: '#0d1117',
  color: '#ffffff',
  fontFamily: 'sans-serif',
  overflow: 'hidden',
}

const BACKGROUND_IMAGE_STYLE = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '1200px',
  height: '630px',
  objectFit: 'cover',
}

const CARD_CONTENT_OVERLAY_STYLE = {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: '48px',
}

const STATS_ROW_STYLE = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '36px',
  width: '100%',
}

const STAT_ITEM_STYLE = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '10px',
  fontSize: '24px',
  fontWeight: 900,
  color: 'rgba(255, 255, 255, 0.95)',
}

/**
 * Bottom horizontal accent bar matching Discord embed left stripe theme-color.
 */
function BottomAccentBar({ color = '#5865F2' }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '1200px',
        height: '14px',
        backgroundColor: color || '#5865F2',
      }}
    />
  )
}

/**
 * Renders the General Discography 1200x630 Open Graph card template.
 */
export function GeneralOgCard({
  artistName = 'Artist',
  bio = '',
  logoDataUrl = null,
  backgroundDataUrl = null,
  primaryGradient = 'linear-gradient(135deg, #ffffff, #d0d7de)',
  themeColorHex = '#5865F2',
  displayPlatforms = [],
  stats = { totalProjects: 0, totalTracks: 0, totalPlatforms: 0 },
}) {
  const platformsToRender = Array.isArray(displayPlatforms) ? displayPlatforms.slice(0, 8) : []

  return (
    <div style={CARD_CONTAINER_STYLE}>
      {backgroundDataUrl && <img src={backgroundDataUrl} style={BACKGROUND_IMAGE_STYLE} alt='' />}

      <div style={CARD_CONTENT_OVERLAY_STYLE}>
        {/* Left Column: Large Artist Logo & Discography Label */}
        <div
          style={{
            width: '420px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          {logoDataUrl ? (
            <img
              src={logoDataUrl}
              style={{
                maxWidth: '400px',
                maxHeight: '380px',
                objectFit: 'contain',
                borderRadius: '16px',
              }}
              alt={artistName}
            />
          ) : (
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '28px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
                fontWeight: 900,
                color: '#ffffff',
              }}
            >
              {artistName.charAt(0)}
            </div>
          )}

          {/* Discography Label (Same size and weight as bottom stats tags) */}
          <div
            style={{
              fontSize: '24px',
              fontWeight: 900,
              letterSpacing: '0.02em',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            Discography
          </div>
        </div>

        {/* Right Column: Artist Name, Bio, Platform Icons, and Bottom Stats */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              width: '100%',
            }}
          >
            {/* Artist Name */}
            <div
              style={{
                fontSize: '70px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
                backgroundImage: primaryGradient,
                backgroundClip: 'text',
                color: 'transparent',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {artistName}
            </div>

            {/* Artist Bio (Preserved comfortable reading weight) */}
            {bio ? (
              <div
                style={{
                  fontSize: '25px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: 1.45,
                  maxHeight: '135px',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {bio}
              </div>
            ) : (
              <div
                style={{
                  fontSize: '25px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.45,
                }}
              >
                Explore all official music releases, albums, and streaming platforms.
              </div>
            )}

            {/* Platform & Social Icons Row (Clean rounded images without card boxes) */}
            {platformsToRender.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '6px',
                }}
              >
                {platformsToRender.map(({ key, iconUrl }) => (
                  <img
                    key={key}
                    src={iconUrl}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      objectFit: 'contain',
                    }}
                    alt={key}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Stats Row (Comfortable left-aligned spacing) */}
          <div style={STATS_ROW_STYLE}>
            <div style={STAT_ITEM_STYLE}>
              {SVG_ICONS.album('rgba(255, 255, 255, 0.85)', 28)}
              <span>{stats.totalProjects || 0} projects</span>
            </div>
            <div style={STAT_ITEM_STYLE}>
              {SVG_ICONS.musicNote('rgba(255, 255, 255, 0.85)', 28)}
              <span>{stats.totalTracks || 0} tracks</span>
            </div>
            <div style={STAT_ITEM_STYLE}>
              {SVG_ICONS.link('rgba(255, 255, 255, 0.85)', 28)}
              <span>{stats.totalPlatforms || platformsToRender.length || 0} platforms</span>
            </div>
          </div>
        </div>
      </div>

      <BottomAccentBar color={themeColorHex} />
    </div>
  )
}

/**
 * Renders the Single Project 1200x630 Open Graph card template.
 */
export function ProjectOgCard({
  projectName = 'Project',
  projectArtist = 'Artist',
  releaseDate = '',
  projectType = 'Single',
  coverDataUrl = null,
  logoDataUrl = null,
  backgroundDataUrl = null,
  primaryGradient = 'linear-gradient(135deg, #ffffff, #d0d7de)',
  themeColorHex = '#5865F2',
  trackCount = 1,
  formattedDuration = '0:00',
}) {
  const subtitle = releaseDate
    ? projectType
      ? `${releaseDate} · ${projectType}`
      : releaseDate
    : projectType

  return (
    <div style={CARD_CONTAINER_STYLE}>
      {backgroundDataUrl && <img src={backgroundDataUrl} style={BACKGROUND_IMAGE_STYLE} alt='' />}

      <div style={CARD_CONTENT_OVERLAY_STYLE}>
        {/* Left Column: Balanced Album Art top-left, Scaled Logo bottom-left */}
        <div
          style={{
            width: '410px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          {coverDataUrl ? (
            <img
              src={coverDataUrl}
              style={{
                width: '390px',
                height: '390px',
                borderRadius: '20px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.75)',
                objectFit: 'cover',
              }}
              alt={projectName}
            />
          ) : (
            <div
              style={{
                width: '390px',
                height: '390px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '84px',
                fontWeight: 900,
              }}
            >
              {projectName.charAt(0)}
            </div>
          )}

          {logoDataUrl && (
            <img
              src={logoDataUrl}
              style={{
                maxWidth: '220px',
                maxHeight: '52px',
                objectFit: 'contain',
              }}
              alt=''
            />
          )}
        </div>

        {/* Right Column: Project Info & Bottom Duration Row */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              width: '100%',
            }}
          >
            {/* Project Name */}
            <div
              style={{
                fontSize: '70px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
                backgroundImage: primaryGradient,
                backgroundClip: 'text',
                color: 'transparent',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {projectName}
            </div>

            {/* Project Artist */}
            <div
              style={{
                fontSize: '36px',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.92)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {projectArtist}
            </div>

            {/* Release Date · Project Type */}
            {subtitle && (
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: 'rgba(255, 255, 255, 0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Bottom Row (Comfortable left-aligned spacing) */}
          <div style={STATS_ROW_STYLE}>
            <div style={STAT_ITEM_STYLE}>
              {SVG_ICONS.musicNote('rgba(255, 255, 255, 0.85)', 28)}
              <span>
                {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
              </span>
            </div>
            {formattedDuration && formattedDuration !== '0:00' && (
              <div style={STAT_ITEM_STYLE}>
                {SVG_ICONS.clock('rgba(255, 255, 255, 0.85)', 28)}
                <span>{formattedDuration}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomAccentBar color={themeColorHex} />
    </div>
  )
}

/**
 * Renders the Track 1200x630 Open Graph card template.
 */
export function TrackOgCard({
  trackName = 'Track',
  trackArtist = 'Artist',
  releaseDate = '',
  projectName = '',
  projectType = 'Single',
  coverDataUrl = null,
  logoDataUrl = null,
  backgroundDataUrl = null,
  primaryGradient = 'linear-gradient(135deg, #ffffff, #d0d7de)',
  themeColorHex = '#5865F2',
  formattedDuration = '0:00',
}) {
  const projectSubtitle = projectName
    ? `${projectName}${projectType ? ` · ${projectType}` : ''}`
    : projectType

  return (
    <div style={CARD_CONTAINER_STYLE}>
      {backgroundDataUrl && <img src={backgroundDataUrl} style={BACKGROUND_IMAGE_STYLE} alt='' />}

      <div style={CARD_CONTENT_OVERLAY_STYLE}>
        {/* Left Column: Balanced Cover Art top-left, Scaled Logo bottom-left */}
        <div
          style={{
            width: '410px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          {coverDataUrl ? (
            <img
              src={coverDataUrl}
              style={{
                width: '390px',
                height: '390px',
                borderRadius: '20px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.75)',
                objectFit: 'cover',
              }}
              alt={trackName}
            />
          ) : (
            <div
              style={{
                width: '390px',
                height: '390px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '84px',
                fontWeight: 900,
              }}
            >
              {trackName.charAt(0)}
            </div>
          )}

          {logoDataUrl && (
            <img
              src={logoDataUrl}
              style={{
                maxWidth: '220px',
                maxHeight: '52px',
                objectFit: 'contain',
              }}
              alt=''
            />
          )}
        </div>

        {/* Right Column: Track Info & Bottom Project/Duration Row */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              width: '100%',
            }}
          >
            {/* Track Name */}
            <div
              style={{
                fontSize: '70px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
                backgroundImage: primaryGradient,
                backgroundClip: 'text',
                color: 'transparent',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {trackName}
            </div>

            {/* Track Artist */}
            <div
              style={{
                fontSize: '36px',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.92)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {trackArtist}
            </div>

            {/* Release Date */}
            {releaseDate && (
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: 'rgba(255, 255, 255, 0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {releaseDate}
              </div>
            )}
          </div>

          {/* Bottom Row: Album & Duration (Comfortable left-aligned spacing) */}
          <div style={STATS_ROW_STYLE}>
            {projectSubtitle && (
              <div style={STAT_ITEM_STYLE}>
                {SVG_ICONS.album('rgba(255, 255, 255, 0.85)', 28)}
                <span
                  style={{
                    maxWidth: '420px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {projectSubtitle}
                </span>
              </div>
            )}
            {formattedDuration && formattedDuration !== '0:00' && (
              <div style={STAT_ITEM_STYLE}>
                {SVG_ICONS.clock('rgba(255, 255, 255, 0.85)', 28)}
                <span>{formattedDuration}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomAccentBar color={themeColorHex} />
    </div>
  )
}
