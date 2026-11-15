const SOFTWARE_RENDERER_PATTERN =
  /swiftshader|llvmpipe|softpipe|software|microsoft basic render|basic render driver|mesa offscreen|gdi generic/i

let cachedDetectionResult = null

/**
 * Inspects a WebGL context for software rasterizer strings and releases it.
 *
 * @param {HTMLCanvasElement} canvas - Ephemeral offscreen canvas for probing
 * @returns {{ hasWebgl: boolean, isSoftware: boolean, renderer: string, vendor: string }}
 */
function probeWebglRenderer(canvas) {
  let gl = null
  try {
    gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
  } catch {
    return { hasWebgl: false, isSoftware: true, renderer: '', vendor: '' }
  }

  if (!gl) {
    return { hasWebgl: false, isSoftware: true, renderer: '', vendor: '' }
  }

  let renderer = ''
  let vendor = ''

  try {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      vendor = String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '')
    }
    if (!renderer) {
      renderer = String(gl.getParameter(gl.RENDERER) || '')
    }
    if (!vendor) {
      vendor = String(gl.getParameter(gl.VENDOR) || '')
    }
  } catch {
    // Ignore restricted WebGL parameter queries
  } finally {
    try {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      // Ignore cleanup errors on synthetic canvas
    }
  }

  const combined = `${vendor} ${renderer}`.trim()
  const isSoftware = SOFTWARE_RENDERER_PATTERN.test(combined)

  return {
    hasWebgl: true,
    isSoftware,
    renderer,
    vendor,
  }
}

/**
 * Detects client hardware acceleration status.
 * Lite mode is only recommended when WebGL is missing or backed by an explicit software rasterizer.
 * Result is memoized in module scope after the first client invocation.
 *
 * @returns {{
 *   isHardwareAccelerated: boolean,
 *   isLowEndDevice: boolean,
 *   prefersReducedMotion: boolean,
 *   recommendedTier: 'high' | 'lite',
 *   reason: string,
 *   renderer: string
 * }}
 */
export function detectHardwareAcceleration() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      isHardwareAccelerated: true,
      isLowEndDevice: false,
      prefersReducedMotion: false,
      recommendedTier: 'high',
      reason: 'ssr',
      renderer: '',
    }
  }

  if (cachedDetectionResult) {
    return cachedDetectionResult
  }

  const prefersReducedMotion = Boolean(
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
  )

  const canvas = document.createElement('canvas')
  const webglInfo = probeWebglRenderer(canvas)
  const isHardwareAccelerated = webglInfo.hasWebgl && !webglInfo.isSoftware

  const cpuCores =
    typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 0
  const deviceRam = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 0
  const isLowEndDevice = (cpuCores > 0 && cpuCores <= 2) || (deviceRam > 0 && deviceRam <= 2)

  let reason = 'hardware-accelerated'
  if (!webglInfo.hasWebgl) {
    reason = 'no-webgl-context'
  } else if (webglInfo.isSoftware) {
    reason = webglInfo.renderer
      ? `software-rasterizer (${webglInfo.renderer})`
      : 'software-rasterizer'
  }

  const recommendedTier = !isHardwareAccelerated ? 'lite' : 'high'

  cachedDetectionResult = {
    isHardwareAccelerated,
    isLowEndDevice,
    prefersReducedMotion,
    recommendedTier,
    reason,
    renderer: webglInfo.renderer,
  }

  return cachedDetectionResult
}
