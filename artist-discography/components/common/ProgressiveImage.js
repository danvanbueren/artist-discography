'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Skeleton } from '@mui/material'
import AlbumIcon from '@mui/icons-material/Album'
import { isHighResCached, markHighResCached } from '../../lib/mediaPreloader'

/**
 * High-performance progressive image component.
 * If the highest quality media is already cached in memory/browser, immediately renders
 * the high-res asset with zero latency (skipping skeletons and low-res placeholders).
 * Otherwise, displays a lightweight LQIP placeholder and smoothly crossfades
 * in the full-resolution asset once loaded.
 */
export default function ProgressiveImage({
  src,
  alt = 'Cover artwork',
  targetWidth = 600,
  placeholderWidth = 40,
  quality = 80,
  blur = 6,
  sx = {},
  objectFit = 'cover',
  priority = false,
  fallback = null,
  onLoad = null,
  ...rest
}) {
  const isApiMedia = typeof src === 'string' && src.startsWith('/api/media')

  const targetHighResSrc =
    isApiMedia && targetWidth
      ? src.includes('?')
        ? `${src}&w=${targetWidth}&q=${quality}&fmt=webp`
        : `${src}?w=${targetWidth}&q=${quality}&fmt=webp`
      : src || ''

  const lowResSrc =
    isApiMedia && src
      ? src.includes('?')
        ? `${src}&w=${placeholderWidth}&q=30&blur=${blur}`
        : `${src}?w=${placeholderWidth}&q=30&blur=${blur}`
      : src || ''

  const [imgSrc, setImgSrc] = useState(targetHighResSrc)
  const [isLoaded, setIsLoaded] = useState(() => isHighResCached(targetHighResSrc))
  const [hasError, setHasError] = useState(false)
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad
  const prevSrcRef = useRef(targetHighResSrc)

  // Synchronize when the target source URL changes
  useEffect(() => {
    if (prevSrcRef.current === targetHighResSrc) return
    prevSrcRef.current = targetHighResSrc

    if (!targetHighResSrc) {
      setImgSrc('')
      setIsLoaded(false)
      setHasError(false)
      return
    }

    const isCached = isHighResCached(targetHighResSrc)
    setImgSrc(targetHighResSrc)
    setIsLoaded(isCached)
    setHasError(false)
  }, [targetHighResSrc])

  if (!src || hasError) {
    if (fallback) return fallback
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: 'text.secondary',
          width: '100%',
          height: '100%',
          ...sx,
        }}
        {...rest}
      >
        <AlbumIcon sx={{ fontSize: '40%', opacity: 0.5 }} />
      </Box>
    )
  }

  const handleLoad = () => {
    setIsLoaded(true)
    if (imgSrc) {
      markHighResCached(imgSrc)
    }
    if (onLoadRef.current) {
      onLoadRef.current()
    }
  }

  const handleError = () => {
    // If the optimized webp failed, fall back to original image
    if (imgSrc && imgSrc !== src) {
      setImgSrc(src)
    } else {
      setHasError(true)
    }
  }

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        ...sx,
      }}
      {...rest}
    >
      {/* 0. Skeleton Wave Background (only when not yet loaded) */}
      {!isLoaded && (
        <Skeleton
          variant='rectangular'
          animation='wave'
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(255, 255, 255, 0.08)',
            zIndex: 0,
          }}
        />
      )}

      {/* 1. Low-Resolution Blurred Placeholder (LQIP) - Skipped if already loaded */}
      {!isLoaded && isApiMedia && (
        <Box
          component='img'
          src={lowResSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit,
            filter: 'blur(6px)',
            transform: 'scale(1.06)',
            opacity: 1,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* 2. Main High-Resolution Image */}
      <Box
        component='img'
        src={imgSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        sx={{
          position: isLoaded ? 'static' : 'relative',
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit,
          opacity: isLoaded ? 1 : 0,
          transition: isLoaded ? 'none' : 'opacity 0.25s ease-in-out',
          zIndex: 2,
        }}
      />
    </Box>
  )
}
