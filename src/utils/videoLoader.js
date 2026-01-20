/**
 * Supported video formats
 */
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
]

/**
 * Check if file is a supported video format
 */
export function isSupportedVideoFormat(file) {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()

  // Check MIME type
  if (SUPPORTED_VIDEO_FORMATS.includes(type)) {
    return true
  }

  // Check file extension as fallback
  const ext = name.split('.').pop()
  return ['mp4', 'webm', 'mov'].includes(ext)
}

/**
 * Load a video file and return video data
 * @param {File} file - Video file to load
 * @param {function} onProgress - Progress callback
 * @returns {Promise<Object>} Video data with element and metadata
 */
export async function loadVideo(file, onProgress) {
  if (!isSupportedVideoFormat(file)) {
    throw new Error('Unsupported video format. Please use MP4, WebM, or MOV.')
  }

  onProgress?.('Loading video...')

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      // Seek to first frame to ensure dimensions are accurate
      video.currentTime = 0
    }

    video.onseeked = () => {
      const duration = video.duration
      const width = video.videoWidth
      const height = video.videoHeight

      // Estimate FPS (default to 30 if not available)
      const fps = 30

      // Check duration limits
      if (duration > 60) {
        URL.revokeObjectURL(url)
        reject(new Error('Video is too long. Maximum length is 60 seconds.'))
        return
      }

      onProgress?.('Video loaded')

      resolve({
        video,
        url,
        originalName: file.name.replace(/\.[^/.]+$/, ''),
        width,
        height,
        duration,
        fps,
        file,
      })
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video. The file may be corrupted or unsupported.'))
    }

    video.src = url
  })
}

/**
 * Extract a frame from video at specific time
 * @param {HTMLVideoElement} video - Video element
 * @param {number} time - Time in seconds
 * @returns {Promise<HTMLCanvasElement>} Canvas with frame
 */
export async function extractFrame(video, time = 0) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')

    const seekHandler = () => {
      video.removeEventListener('seeked', seekHandler)
      ctx.drawImage(video, 0, 0)
      resolve(canvas)
    }

    video.addEventListener('seeked', seekHandler)
    video.currentTime = time

    // Timeout fallback
    setTimeout(() => {
      video.removeEventListener('seeked', seekHandler)
      reject(new Error('Failed to extract frame from video'))
    }, 5000)
  })
}

/**
 * Clean up video URL
 */
export function revokeVideoUrl(url) {
  if (url) {
    URL.revokeObjectURL(url)
  }
}
