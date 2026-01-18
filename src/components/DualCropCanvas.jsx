import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { constrainCircle, FEATHER_PERCENT } from '../utils/canvasUtils'

const HANDLE_RADIUS = 16
const HANDLE_HIT_RADIUS = 25

function SingleCanvas({ image, circle, onCircleChange, edgeStyle, phosphorColor, sharedRadius, onRadiusChange, label, rotation = 0 }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(null)
  const [dragStart, setDragStart] = useState(null)

  // Calculate rotated dimensions
  const rotatedDims = useMemo(() => {
    const isRotated90or270 = rotation === 90 || rotation === 270
    return {
      width: isRotated90or270 ? image.height : image.width,
      height: isRotated90or270 ? image.width : image.height,
    }
  }, [image, rotation])

  useEffect(() => {
    if (!containerRef.current || !image) return

    const updateScale = () => {
      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      const scaleX = containerWidth / rotatedDims.width
      const scaleY = containerHeight / rotatedDims.height
      const newScale = Math.min(scaleX, scaleY, 1)

      setScale(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [image, rotatedDims])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    const displayWidth = rotatedDims.width * scale
    const displayHeight = rotatedDims.height * scale

    canvas.width = displayWidth
    canvas.height = displayHeight

    // Apply rotation and draw image
    ctx.save()
    ctx.translate(displayWidth / 2, displayHeight / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    ctx.restore()

    const circleX = circle.x * scale
    const circleY = circle.y * scale
    const circleRadius = sharedRadius * scale

    // Darkened overlay
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.beginPath()
    ctx.rect(0, 0, displayWidth, displayHeight)
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2, true)
    ctx.fill()
    ctx.restore()

    // Circle border
    ctx.save()
    if (edgeStyle === 'feathered') {
      const glowWidth = circleRadius * FEATHER_PERCENT
      const glowGradient = ctx.createRadialGradient(
        circleX, circleY, circleRadius - glowWidth,
        circleX, circleY, circleRadius
      )
      if (phosphorColor === 'green') {
        glowGradient.addColorStop(0, 'rgba(0, 255, 0, 0)')
        glowGradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.3)')
        glowGradient.addColorStop(1, 'rgba(0, 255, 0, 0.1)')
      } else {
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
        glowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)')
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)')
      }
      ctx.strokeStyle = glowGradient
      ctx.lineWidth = glowWidth * 2
      ctx.beginPath()
      ctx.arc(circleX, circleY, circleRadius - glowWidth, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = phosphorColor === 'green' ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 1.5
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
    }
    ctx.beginPath()
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // Resize handle
    const handleAngle = -Math.PI / 4
    const handleX = circleX + Math.cos(handleAngle) * circleRadius
    const handleY = circleY + Math.sin(handleAngle) * circleRadius
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(handleX, handleY, HANDLE_RADIUS * 0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // Center dot
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.arc(circleX, circleY, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

  }, [image, circle, scale, edgeStyle, phosphorColor, sharedRadius, rotation, rotatedDims])

  const clientToImage = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    }
  }, [scale])

  const isNearHandle = useCallback((x, y) => {
    const handleAngle = -Math.PI / 4
    const handleX = circle.x + Math.cos(handleAngle) * sharedRadius
    const handleY = circle.y + Math.sin(handleAngle) * sharedRadius
    const dist = Math.sqrt((x - handleX) ** 2 + (y - handleY) ** 2)
    return dist < HANDLE_HIT_RADIUS / scale
  }, [circle, sharedRadius, scale])

  const isInsideCircle = useCallback((x, y) => {
    const dist = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2)
    return dist < sharedRadius
  }, [circle, sharedRadius])

  const isNearEdge = useCallback((x, y) => {
    const dist = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2)
    return Math.abs(dist - sharedRadius) < HANDLE_HIT_RADIUS / scale
  }, [circle, sharedRadius, scale])

  const handlePointerStart = useCallback((x, y) => {
    const pos = clientToImage(x, y)
    if (isNearHandle(pos.x, pos.y) || isNearEdge(pos.x, pos.y)) {
      setDragging('edge')
      setDragStart({ x: pos.x, y: pos.y, startRadius: sharedRadius })
    } else if (isInsideCircle(pos.x, pos.y)) {
      setDragging('center')
      setDragStart({ x: pos.x, y: pos.y, startX: circle.x, startY: circle.y })
    }
  }, [clientToImage, isNearHandle, isNearEdge, isInsideCircle, circle, sharedRadius])

  const handlePointerMove = useCallback((x, y) => {
    if (!dragging || !dragStart) return
    const pos = clientToImage(x, y)

    if (dragging === 'center') {
      const dx = pos.x - dragStart.x
      const dy = pos.y - dragStart.y
      const newCircle = constrainCircle(
        { x: dragStart.startX + dx, y: dragStart.startY + dy, radius: sharedRadius },
        rotatedDims.width,
        rotatedDims.height
      )
      onCircleChange({ x: newCircle.x, y: newCircle.y })
    } else if (dragging === 'edge') {
      const dist = Math.sqrt((pos.x - circle.x) ** 2 + (pos.y - circle.y) ** 2)
      const minRadius = 50
      const maxRadius = Math.min(rotatedDims.width, rotatedDims.height) / 2
      const newRadius = Math.max(minRadius, Math.min(maxRadius, dist))
      onRadiusChange(newRadius)
    }
  }, [dragging, dragStart, clientToImage, circle, sharedRadius, rotatedDims, onCircleChange, onRadiusChange])

  const handlePointerEnd = useCallback(() => {
    setDragging(null)
    setDragStart(null)
  }, [])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    handlePointerStart(e.clientX, e.clientY)
  }, [handlePointerStart])

  const handleMouseMove = useCallback((e) => {
    handlePointerMove(e.clientX, e.clientY)
  }, [handlePointerMove])

  const handleMouseUp = useCallback(() => {
    handlePointerEnd()
  }, [handlePointerEnd])

  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      handlePointerStart(e.touches[0].clientX, e.touches[0].clientY)
    }
  }, [handlePointerStart])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }, [handlePointerMove])

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    handlePointerEnd()
  }, [handlePointerEnd])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  if (!image) return null

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <p className="text-xs text-gray-500 text-center mb-1">{label}</p>
      <div ref={containerRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`touch-canvas no-select ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
    </div>
  )
}

export default function DualCropCanvas({
  image1, image2,
  circle1, circle2,
  onCircle1Change, onCircle2Change,
  sharedRadius, onRadiusChange,
  edgeStyle, phosphorColor,
  layout,
  rotation1 = 0,
  rotation2 = 0
}) {
  if (!image1 || !image2) return null

  return (
    <div className={`w-full flex-1 min-h-0 flex gap-2 p-2 ${layout === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
      <SingleCanvas
        image={image1.image}
        circle={circle1}
        onCircleChange={onCircle1Change}
        edgeStyle={edgeStyle}
        phosphorColor={phosphorColor}
        sharedRadius={sharedRadius}
        onRadiusChange={onRadiusChange}
        label={layout === 'horizontal' ? 'Left' : 'Top'}
        rotation={rotation1}
      />
      <SingleCanvas
        image={image2.image}
        circle={circle2}
        onCircleChange={onCircle2Change}
        edgeStyle={edgeStyle}
        phosphorColor={phosphorColor}
        sharedRadius={sharedRadius}
        onRadiusChange={onRadiusChange}
        label={layout === 'horizontal' ? 'Right' : 'Bottom'}
        rotation={rotation2}
      />
    </div>
  )
}
