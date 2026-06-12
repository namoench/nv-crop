import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { renderCroppedImage } from './canvasUtils'

let ffmpeg = null
let ffmpegLoading = false
let ffmpegLoadPromise = null
let encodeProgressCallback = null

/**
 * Initialize FFmpeg (lazy-loaded singleton)
 */
export async function initFFmpeg(onProgress) {
  // If already loaded, return existing instance
  if (ffmpeg && ffmpeg.loaded) {
    return ffmpeg
  }

  // If currently loading, wait for it
  if (ffmpegLoading && ffmpegLoadPromise) {
    return ffmpegLoadPromise
  }

  ffmpegLoading = true
  ffmpegLoadPromise = (async () => {
    onProgress?.('Initializing video processor...')

    ffmpeg = new FFmpeg()

    ffmpeg.on('progress', ({ progress }) => {
      encodeProgressCallback?.(progress)
    })

    try {
      // Load ffmpeg-core from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      onProgress?.('Video processor ready')
      return ffmpeg
    } catch (err) {
      ffmpeg = null
      ffmpegLoading = false
      ffmpegLoadPromise = null
      throw new Error('Failed to load video processor. Please check your internet connection.')
    }
  })()

  return ffmpegLoadPromise
}

/**
 * Process video with circular NV crop
 * @param {Object} videoData - Video data from loadVideo
 * @param {Object} circle - Circle selection {x, y, radius}
 * @param {string} edgeStyle - 'hard' or 'feathered'
 * @param {string} phosphorColor - 'green' or 'white'
 * @param {number} rotation - Rotation in degrees
 * @param {string} aspectRatio - Output aspect ratio ('9:16' or '1:1')
 * @param {Object} colorGrading - Color grading settings {brightness, contrast, saturation}
 * @param {function} onProgress - Progress callback (0-100, message)
 * @returns {Promise<string>} Blob URL of processed video
 */
export async function processVideo(
  videoData,
  circle,
  edgeStyle,
  phosphorColor,
  rotation,
  aspectRatio,
  colorGrading,
  onProgress
) {
  const { video, file, duration, fps } = videoData

  // Initialize FFmpeg
  const ff = await initFFmpeg(onProgress)

  onProgress?.(0, 'Preparing video...')

  // Write input video to FFmpeg filesystem
  const inputData = await fetchFile(file)
  await ff.writeFile('input.mp4', inputData)

  // Calculate frame count and timing
  const frameRate = fps || 30
  const totalFrames = Math.ceil(duration * frameRate)

  onProgress?.(5, 'Extracting frames...')

  // Create canvas for frame extraction
  const frameCanvas = document.createElement('canvas')
  frameCanvas.width = video.videoWidth
  frameCanvas.height = video.videoHeight
  const frameCtx = frameCanvas.getContext('2d')

  // Process frames
  const framePromises = []

  for (let i = 0; i < totalFrames; i++) {
    const time = i / frameRate
    const frameNum = i

    // Update progress
    const extractProgress = 5 + (i / totalFrames) * 40
    onProgress?.(extractProgress, `Processing frame ${i + 1}/${totalFrames}...`)

    // Seek to frame time
    await new Promise((resolve) => {
      const seekHandler = () => {
        video.removeEventListener('seeked', seekHandler)
        resolve()
      }
      video.addEventListener('seeked', seekHandler)
      video.currentTime = time
    })

    // Draw frame to canvas
    frameCtx.drawImage(video, 0, 0)

    // Apply NV crop effect (same renderer as image export)
    const processedCanvas = document.createElement('canvas')
    renderCroppedImage(
      processedCanvas,
      frameCanvas,
      circle,
      edgeStyle,
      phosphorColor,
      rotation,
      aspectRatio,
      colorGrading
    )

    // Convert to PNG and write to FFmpeg
    const blob = await new Promise((resolve) => {
      processedCanvas.toBlob(resolve, 'image/png')
    })

    const frameData = new Uint8Array(await blob.arrayBuffer())
    const frameName = `frame_${String(frameNum).padStart(5, '0')}.png`
    await ff.writeFile(frameName, frameData)
  }

  onProgress?.(50, 'Encoding video...')

  // Check if input has audio
  let hasAudio = false
  try {
    await ff.exec([
      '-i', 'input.mp4',
      '-vn',
      '-acodec', 'copy',
      'audio.aac'
    ])
    hasAudio = true
  } catch (e) {
    // No audio track
    hasAudio = false
  }

  onProgress?.(55, 'Encoding video...')

  // Encode frames to video (MP4 with H.264 for iOS compatibility)
  const encodeArgs = [
    '-framerate', String(frameRate),
    '-i', 'frame_%05d.png',
  ]

  if (hasAudio) {
    encodeArgs.push('-i', 'audio.aac')
  }

  encodeArgs.push(
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
  )

  if (hasAudio) {
    encodeArgs.push('-c:a', 'aac', '-b:a', '128k')
  }

  encodeArgs.push('-y', 'output.mp4')

  // Report real encode progress (55-90%) via FFmpeg's progress event
  encodeProgressCallback = (progress) => {
    const pct = 55 + Math.max(0, Math.min(1, progress)) * 35
    onProgress?.(pct, 'Encoding video...')
  }

  try {
    await ff.exec(encodeArgs)
  } finally {
    encodeProgressCallback = null
  }

  onProgress?.(90, 'Finalizing...')

  // Read output file
  const outputData = await ff.readFile('output.mp4')

  // Clean up FFmpeg filesystem
  try {
    await ff.deleteFile('input.mp4')
    if (hasAudio) {
      await ff.deleteFile('audio.aac')
    }
    for (let i = 0; i < totalFrames; i++) {
      await ff.deleteFile(`frame_${String(i).padStart(5, '0')}.png`)
    }
    await ff.deleteFile('output.mp4')
  } catch (e) {
    // Ignore cleanup errors
  }

  // Create Blob URL for download
  const blob = new Blob([outputData.buffer], { type: 'video/mp4' })
  const url = URL.createObjectURL(blob)

  onProgress?.(100, 'Complete!')

  return url
}

/**
 * Download processed video
 */
export function downloadVideo(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-nvcrop.mp4`
  link.click()
}

/**
 * Clean up video URL
 */
export function revokeProcessedVideoUrl(url) {
  if (url) {
    URL.revokeObjectURL(url)
  }
}
