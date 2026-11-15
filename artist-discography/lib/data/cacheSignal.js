const GLOBAL_DATA_MUTATION_KEY = '__artistDataMutationVersion'

/**
 * Increments the process-wide data mutation version so in-memory data loaders
 * invalidate immediately even across separate module chunks or same-tick writes.
 *
 * @returns {number} Updated mutation version counter
 */
export function bumpArtistDataMutationVersion() {
  const nextVersion = (globalThis[GLOBAL_DATA_MUTATION_KEY] || 0) + 1
  globalThis[GLOBAL_DATA_MUTATION_KEY] = nextVersion
  return nextVersion
}

/**
 * Reads the current process-wide data mutation version counter.
 *
 * @returns {number}
 */
export function getArtistDataMutationVersion() {
  return globalThis[GLOBAL_DATA_MUTATION_KEY] || 0
}
