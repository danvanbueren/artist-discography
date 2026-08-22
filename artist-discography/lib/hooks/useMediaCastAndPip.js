'use client'

import { usePictureInPicture } from './usePictureInPicture'
import { useRemotePlayback } from './useRemotePlayback'

/**
 * Composite hook that provides Picture-in-Picture (PiP) and Remote Playback / Cast / AirPlay capabilities.
 *
 * @param {Object} params
 * @param {React.RefObject<HTMLAudioElement>} params.audioRef
 * @param {Object|null} params.playingTrack
 * @param {boolean} params.isPlaying
 * @param {string|null} params.coverArt
 * @param {Function} [params.onShowToast]
 */
export function useMediaCastAndPip({ audioRef, playingTrack, isPlaying, coverArt, onShowToast }) {
  const pip = usePictureInPicture({
    playingTrack,
    isPlaying,
    coverArt,
    onShowToast,
  })

  const remote = useRemotePlayback({
    audioRef,
    onShowToast,
  })

  return {
    ...pip,
    ...remote,
  }
}
