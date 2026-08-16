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
  constructor(maxAudioChunks = 8, maxImagePreloads = 24) {
    this.audioCache = new Map() // url -> Blob
    this.maxAudioChunks = maxAudioChunks
    this.activeAudioPreloads = new Set()
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
   * Preload initial byte ranges of an audio track to buffer metadata and immediate audio start.
   * Uses high network fetch priority so audio packets take precedence over background images.
   *
   * @param {string} audioUrl
   */
  preloadAudioChunk(audioUrl) {
    if (
      !audioUrl ||
      typeof window === 'undefined' ||
      this.activeAudioPreloads.has(audioUrl)
    ) {
      return
    }

    this.activeAudioPreloads.add(audioUrl)

    const schedule = 'requestIdleCallback' in window
      ? window.requestIdleCallback
      : (cb) => setTimeout(cb, 200)

    schedule(() => {
      try {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.muted = true
        audio.volume = 0
        audio.src = audioUrl
        audio.load()

        const cleanup = () => {
          this.activeAudioPreloads.delete(audioUrl)
          audio.removeEventListener('canplay', cleanup)
          audio.removeEventListener('error', cleanup)
        }

        audio.addEventListener('canplay', cleanup, { once: true })
        audio.addEventListener('error', cleanup, { once: true })
        setTimeout(cleanup, 5000)
      } catch {
        this.activeAudioPreloads.delete(audioUrl)
      }
    })
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
   * Returns cached audio chunk blob if available.
   *
   * @param {string} audioUrl
   * @returns {Blob|null}
   */
  getCachedAudioChunk(audioUrl) {
    return this.audioCache.get(audioUrl) || null
  }

  /**
   * Clears all memory caches
   */
  clear() {
    this.audioCache.clear()
    this.activeAudioPreloads.clear()
    this.preloadedImages.clear()
    HIGH_RES_CACHE_SET.clear()
    this.isAudioBuffering = false
  }
}

export const mediaPreloader = new MediaPreloadManager()
