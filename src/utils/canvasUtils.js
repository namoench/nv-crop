/**
 * Output dimensions for 9:16 aspect ratio
 */
export const OUTPUT_WIDTH = 1080
export const OUTPUT_HEIGHT = 1920

/**
 * Maximum circle diameter as percentage of output width
 */
export const MAX_CIRCLE_PERCENT = 0.9

/**
 * Feather zone as percentage of radius (thin edge glow)
 */
export const FEATHER_PERCENT = 0.025

/**
 * Draw the source image with circular crop onto a canvas
 * @param {HTMLCanvasElement} canvas - The canvas to draw on
 * @param {HTMLImageElement} image - The source image
 * @param {Object} circle - Circle selection {x, y, radius} in image coordinates
 * @param {string} edgeStyle - 'hard' or 'feathered'
 * @param {string} phosphorColor - 'green' or 'white'
 */
export function renderCroppedImage(canvas, image, circle, edgeStyle = 'hard', phosphorColor = 'green') {
  const ctx = canvas.getContext('2d')
  canvas.width = OUTPUT_WIDTH
  canvas.height = OUTPUT_HEIGHT

  // Fill with black background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)

  // Calculate the output circle size
  // Scale the circle proportionally, but cap at MAX_CIRCLE_PERCENT of width
  const maxOutputRadius = (OUTPUT_WIDTH * MAX_CIRCLE_PERCENT) / 2

  // Calculate how much of the source image we're capturing
  // The circle.radius is in source image coordinates
  // We want to scale it to fit nicely in the output
  const sourceRadius = circle.radius
  const outputRadius = Math.min(maxOutputRadius, maxOutputRadius)

  // Scale factor from source to output
  const scale = outputRadius / sourceRadius

  // Center of output
  const outputCenterX = OUTPUT_WIDTH / 2
  const outputCenterY = OUTPUT_HEIGHT / 2

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
      image,
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
      image,
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
function renderCircleToCanvas(ctx, image, circle, radius, centerX, centerY, outputRadius, edgeStyle, phosphorColor) {
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
      image,
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
      image,
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
 */
export function renderDualCroppedImage(canvas, image1, image2, circle1, circle2, sharedRadius, layout, edgeStyle, phosphorColor) {
  const ctx = canvas.getContext('2d')
  canvas.width = OUTPUT_WIDTH
  canvas.height = OUTPUT_HEIGHT

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)

  let outputRadius, center1X, center1Y, center2X, center2Y

  if (layout === 'vertical') {
    // Stacked vertically - circles sized to fit with margin
    const maxDiameter = Math.min(OUTPUT_WIDTH * 0.85, (OUTPUT_HEIGHT - 60) / 2)
    outputRadius = maxDiameter / 2

    center1X = OUTPUT_WIDTH / 2
    center1Y = OUTPUT_HEIGHT / 4 + 15
    center2X = OUTPUT_WIDTH / 2
    center2Y = (OUTPUT_HEIGHT * 3) / 4 - 15
  } else {
    // Side by side horizontally
    const maxDiameter = Math.min((OUTPUT_WIDTH - 40) / 2, OUTPUT_HEIGHT * 0.45)
    outputRadius = maxDiameter / 2

    center1X = OUTPUT_WIDTH / 4 + 5
    center1Y = OUTPUT_HEIGHT / 2
    center2X = (OUTPUT_WIDTH * 3) / 4 - 5
    center2Y = OUTPUT_HEIGHT / 2
  }

  // Render both circles
  renderCircleToCanvas(ctx, image1, circle1, sharedRadius, center1X, center1Y, outputRadius, edgeStyle, phosphorColor)
  renderCircleToCanvas(ctx, image2, circle2, sharedRadius, center2X, center2Y, outputRadius, edgeStyle, phosphorColor)

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
