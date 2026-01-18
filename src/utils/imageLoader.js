import heic2any from 'heic2any'
import * as UTIF from 'utif2'

/**
 * Supported image formats
 */
export const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/dng',
  'image/x-adobe-dng',
]

/**
 * Check if a file is a HEIC/HEIF format
 */
export function isHeicFormat(file) {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

/**
 * Check if a file is a DNG/ProRAW format
 */
export function isDngFormat(file) {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return (
    type === 'image/dng' ||
    type === 'image/x-adobe-dng' ||
    name.endsWith('.dng')
  )
}

/**
 * Check if a file format is supported
 */
export function isSupportedFormat(file) {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()

  if (SUPPORTED_FORMATS.includes(type)) return true
  if (name.endsWith('.heic') || name.endsWith('.heif')) return true
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) return true
  if (name.endsWith('.dng')) return true

  return false
}

/**
 * Convert HEIC/HEIF file to a blob URL
 */
async function convertHeicToBlob(file) {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.95,
    })

    // heic2any can return an array of blobs for multi-image HEIC files
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
    return blob
  } catch (error) {
    console.error('HEIC conversion error:', error)
    throw new Error('Failed to convert HEIC image. Please try a different image.')
  }
}

/**
 * Apply rotation to canvas based on EXIF orientation
 * Returns the properly oriented canvas
 */
function applyExifOrientation(canvas, orientation) {
  if (!orientation || orientation === 1) {
    return canvas // No rotation needed
  }

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // Create a new canvas for the rotated image
  const rotatedCanvas = document.createElement('canvas')
  const rotatedCtx = rotatedCanvas.getContext('2d')

  // Set dimensions based on orientation
  if (orientation >= 5 && orientation <= 8) {
    // 90 or 270 degree rotation - swap dimensions
    rotatedCanvas.width = height
    rotatedCanvas.height = width
  } else {
    rotatedCanvas.width = width
    rotatedCanvas.height = height
  }

  // Apply transformations based on EXIF orientation
  switch (orientation) {
    case 2: // Flip horizontal
      rotatedCtx.translate(width, 0)
      rotatedCtx.scale(-1, 1)
      break
    case 3: // Rotate 180
      rotatedCtx.translate(width, height)
      rotatedCtx.rotate(Math.PI)
      break
    case 4: // Flip vertical
      rotatedCtx.translate(0, height)
      rotatedCtx.scale(1, -1)
      break
    case 5: // Rotate 90 CW + flip horizontal
      rotatedCtx.translate(height, 0)
      rotatedCtx.rotate(Math.PI / 2)
      rotatedCtx.translate(0, -height)
      rotatedCtx.scale(1, -1)
      break
    case 6: // Rotate 90 CW
      rotatedCtx.translate(height, 0)
      rotatedCtx.rotate(Math.PI / 2)
      break
    case 7: // Rotate 90 CCW + flip horizontal
      rotatedCtx.translate(0, width)
      rotatedCtx.rotate(-Math.PI / 2)
      rotatedCtx.translate(-height, 0)
      rotatedCtx.scale(1, -1)
      break
    case 8: // Rotate 90 CCW
      rotatedCtx.translate(0, width)
      rotatedCtx.rotate(-Math.PI / 2)
      break
    default:
      return canvas
  }

  rotatedCtx.drawImage(canvas, 0, 0)
  return rotatedCanvas
}

/**
 * Convert DNG/ProRAW file to a canvas-compatible format
 */
async function convertDngToBlob(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const ifds = UTIF.decode(arrayBuffer)

    if (!ifds || ifds.length === 0) {
      throw new Error('Could not decode DNG file')
    }

    // Find the largest image (main image, not thumbnail)
    let mainIfd = ifds[0]
    for (const ifd of ifds) {
      if (ifd.width > mainIfd.width) {
        mainIfd = ifd
      }
    }

    // Get EXIF orientation (tag 274)
    const orientation = mainIfd.t274 ? mainIfd.t274[0] : 1

    // Decode the image data
    UTIF.decodeImage(arrayBuffer, mainIfd)

    const rgba = UTIF.toRGBA8(mainIfd)
    const width = mainIfd.width
    const height = mainIfd.height

    // Create canvas and draw the image
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    const imageData = ctx.createImageData(width, height)
    imageData.data.set(rgba)
    ctx.putImageData(imageData, 0, 0)

    // Apply EXIF orientation
    canvas = applyExifOrientation(canvas, orientation)

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert DNG to image'))
          }
        },
        'image/jpeg',
        0.95
      )
    })
  } catch (error) {
    console.error('DNG conversion error:', error)
    throw new Error('Failed to convert ProRAW/DNG image. The file may be unsupported.')
  }
}

/**
 * Load an image file and return image data
 * @param {File} file - The image file to load
 * @param {function} onProgress - Optional progress callback
 * @returns {Promise<{image: HTMLImageElement, originalName: string, width: number, height: number}>}
 */
export async function loadImage(file, onProgress) {
  if (!isSupportedFormat(file)) {
    throw new Error(`Unsupported format. Please use JPG, PNG, HEIC, HEIF, or DNG.`)
  }

  let blob = file

  // Convert HEIC/HEIF to JPEG
  if (isHeicFormat(file)) {
    if (onProgress) onProgress('Converting HEIC image...')
    blob = await convertHeicToBlob(file)
  }
  // Convert DNG/ProRAW to JPEG
  else if (isDngFormat(file)) {
    if (onProgress) onProgress('Converting ProRAW image...')
    blob = await convertDngToBlob(file)
  }

  // Create object URL and load image
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        image: img,
        url,
        originalName: file.name.replace(/\.[^/.]+$/, ''),
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image. The file may be corrupted.'))
    }

    img.src = url
  })
}

/**
 * Clean up image URL
 */
export function revokeImageUrl(url) {
  if (url) {
    URL.revokeObjectURL(url)
  }
}
