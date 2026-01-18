import { useRef, useEffect, useState, useCallback } from 'react'
import { constrainCircle, FEATHER_PERCENT } from '../utils/canvasUtils'

const HANDLE_RADIUS = 20 // Touch-friendly handle size
const HANDLE_HIT_RADIUS = 30 // Larger hit area for touch

export default function CropCanvas({ image, circle, onCircleChange, edgeStyle, phosphorColor }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(null) // 'center' or 'edge'
  const [dragStart, setDragStart] = useState(null)

  // Calculate display scale to fit image in container
  useEffect(() => {
    if (!containerRef.current || !image) return

    const updateScale = () => {
      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      const scaleX = containerWidth / image.width
      const scaleY = containerHeight / image.height
      const newScale = Math.min(scaleX, scaleY, 1) // Don't scale up

      setScale(newScale)
      setOffset({
        x: (containerWidth - image.width * newScale) / 2,
        y: (containerHeight - image.height * newScale) / 2,
      })
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [image])

  // Draw the preview
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    const displayWidth = image.width * scale
    const displayHeight = image.height * scale

    canvas.width = displayWidth
    canvas.height = displayHeight

    // Draw image
    ctx.drawImage(image, 0, 0, displayWidth, displayHeight)

    // Draw darkened overlay outside circle
    const circleX = circle.x * scale
    const circleY = circle.y * scale
    const circleRadius = circle.radius * scale

    // Create a path for the darkened area (inverse of circle)
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.beginPath()
    ctx.rect(0, 0, displayWidth, displayHeight)
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2, true)
    ctx.fill()
    ctx.restore()

    // Draw circle border
    ctx.save()

    if (edgeStyle === 'feathered') {
      // Show thin glow preview at edge based on phosphor color
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

      // Thin border in matching color
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

    // Draw resize handle
    const handleAngle = -Math.PI / 4 // Top-right
    const handleX = circleX + Math.cos(handleAngle) * circleRadius
    const handleY = circleY + Math.sin(handleAngle) * circleRadius

    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(handleX, handleY, HANDLE_RADIUS * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // Draw center indicator
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.arc(circleX, circleY, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

  }, [image, circle, scale, edgeStyle, phosphorColor])

  // Convert client coordinates to image coordinates
  const clientToImage = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left) / scale
    const y = (clientY - rect.top) / scale

    return { x, y }
  }, [scale])

  // Check if point is near the resize handle
  const isNearHandle = useCallback((x, y) => {
    const handleAngle = -Math.PI / 4
    const handleX = circle.x + Math.cos(handleAngle) * circle.radius
    const handleY = circle.y + Math.sin(handleAngle) * circle.radius

    const dist = Math.sqrt((x - handleX) ** 2 + (y - handleY) ** 2)
    return dist < HANDLE_HIT_RADIUS / scale
  }, [circle, scale])

  // Check if point is inside circle
  const isInsideCircle = useCallback((x, y) => {
    const dist = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2)
    return dist < circle.radius
  }, [circle])

  // Check if point is near the circle edge (for resize)
  const isNearEdge = useCallback((x, y) => {
    const dist = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2)
    const edgeThreshold = HANDLE_HIT_RADIUS / scale
    return Math.abs(dist - circle.radius) < edgeThreshold
  }, [circle, scale])

  // Handle pointer start (mouse or touch)
  const handlePointerStart = useCallback((x, y) => {
    const pos = clientToImage(x, y)

    if (isNearHandle(pos.x, pos.y) || isNearEdge(pos.x, pos.y)) {
      setDragging('edge')
      setDragStart({ x: pos.x, y: pos.y, startRadius: circle.radius })
    } else if (isInsideCircle(pos.x, pos.y)) {
      setDragging('center')
      setDragStart({ x: pos.x, y: pos.y, startX: circle.x, startY: circle.y })
    }
  }, [clientToImage, isNearHandle, isNearEdge, isInsideCircle, circle])

  // Handle pointer move
  const handlePointerMove = useCallback((x, y) => {
    if (!dragging || !dragStart) return

    const pos = clientToImage(x, y)

    if (dragging === 'center') {
      const dx = pos.x - dragStart.x
      const dy = pos.y - dragStart.y

      const newCircle = constrainCircle(
        {
          x: dragStart.startX + dx,
          y: dragStart.startY + dy,
          radius: circle.radius,
        },
        image.width,
        image.height
      )
      onCircleChange(newCircle)
    } else if (dragging === 'edge') {
      const dist = Math.sqrt((pos.x - circle.x) ** 2 + (pos.y - circle.y) ** 2)

      const newCircle = constrainCircle(
        { ...circle, radius: dist },
        image.width,
        image.height
      )
      onCircleChange(newCircle)
    }
  }, [dragging, dragStart, clientToImage, circle, image, onCircleChange])

  // Handle pointer end
  const handlePointerEnd = useCallback(() => {
    setDragging(null)
    setDragStart(null)
  }, [])

  // Mouse events
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

  // Touch events
  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handlePointerStart(touch.clientX, touch.clientY)
    }
  }, [handlePointerStart])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handlePointerMove(touch.clientX, touch.clientY)
    }
  }, [handlePointerMove])

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    handlePointerEnd()
  }, [handlePointerEnd])

  // Add global mouse listeners when dragging
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
    <div
      ref={containerRef}
      className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className={`touch-canvas no-select ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  )
}
