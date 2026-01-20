import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import {
  OUTPUT_WIDTH,
  OUTPUT_HEIGHT,
  MAX_CIRCLE_PERCENT,
  FEATHER_PERCENT,
} from './canvasUtils'

let ffmpeg = null
let ffmpegLoading = false
let ffmpegLoadPromise = null

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

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message)
    })

    ffmpeg.on('progress', ({ progress }) => {
      // This fires during encoding
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
 * Get rotated dimensions
 */
function getRotatedDimensions(width, height, rotation) {
  const isRotated90or270 = rotation === 90 || rotation === 270
  return {
    width: isRotated90or270 ? height : width,
    height: isRotated90or270 ? width : height,
  }
}

/**
 * Draw rotated canvas
 */
function drawRotatedCanvas(sourceCanvas, rotation) {
  const { width, height } = getRotatedDimensions(
    sourceCanvas.width,
    sourceCanvas.height,
    rotation
  )
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')

  tempCtx.save()
  tempCtx.translate(width / 2, height / 2)
  tempCtx.rotate((rotation * Math.PI) / 180)
  tempCtx.drawImage(
    sourceCanvas,
    -sourceCanvas.width / 2,
    -sourceCanvas.height / 2
  )
  tempCtx.restore()

  return tempCanvas
}

/**
 * Render a single frame with NV crop effect
 */
function renderCroppedFrame(
  frameCanvas,
  circle,
  edgeStyle,
  phosphorColor,
  rotation
) {
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = OUTPUT_WIDTH
  outputCanvas.height = OUTPUT_HEIGHT

  const ctx = outputCanvas.getContext('2d')

  // Fill black background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)

  // Apply rotation if needed
  let sourceCanvas = frameCanvas
  if (rotation !== 0) {
    sourceCanvas = drawRotatedCanvas(frameCanvas, rotation)
  }

  // Calculate output circle size
  const maxOutputRadius = (OUTPUT_WIDTH * MAX_CIRCLE_PERCENT) / 2
  const sourceRadius = circle.radius
  const outputRadius = maxOutputRadius
  const scale = outputRadius / sourceRadius

  const outputCenterX = OUTPUT_WIDTH / 2
  const outputCenterY = OUTPUT_HEIGHT / 2

  // Source region to capture
  const sourceX = circle.x - sourceRadius
  const sourceY = circle.y - sourceRadius
  const sourceSize = sourceRadius * 2

  // Output region
  const outputSize = outputRadius * 2
  const outputX = outputCenterX - outputRadius
  const outputY = outputCenterY - outputRadius

  ctx.save()

  if (edgeStyle === 'feathered') {
    // Hard clip first
    ctx.beginPath()
    ctx.arc(outputCenterX, outputCenterY, outputRadius, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      sourceCanvas,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      outputX,
      outputY,
      outputSize,
      outputSize
    )

    ctx.restore()
    ctx.save()

    // Add phosphor glow
    const glowWidth = outputRadius * FEATHER_PERCENT
    const innerGlowRadius = outputRadius - glowWidth

    const glowGradient = ctx.createRadialGradient(
      outputCenterX,
      outputCenterY,
      innerGlowRadius,
      outputCenterX,
      outputCenterY,
      outputRadius
    )

    if (phosphorColor === 'green') {
      glowGradient.addColorStop(0, 'rgba(0, 255, 0, 0)')
      glowGradient.addColorStop(0.3, 'rgba(0, 255, 0, 0.08)')
      glowGradient.addColorStop(0.7, 'rgba(0, 200, 0, 0.15)')
      glowGradient.addColorStop(1, 'rgba(0, 150, 0, 0.05)')
    } else {
      glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
      glowGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.06)')
      glowGradient.addColorStop(0.7, 'rgba(240, 240, 230, 0.12)')
      glowGradient.addColorStop(1, 'rgba(220, 220, 210, 0.04)')
    }

    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(outputCenterX, outputCenterY, outputRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
    ctx.save()

    // Fade at edge
    const fadeGradient = ctx.createRadialGradient(
      outputCenterX,
      outputCenterY,
      outputRadius - glowWidth * 0.5,
      outputCenterX,
      outputCenterY,
      outputRadius
    )
    fadeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    fadeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)')

    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = fadeGradient
    ctx.beginPath()
    ctx.arc(outputCenterX, outputCenterY, outputRadius, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // Hard edge
    ctx.beginPath()
    ctx.arc(outputCenterX, outputCenterY, outputRadius, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      sourceCanvas,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      outputX,
      outputY,
      outputSize,
      outputSize
    )
  }

  ctx.restore()

  return outputCanvas
}

/**
 * Process video with circular NV crop
 * @param {Object} videoData - Video data from loadVideo
 * @param {Object} circle - Circle selection {x, y, radius}
 * @param {string} edgeStyle - 'hard' or 'feathered'
 * @param {string} phosphorColor - 'green' or 'white'
 * @param {number} rotation - Rotation in degrees
 * @param {function} onProgress - Progress callback (0-100, message)
 * @returns {Promise<string>} Blob URL of processed video
 */
export async function processVideo(
  videoData,
  circle,
  edgeStyle,
  phosphorColor,
  rotation,
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

    // Apply NV crop effect
    const processedCanvas = renderCroppedFrame(
      frameCanvas,
      circle,
      edgeStyle,
      phosphorColor,
      rotation
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

  // Encode frames to video
  const encodeArgs = [
    '-framerate', String(frameRate),
    '-i', 'frame_%05d.png',
  ]

  if (hasAudio) {
    encodeArgs.push('-i', 'audio.aac')
  }

  encodeArgs.push(
    '-c:v', 'libvpx-vp9',
    '-crf', '30',
    '-b:v', '0',
    '-pix_fmt', 'yuva420p',
  )

  if (hasAudio) {
    encodeArgs.push('-c:a', 'copy')
  }

  encodeArgs.push('-y', 'output.webm')

  await ff.exec(encodeArgs)

  onProgress?.(90, 'Finalizing...')

  // Read output file
  const outputData = await ff.readFile('output.webm')

  // Clean up FFmpeg filesystem
  try {
    await ff.deleteFile('input.mp4')
    if (hasAudio) {
      await ff.deleteFile('audio.aac')
    }
    for (let i = 0; i < totalFrames; i++) {
      await ff.deleteFile(`frame_${String(i).padStart(5, '0')}.png`)
    }
    await ff.deleteFile('output.webm')
  } catch (e) {
    // Ignore cleanup errors
  }

  // Create Blob URL for download
  const blob = new Blob([outputData.buffer], { type: 'video/webm' })
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
  link.download = `${filename}-nvcrop.webm`
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
