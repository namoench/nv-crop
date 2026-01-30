/**
 * Aspect ratio presets
 */
export const ASPECT_RATIOS = {
  '9:16': { width: 1080, height: 1920, label: '9:16 Story' },
  '1:1': { width: 1080, height: 1080, label: '1:1 Square' },
}

/**
 * Default output dimensions (for backwards compatibility)
 */
export const OUTPUT_WIDTH = 1080
export const OUTPUT_HEIGHT = 1920

/**
 * Get dimensions for an aspect ratio
 */
export function getOutputDimensions(aspectRatio = '9:16') {
  return ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['9:16']
}

/**
 * Maximum circle diameter as percentage of output width
 */
export const MAX_CIRCLE_PERCENT = 0.9

/**
 * Feather zone as percentage of radius (thin edge glow)
 */
export const FEATHER_PERCENT = 0.025

/**
 * Apply color grading to canvas using manual pixel manipulation
 * This works on all browsers including iOS Safari where ctx.filter is buggy
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} colorGrading - Color grading settings {brightness, contrast, saturation}
 */
export function applyColorGrading(ctx, width, height, colorGrading) {
  if (!colorGrading) return
  const { brightness = 1, contrast = 1, saturation = 1 } = colorGrading

  // Skip if all values are default
  if (brightness === 1 && contrast === 1 && saturation === 1) return

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Debug: log first pixel before
  console.log('Before:', data[0], data[1], data[2], 'B:', brightness, 'C:', contrast, 'S:', saturation)

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // Apply brightness (multiply)
    r = r * brightness
    g = g * brightness
    b = b * brightness

    // Apply contrast (scale around midpoint)
    // Formula: output = (input - 128) * contrast + 128
    r = (r - 128) * contrast + 128
    g = (g - 128) * contrast + 128
    b = (b - 128) * contrast + 128

    // Apply saturation (interpolate toward grayscale)
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
    r = gray + saturation * (r - gray)
    g = gray + saturation * (g - gray)
    b = gray + saturation * (b - gray)

    // Clamp values to 0-255 and round
    data[i] = Math.round(Math.max(0, Math.min(255, r)))
    data[i + 1] = Math.round(Math.max(0, Math.min(255, g)))
    data[i + 2] = Math.round(Math.max(0, Math.min(255, b)))
  }

  // Debug: log first pixel after
  console.log('After:', data[0], data[1], data[2])

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Build CSS filter string from color grading settings (for browsers that support it)
 * @param {Object} colorGrading - Color grading settings {brightness, contrast, saturation}
 * @returns {string} CSS filter string or 'none'
 * @deprecated Use applyColorGrading for cross-browser support
 */
export function buildFilterString(colorGrading) {
  if (!colorGrading) return 'none'
  const { brightness = 1, contrast = 1, saturation = 1 } = colorGrading
  const filters = []
  if (brightness !== 1) filters.push(`brightness(${brightness})`)
  if (contrast !== 1) filters.push(`contrast(${contrast})`)
  if (saturation !== 1) filters.push(`saturate(${saturation})`)
  return filters.length > 0 ? filters.join(' ') : 'none'
}

/**
 * Get rotated image dimensions
 */
function getRotatedDimensions(width, height, rotation) {
  const isRotated90or270 = rotation === 90 || rotation === 270
  return {
    width: isRotated90or270 ? height : width,
    height: isRotated90or270 ? width : height,
  }
}

/**
 * Apply color grading to an image and return a new canvas
 * @param {HTMLImageElement|HTMLCanvasElement} source - Source image or canvas
 * @param {Object} colorGrading - Color grading settings
 * @returns {HTMLCanvasElement} New canvas with color grading applied
 */
function applyColorGradingToSource(source, colorGrading) {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0)
  applyColorGrading(ctx, canvas.width, canvas.height, colorGrading)
  return canvas
}

/**
 * Draw rotated image to a temporary canvas
 */
function drawRotatedImage(image, rotation) {
  const { width, height } = getRotatedDimensions(image.width, image.height, rotation)
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')

  tempCtx.save()
  tempCtx.translate(width / 2, height / 2)
  tempCtx.rotate((rotation * Math.PI) / 180)
  tempCtx.drawImage(image, -image.width / 2, -image.height / 2)
  tempCtx.restore()

  return tempCanvas
}

/**
 * Draw the source image with circular crop onto a canvas
 * @param {HTMLCanvasElement} canvas - The canvas to draw on
 * @param {HTMLImageElement} image - The source image
 * @param {Object} circle - Circle selection {x, y, radius} in image coordinates
 * @param {string} edgeStyle - 'hard' or 'feathered'
 * @param {string} phosphorColor - 'green' or 'white'
 * @param {number} rotation - Rotation in degrees (0, 90, 180, 270)
 * @param {string} aspectRatio - Output aspect ratio ('9:16' or '1:1')
 */
export function renderCroppedImage(canvas, image, circle, edgeStyle = 'hard', phosphorColor = 'green', rotation = 0, aspectRatio = '9:16', colorGrading = null) {
  const { width: outputWidth, height: outputHeight } = getOutputDimensions(aspectRatio)
  const ctx = canvas.getContext('2d')
  canvas.width = outputWidth
  canvas.height = outputHeight

  // Fill with black background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, outputWidth, outputHeight)

  // Get rotated source image if rotation is applied
  let sourceImage = rotation !== 0 ? drawRotatedImage(image, rotation) : image

  // Apply color grading to source image (uses pixel manipulation for iOS Safari compatibility)
  if (colorGrading) {
    sourceImage = applyColorGradingToSource(sourceImage, colorGrading)
  }

  // Calculate the output circle size
  // Scale the circle proportionally, but cap at MAX_CIRCLE_PERCENT of smaller dimension
  const smallerDim = Math.min(outputWidth, outputHeight)
  const maxOutputRadius = (smallerDim * MAX_CIRCLE_PERCENT) / 2

  // Calculate how much of the source image we're capturing
  // The circle.radius is in source image coordinates
  // We want to scale it to fit nicely in the output
  const sourceRadius = circle.radius
  const outputRadius = Math.min(maxOutputRadius, maxOutputRadius)

  // Scale factor from source to output
  const scale = outputRadius / sourceRadius

  // Center of output
  const outputCenterX = outputWidth / 2
  const outputCenterY = outputHeight / 2

  // Source region to capture (centered on circle)
  const sourceX = circle.x - sourceRadius
  const sourceY = circle.y - sourceRadius
  const sourceSize = sourceRadius * 2

  // Output region
  const outputSize = outputRadius * 2
  const outputX = outputCenterX - outputRadius
  const outputY = outputCenterY - outputRadius

  // Save context state
  ctx.save()

  if (edgeStyle === 'feathered') {
    // PVS-14 style edge: thin translucent green phosphor glow at the edge
    // First draw the image with a hard clip
    ctx.beginPath()
    ctx.arc(outputCenterX, outputCenterY, outputRadius, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      sourceImage,
      sourceX, sourceY, sourceSize, sourceSize,
      outputX, outputY, outputSize, outputSize
    )

    ctx.restore()
    ctx.save()

    // Now add a thin phosphor glow ring at the edge
    // This simulates the refractive tint at the tube boundary
    const glowWidth = outputRadius * FEATHER_PERCENT
    const innerGlowRadius = outputRadius - glowWidth

    // Create thin glow gradient based on phosphor color
    const glowGradient = ctx.createRadialGradient(
      outputCenterX, outputCenterY, innerGlowRadius,
      outputCenterX, outputCenterY, outputRadius
    )

    // Subtle phosphor glow - translucent color that fades out
    if (phosphorColor === 'green') {
      glowGradient.addColorStop(0, 'rgba(0, 255, 0, 0)')
      glowGradient.addColorStop(0.3, 'rgba(0, 255, 0, 0.08)')
      glowGradient.addColorStop(0.7, 'rgba(0, 200, 0, 0.15)')
      glowGradient.addColorStop(1, 'rgba(0, 150, 0, 0.05)')
    } else {
      // White phosphor - subtle warm white glow
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

    // Add very subtle fade at the outermost edge
    ctx.restore()
    ctx.save()

    const fadeGradient = ctx.createRadialGradient(
      outputCenterX, outputCenterY, outputRadius - glowWidth * 0.5,
      outputCenterX, outputCenterY, outputRadius
    )
    fadeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    fadeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)')

    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = fadeGradient
    ctx.beginPath()
    ctx.arc(outputCenterX, outputCenterY, outputRadius, 0, Math.PI * 2)
    ctx.fill()

  } else {
    // Hard edge - simple circular clip
    ctx.beginPath()
    ctx.arc(outputCenterX, outputCenterY, outputRadius, 0, Math.PI * 2)
    ctx.clip()

    // Draw the image portion
    ctx.drawImage(
      sourceImage,
      sourceX, sourceY, sourceSize, sourceSize,
      outputX, outputY, outputSize, outputSize
    )
  }

  ctx.restore()

  return canvas
}

/**
 * Render a single circle crop to a specific position on canvas
 * Helper for dual render
 */
function renderCircleToCanvas(ctx, image, circle, radius, centerX, centerY, outputRadius, edgeStyle, phosphorColor, rotation = 0, colorGrading = null) {
  // Get rotated source image if rotation is applied
  let sourceImage = rotation !== 0 ? drawRotatedImage(image, rotation) : image

  // Apply color grading to source image (uses pixel manipulation for iOS Safari compatibility)
  if (colorGrading) {
    sourceImage = applyColorGradingToSource(sourceImage, colorGrading)
  }

  const sourceRadius = radius
  const sourceX = circle.x - sourceRadius
  const sourceY = circle.y - sourceRadius
  const sourceSize = sourceRadius * 2
  const outputSize = outputRadius * 2
  const outputX = centerX - outputRadius
  const outputY = centerY - outputRadius

  ctx.save()

  if (edgeStyle === 'feathered') {
    ctx.beginPath()
    ctx.arc(centerX, centerY, outputRadius, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      sourceImage,
      sourceX, sourceY, sourceSize, sourceSize,
      outputX, outputY, outputSize, outputSize
    )

    ctx.restore()
    ctx.save()

    const glowWidth = outputRadius * FEATHER_PERCENT
    const innerGlowRadius = outputRadius - glowWidth
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, innerGlowRadius,
      centerX, centerY, outputRadius
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
    ctx.arc(centerX, centerY, outputRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
    ctx.save()

    const fadeGradient = ctx.createRadialGradient(
      centerX, centerY, outputRadius - glowWidth * 0.5,
      centerX, centerY, outputRadius
    )
    fadeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    fadeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)')

    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = fadeGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, outputRadius, 0, Math.PI * 2)
    ctx.fill()

  } else {
    ctx.beginPath()
    ctx.arc(centerX, centerY, outputRadius, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      sourceImage,
      sourceX, sourceY, sourceSize, sourceSize,
      outputX, outputY, outputSize, outputSize
    )
  }

  ctx.restore()
}

/**
 * Render dual circular crops onto a canvas
 * @param {HTMLCanvasElement} canvas - The canvas to draw on
 * @param {HTMLImageElement} image1 - First source image
 * @param {HTMLImageElement} image2 - Second source image
 * @param {Object} circle1 - First circle {x, y}
 * @param {Object} circle2 - Second circle {x, y}
 * @param {number} sharedRadius - Shared radius for both circles
 * @param {string} layout - 'vertical' or 'horizontal'
 * @param {string} edgeStyle - 'hard' or 'feathered'
 * @param {string} phosphorColor - 'green' or 'white'
 * @param {number} rotation1 - Rotation for image1 in degrees (0, 90, 180, 270)
 * @param {number} rotation2 - Rotation for image2 in degrees (0, 90, 180, 270)
 * @param {string} aspectRatio - Output aspect ratio ('9:16' or '1:1')
 */
export function renderDualCroppedImage(canvas, image1, image2, circle1, circle2, sharedRadius, layout, edgeStyle, phosphorColor, rotation1 = 0, rotation2 = 0, aspectRatio = '9:16', colorGrading = null) {
  const { width: outputWidth, height: outputHeight } = getOutputDimensions(aspectRatio)
  const ctx = canvas.getContext('2d')
  canvas.width = outputWidth
  canvas.height = outputHeight

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, outputWidth, outputHeight)

  let outputRadius, center1X, center1Y, center2X, center2Y

  if (layout === 'vertical') {
    // Stacked vertically - circles sized to fit with margin
    const maxDiameter = Math.min(outputWidth * 0.85, (outputHeight - 60) / 2)
    outputRadius = maxDiameter / 2

    center1X = outputWidth / 2
    center1Y = outputHeight / 4 + 15
    center2X = outputWidth / 2
    center2Y = (outputHeight * 3) / 4 - 15
  } else {
    // Side by side horizontally
    const maxDiameter = Math.min((outputWidth - 40) / 2, outputHeight * 0.45)
    outputRadius = maxDiameter / 2

    center1X = outputWidth / 4 + 5
    center1Y = outputHeight / 2
    center2X = (outputWidth * 3) / 4 - 5
    center2Y = outputHeight / 2
  }

  // Render both circles with their respective rotations and color grading
  renderCircleToCanvas(ctx, image1, circle1, sharedRadius, center1X, center1Y, outputRadius, edgeStyle, phosphorColor, rotation1, colorGrading)
  renderCircleToCanvas(ctx, image2, circle2, sharedRadius, center2X, center2Y, outputRadius, edgeStyle, phosphorColor, rotation2, colorGrading)

  return canvas
}

/**
 * Export canvas as downloadable image
 * @param {HTMLCanvasElement} canvas - The canvas to export
 * @param {string} filename - Base filename (without extension)
 * @param {string} format - 'png' or 'jpeg'
 * @param {number} quality - JPEG quality (0-1)
 */
export function exportCanvas(canvas, filename, format = 'png', quality = 0.92) {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const extension = format === 'jpeg' ? 'jpg' : 'png'

  const dataUrl = canvas.toDataURL(mimeType, quality)

  const link = document.createElement('a')
  link.download = `${filename}-nvcrop.${extension}`
  link.href = dataUrl
  link.click()
}

/**
 * Calculate initial circle position and size for an image
 * Centers the circle and sizes it to fit well
 */
export function getInitialCircle(imageWidth, imageHeight) {
  const centerX = imageWidth / 2
  const centerY = imageHeight / 2

  // Start with circle that's 60% of the smaller dimension
  const smallerDim = Math.min(imageWidth, imageHeight)
  const radius = smallerDim * 0.3

  return {
    x: centerX,
    y: centerY,
    radius,
  }
}

/**
 * Constrain circle to stay within image bounds
 */
export function constrainCircle(circle, imageWidth, imageHeight) {
  const minRadius = 50
  const maxRadius = Math.min(imageWidth, imageHeight) / 2

  let { x, y, radius } = circle

  // Constrain radius
  radius = Math.max(minRadius, Math.min(maxRadius, radius))

  // Constrain position so circle stays within image
  x = Math.max(radius, Math.min(imageWidth - radius, x))
  y = Math.max(radius, Math.min(imageHeight - radius, y))

  return { x, y, radius }
}
