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
 * Default color grading settings
 */
export const DEFAULT_COLOR_GRADING = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  tint: 'none',
  tintStrength: 1,
}

/**
 * Phosphor tint colors. Luminance is multiplied by this color, so the
 * tint color itself is what pure white maps to.
 */
export const TINT_COLORS = {
  green: 'rgb(120, 255, 120)', // P43 green phosphor
  white: 'rgb(225, 235, 245)', // P45 white phosphor (slightly cool)
}

/**
 * Default image transform (orientation) settings.
 * rotation: coarse rotation in 90° steps (0, 90, 180, 270)
 * straighten: fine rotation in degrees (-STRAIGHTEN_RANGE..STRAIGHTEN_RANGE)
 * flipH/flipV: mirror across the source image's own vertical/horizontal axis
 */
export const DEFAULT_TRANSFORM = {
  rotation: 0,
  straighten: 0,
  flipH: false,
  flipV: false,
}

/**
 * Maximum fine-rotation angle in degrees (either direction)
 */
export const STRAIGHTEN_RANGE = 45

/**
 * Whether a transform is the identity (nothing to undo)
 */
export function isDefaultTransform(transform) {
  return (
    !transform ||
    (transform.rotation === 0 &&
      !transform.straighten &&
      !transform.flipH &&
      !transform.flipV)
  )
}

/**
 * Rotate a transform by 90° in the given direction ('left' or 'right')
 */
export function rotateTransform(transform, direction) {
  const delta = direction === 'left' ? -90 : 90
  return { ...transform, rotation: (transform.rotation + delta + 360) % 360 }
}

/**
 * Flip a transform across a screen-space axis ('horizontal' mirrors
 * left-right as displayed, 'vertical' mirrors top-bottom). When the image is
 * rotated sideways, the source axes swap relative to the screen, so the
 * opposite source flag is toggled to keep the buttons behaving visually.
 */
export function flipTransform(transform, axis) {
  const sideways = transform.rotation === 90 || transform.rotation === 270
  const key = (axis === 'horizontal') !== sideways ? 'flipH' : 'flipV'
  return { ...transform, [key]: !transform[key] }
}

/**
 * Which screen-space axes currently appear flipped (for button active states)
 */
export function getViewFlips(transform) {
  const sideways = transform.rotation === 90 || transform.rotation === 270
  return {
    horizontal: sideways ? transform.flipV : transform.flipH,
    vertical: sideways ? transform.flipH : transform.flipV,
  }
}

/**
 * Apply a transform to a canvas context whose origin is at the frame center.
 * Flips are applied in source space (innermost), so the on-screen rotation
 * direction stays consistent regardless of flips.
 */
export function applyImageTransform(ctx, transform) {
  const { rotation = 0, straighten = 0, flipH = false, flipV = false } = transform || {}
  ctx.rotate(((rotation + straighten) * Math.PI) / 180)
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
}

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

  // Brightness (multiply) + contrast (scale around midpoint) collapse into a
  // single per-channel lookup table; Uint8ClampedArray clamps and rounds for us
  const lut = new Uint8ClampedArray(256)
  for (let v = 0; v < 256; v++) {
    lut[v] = (v * brightness - 128) * contrast + 128
  }

  if (saturation === 1) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = lut[data[i]]
      data[i + 1] = lut[data[i + 1]]
      data[i + 2] = lut[data[i + 2]]
    }
  } else {
    for (let i = 0; i < data.length; i += 4) {
      const r = lut[data[i]]
      const g = lut[data[i + 1]]
      const b = lut[data[i + 2]]

      // Saturation (interpolate toward grayscale, same weights as CSS saturate())
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
      data[i] = gray + saturation * (r - gray)
      data[i + 1] = gray + saturation * (g - gray)
      data[i + 2] = gray + saturation * (b - gray)
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Apply a phosphor tint to canvas content using blend modes.
 * Desaturates (preserving luminosity), then multiplies by the phosphor color,
 * so luminance maps onto the phosphor's response. Blend modes work everywhere
 * including iOS Safari, and behave identically in preview and export.
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} tint - 'none', 'green', or 'white'
 * @param {number} strength - Blend amount 0-1
 */
export function applyTint(ctx, width, height, tint, strength = 1) {
  const color = TINT_COLORS[tint]
  if (!color || strength <= 0) return

  ctx.save()
  ctx.globalAlpha = strength
  ctx.globalCompositeOperation = 'saturation'
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

/**
 * Get the frame (working/crop space) dimensions for a transformed image.
 * Only the coarse 90° rotation swaps width and height; straightening rotates
 * the image within the same frame so the crop space stays stable.
 */
export function getTransformedDimensions(width, height, transform) {
  const rotation = transform?.rotation ?? 0
  const isRotated90or270 = rotation === 90 || rotation === 270
  return {
    width: isRotated90or270 ? height : width,
    height: isRotated90or270 ? width : height,
  }
}

/**
 * Extract the circle's bounding square from the source into a small canvas
 * at output resolution, applying the transform in the same pass. Doing this
 * before color grading means the per-pixel work runs on ~1MP instead of the
 * full source resolution (which can be 48MP for ProRAW).
 * @param {HTMLImageElement|HTMLCanvasElement} source - Source image or canvas
 * @param {Object} circle - Circle {x, y, radius} in frame coordinates
 * @param {Object} transform - Transform {rotation, straighten, flipH, flipV}
 * @param {number} outputSize - Side length of the result canvas in pixels
 * @returns {HTMLCanvasElement} outputSize x outputSize canvas of the circle region
 */
function extractCircleRegion(source, circle, transform, outputSize) {
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')

  const w = source.width
  const h = source.height
  const frame = getTransformedDimensions(w, h, transform)
  const scale = outputSize / (circle.radius * 2)

  // Map (circle.x, circle.y) in frame space to the canvas center,
  // scaled so the circle's bounding square fills the canvas
  ctx.save()
  ctx.translate(outputSize / 2, outputSize / 2)
  ctx.scale(scale, scale)
  ctx.translate(frame.width / 2 - circle.x, frame.height / 2 - circle.y)
  // Straightening swings image corners outside the frame the preview shows;
  // clip to the frame so the export matches the preview exactly
  if (transform?.straighten) {
    ctx.beginPath()
    ctx.rect(-frame.width / 2, -frame.height / 2, frame.width, frame.height)
    ctx.clip()
  }
  applyImageTransform(ctx, transform)
  ctx.drawImage(source, -w / 2, -h / 2)
  ctx.restore()

  return canvas
}

/**
 * Render a single circle crop to a specific position on canvas
 */
function renderCircleToCanvas(ctx, image, circle, radius, centerX, centerY, outputRadius, edgeStyle, phosphorColor, transform = DEFAULT_TRANSFORM, colorGrading = null) {
  const outputSize = Math.round(outputRadius * 2)
  const region = extractCircleRegion(image, { x: circle.x, y: circle.y, radius }, transform, outputSize)

  // Tint first, then grade - matches the preview, where the brightness/
  // contrast/saturation CSS filter is applied on top of the tinted canvas
  const regionCtx = region.getContext('2d')
  applyTint(regionCtx, outputSize, outputSize, colorGrading?.tint, colorGrading?.tintStrength)
  applyColorGrading(regionCtx, outputSize, outputSize, colorGrading)

  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, centerY, outputRadius, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(region, centerX - outputRadius, centerY - outputRadius, outputRadius * 2, outputRadius * 2)
  ctx.restore()

  if (edgeStyle === 'feathered') {
    // PVS-14 style edge: thin translucent phosphor glow at the tube boundary
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
      // White phosphor - subtle warm white glow
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

    // Very subtle fade at the outermost edge
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

    ctx.restore()
  }
}

/**
 * Draw the source image with circular crop onto a canvas
 * @param {HTMLCanvasElement} canvas - The canvas to draw on
 * @param {HTMLImageElement|HTMLCanvasElement} image - The source image
 * @param {Object} circle - Circle selection {x, y, radius} in frame coordinates
 * @param {string} edgeStyle - 'hard' or 'feathered'
 * @param {string} phosphorColor - 'green' or 'white'
 * @param {Object} transform - Transform {rotation, straighten, flipH, flipV}
 * @param {string} aspectRatio - Output aspect ratio ('9:16' or '1:1')
 */
export function renderCroppedImage(canvas, image, circle, edgeStyle = 'hard', phosphorColor = 'green', transform = DEFAULT_TRANSFORM, aspectRatio = '9:16', colorGrading = null) {
  const { width: outputWidth, height: outputHeight } = getOutputDimensions(aspectRatio)
  const ctx = canvas.getContext('2d')
  canvas.width = outputWidth
  canvas.height = outputHeight

  // Fill with black background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, outputWidth, outputHeight)

  // Circle is capped at MAX_CIRCLE_PERCENT of the smaller output dimension
  const smallerDim = Math.min(outputWidth, outputHeight)
  const outputRadius = (smallerDim * MAX_CIRCLE_PERCENT) / 2

  renderCircleToCanvas(
    ctx, image, circle, circle.radius,
    outputWidth / 2, outputHeight / 2, outputRadius,
    edgeStyle, phosphorColor, transform, colorGrading
  )

  return canvas
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
 * @param {Object} transform1 - Transform for image1 {rotation, straighten, flipH, flipV}
 * @param {Object} transform2 - Transform for image2 {rotation, straighten, flipH, flipV}
 * @param {string} aspectRatio - Output aspect ratio ('9:16' or '1:1')
 */
export function renderDualCroppedImage(canvas, image1, image2, circle1, circle2, sharedRadius, layout, edgeStyle, phosphorColor, transform1 = DEFAULT_TRANSFORM, transform2 = DEFAULT_TRANSFORM, aspectRatio = '9:16', colorGrading = null) {
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

  // Render both circles with their respective transforms and color grading
  renderCircleToCanvas(ctx, image1, circle1, sharedRadius, center1X, center1Y, outputRadius, edgeStyle, phosphorColor, transform1, colorGrading)
  renderCircleToCanvas(ctx, image2, circle2, sharedRadius, center2X, center2Y, outputRadius, edgeStyle, phosphorColor, transform2, colorGrading)

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

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${filename}-nvcrop.${extension}`
    link.href = url
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }, mimeType, quality)
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
 * Radius multiplier per scroll-wheel tick when resizing the circle
 */
export const WHEEL_ZOOM_FACTOR = 1.05

/**
 * Distance between the first two touches of a touch list
 */
export function getTouchDistance(touches) {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  )
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
