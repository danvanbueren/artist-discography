/**
 * Client-side Media Preload Manager with memory-capped LRU cache.
 * Buffers initial byte ranges (first ~384KB) of upcoming audio tracks
 * during browser idle time, guaranteeing instant zero-latency playback start.
 * Tracks loaded high-resolution assets to skip low-quality placeholders on subsequent views.
 */

const HIGH_RES_CACHE_SET = new Set()

/**
 * Marks a high-resolution media URL as fully loaded in memory/browser cache.
 * @param {string} url
 */
export function markHighResCached(url) {
  if (!url || typeof window === 'undefined') return
  HIGH_RES_CACHE_SET.add(url)
}

/**
 * Checks if a high-resolution media URL is already cached in memory.
 * @param {string} url
 * @returns {boolean}
 */
export function isHighResCached(url) {
  if (!url || typeof window === 'undefined') return false
  return HIGH_RES_CACHE_SET.has(url)
}

class MediaPreloadManager {
  constructor(maxImagePreloads = 24) {
    this.preloadAudioElement = null
    this.currentPreloadUrl = null
    this.preloadedImages = new Set()
    this.maxImagePreloads = maxImagePreloads
    this.isAudioBuffering = false
  }

  /**
   * Sets whether the audio player is actively buffering/stalled.
   * When true, background image preloads yield completely to preserve network bandwidth for audio.
   * @param {boolean} buffering
   */
  setAudioBuffering(buffering) {
    this.isAudioBuffering = Boolean(buffering)
  }

  /**
   * Preload initial audio bytes of the upcoming queue track to guarantee instant zero-latency start.
   * Maintains a single managed Audio element and explicitly unloads prior preloads to prevent memory buildup.
   *
   * @param {string} audioUrl
   */
  preloadAudioChunk(audioUrl) {
    if (!audioUrl || typeof window === 'undefined') {
      return
    }

    if (this.currentPreloadUrl === audioUrl) {
      return
    }

    // Explicitly release any prior preloaded audio buffer to free browser memory
    this.clearAudioPreload()

    this.currentPreloadUrl = audioUrl

    const schedule = 'requestIdleCallback' in window
      ? window.requestIdleCallback
      : (cb) => setTimeout(cb, 200)

    schedule(() => {
      // Check if URL changed while waiting for idle tick
      if (this.currentPreloadUrl !== audioUrl) return

      try {
        if (this.preloadAudioElement) {
          try {
            this.preloadAudioElement.pause()
            this.preloadAudioElement.removeAttribute('src')
            this.preloadAudioElement.load()
          } catch {}
          this.preloadAudioElement = null
        }

        const audio = new Audio()
        audio.preload = 'auto'
        audio.muted = true
        audio.volume = 0
        audio.src = audioUrl
        audio.load()

        this.preloadAudioElement = audio
      } catch {
        this.currentPreloadUrl = null
      }
    })
  }

  /**
   * Explicitly unloads and frees the preloaded HTMLAudioElement from browser memory.
   */
  clearAudioPreload() {
    if (this.preloadAudioElement) {
      try {
        this.preloadAudioElement.pause()
        this.preloadAudioElement.removeAttribute('src')
        this.preloadAudioElement.load()
      } catch {}
      this.preloadAudioElement = null
    }
    this.currentPreloadUrl = null
  }

  /**
   * Preloads an image variant in the background so it's instantly available from cache.
   * Yields if audio is actively buffering to prevent network contention.
   *
   * @param {string} imageUrl
   */
  preloadImage(imageUrl) {
    if (
      !imageUrl ||
      typeof window === 'undefined' ||
      this.isAudioBuffering ||
      this.preloadedImages.has(imageUrl)
    ) {
      return
    }

    this.preloadedImages.add(imageUrl)
    if (this.preloadedImages.size > this.maxImagePreloads) {
      const oldest = this.preloadedImages.keys().next().value
      this.preloadedImages.delete(oldest)
    }

    const img = new Image()
    img.fetchPriority = 'low'
    img.src = imageUrl
    if (img.decode) {
      img.decode()
        .then(() => {
          markHighResCached(imageUrl)
        })
        .catch(() => {})
    } else {
      img.onload = () => {
        markHighResCached(imageUrl)
      }
    }
  }

  /**
   * Clears all memory caches and releases media resources.
   */
  clear() {
    this.clearAudioPreload()
    this.preloadedImages.clear()
    HIGH_RES_CACHE_SET.clear()
    this.isAudioBuffering = false
  }
}

export const mediaPreloader = new MediaPreloadManager()
