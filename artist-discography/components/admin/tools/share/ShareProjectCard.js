'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import Chip from '@mui/material/Chip'

/**
 * Renders an individual project card with preview artwork and copy button.
 *
 * @param {Object} props
 * @param {Object} props.project - Project data
 * @param {string} props.postText - Formatted post text
 * @param {number} props.index - Project index
 * @param {Function} props.onCopy - Copy callback
 */
export default function ShareProjectCard({ project, postText, index, onCopy }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (onCopy) {
      onCopy(postText, project.name)
    } else {
      navigator.clipboard.writeText(postText)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const coverUrl = project.cover
    ? project.cover.startsWith('http')
      ? project.cover
      : `${project.cover}?w=160&q=80`
    : null

  return (
    <Box
      sx={{
        backgroundColor: '#13131c',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: 'rgba(144, 202, 249, 0.3)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {coverUrl ? (
            <Box
              component='img'
              src={coverUrl}
              alt={project.name}
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                objectFit: 'cover',
                aspectRatio: '1 / 1',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              💽
            </Box>
          )}

          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant='subtitle2'
                sx={{
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                #{index + 1} {project.name}
              </Typography>
              <Chip
                label={project.type || 'Single'}
                size='small'
                sx={{
                  height: 18,
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(144, 202, 249, 0.12)',
                  color: '#90caf9',
                  border: '1px solid rgba(144, 202, 249, 0.2)',
                }}
              />
            </Box>
            <Typography
              variant='caption'
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {project.artist || 'Artist'}
            </Typography>
          </Box>
        </Box>

        <Button
          size='small'
          variant={copied ? 'contained' : 'outlined'}
          color={copied ? 'success' : 'primary'}
          startIcon={copied ? <CheckIcon fontSize='small' /> : <ContentCopyIcon fontSize='small' />}
          onClick={handleCopy}
          sx={{
            textTransform: 'none',
            borderRadius: 1.5,
            px: 1.5,
            py: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {copied ? 'Copied' : 'Copy Post'}
        </Button>
      </Box>

      <Box
        component='pre'
        sx={{
          m: 0,
          p: 1.5,
          backgroundColor: '#0a0a0f',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 1.5,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.825rem',
          lineHeight: 1.5,
          color: 'rgba(255, 255, 255, 0.9)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'text',
        }}
      >
        {postText}
      </Box>
    </Box>
  )
}
