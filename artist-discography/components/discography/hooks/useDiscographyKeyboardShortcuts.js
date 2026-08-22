'use client'

import { useEffect } from 'react'

/**
 * Custom hook to register global keyboard shortcuts for the Discography application.
 *
 * @param {Object} params
 * @param {boolean} params.hasPlayingTrack - True if a track is actively loaded in the player
 * @param {Function} [params.onTogglePlay] - Play/pause toggle handler
 */
export function useDiscographyKeyboardShortcuts({ hasPlayingTrack = false, onTogglePlay }) {
  useEffect(() => {
    if (!hasPlayingTrack) return

    const handleKeyDown = (e) => {
      // Spacebar Play / Pause toggle (unless user is actively typing in an input field)
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32) {
        const target = e.target || document.activeElement
        let isTextEditField = false

        if (target) {
          if (target.isContentEditable) {
            isTextEditField = true
          } else {
            const tagName = target.tagName
            if (tagName === 'TEXTAREA') {
              isTextEditField = true
            } else if (tagName === 'INPUT') {
              const type = (target.type || 'text').toLowerCase()
              const nonTextTypes = [
                'range',
                'checkbox',
                'radio',
                'button',
                'submit',
                'reset',
                'color',
                'file',
                'image',
              ]
              if (!nonTextTypes.includes(type)) {
                isTextEditField = true
              }
            }
          }
        }

        if (!isTextEditField) {
          e.preventDefault()
          e.stopPropagation()
          if (onTogglePlay) onTogglePlay()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [hasPlayingTrack, onTogglePlay])
}
