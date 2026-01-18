import heic2any from 'heic2any'

/**
 * Supported image formats
 */
export const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
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
 * Check if a file format is supported
 */
export function isSupportedFormat(file) {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()

  if (SUPPORTED_FORMATS.includes(type)) return true
  if (name.endsWith('.heic') || name.endsWith('.heif')) return true
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) return true

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
 * Load an image file and return image data
 * @param {File} file - The image file to load
 * @param {function} onProgress - Optional progress callback
 * @returns {Promise<{image: HTMLImageElement, originalName: string, width: number, height: number}>}
 */
export async function loadImage(file, onProgress) {
  if (!isSupportedFormat(file)) {
    throw new Error(`Unsupported format. Please use JPG, PNG, HEIC, or HEIF.`)
  }

  let blob = file

  // Convert HEIC/HEIF to JPEG
  if (isHeicFormat(file)) {
    if (onProgress) onProgress('Converting HEIC image...')
    blob = await convertHeicToBlob(file)
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
