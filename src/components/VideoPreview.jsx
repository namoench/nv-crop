import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { constrainCircle, FEATHER_PERCENT, buildFilterString } from '../utils/canvasUtils'

const HANDLE_RADIUS = 20
const HANDLE_HIT_RADIUS = 30

export default function VideoPreview({
  videoData,
  circle,
  onCircleChange,
  edgeStyle,
  phosphorColor,
  rotation = 0,
  colorGrading,
}) {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(null)
  const [dragStart, setDragStart] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const { video, width, height, duration } = videoData

  // Calculate rotated dimensions
  const rotatedDims = useMemo(() => {
    const isRotated90or270 = rotation === 90 || rotation === 270
    return {
      width: isRotated90or270 ? height : width,
      height: isRotated90or270 ? width : height,
    }
  }, [width, height, rotation])

  // Calculate display scale
  useEffect(() => {
    if (!containerRef.current) return

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
  }, [rotatedDims])

  // Draw preview frame
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    const displayWidth = rotatedDims.width * scale
    const displayHeight = rotatedDims.height * scale

    canvas.width = displayWidth
    canvas.height = displayHeight

    // Apply color grading filter and rotation, then draw video frame
    ctx.save()
    ctx.filter = buildFilterString(colorGrading)
    ctx.translate(displayWidth / 2, displayHeight / 2)
    ctx.rotate((rotation * Math.PI) / 180)

    const drawWidth = width * scale
    const drawHeight = height * scale
    ctx.drawImage(video, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    ctx.restore()
    ctx.filter = 'none' // Reset filter for overlay drawing

    // Draw darkened overlay outside circle
    const circleX = circle.x * scale
    const circleY = circle.y * scale
    const circleRadius = circle.radius * scale

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

    // Draw resize handle
    const handleAngle = -Math.PI / 4
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
  }, [video, circle, scale, edgeStyle, phosphorColor, rotation, rotatedDims, width, height, colorGrading])

  // Animation loop for live preview
  useEffect(() => {
    const animate = () => {
      drawFrame()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [drawFrame])

  // Update current time display
  useEffect(() => {
    const updateTime = () => {
      if (video) {
        setCurrentTime(video.currentTime)
      }
    }

    const interval = setInterval(updateTime, 100)
    return () => clearInterval(interval)
  }, [video])

  // Handle video play/pause
  const togglePlay = useCallback(() => {
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [video])

  // Handle seek
  const handleSeek = useCallback((e) => {
    const newTime = parseFloat(e.target.value)
    video.currentTime = newTime
    setCurrentTime(newTime)
  }, [video])

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

  // Check if point is near the circle edge
  const isNearEdge = useCallback((x, y) => {
    const dist = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2)
    const edgeThreshold = HANDLE_HIT_RADIUS / scale
    return Math.abs(dist - circle.radius) < edgeThreshold
  }, [circle, scale])

  // Handle pointer start
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
        rotatedDims.width,
        rotatedDims.height
      )
      onCircleChange(newCircle)
    } else if (dragging === 'edge') {
      const dist = Math.sqrt((pos.x - circle.x) ** 2 + (pos.y - circle.y) ** 2)

      const newCircle = constrainCircle(
        { ...circle, radius: dist },
        rotatedDims.width,
        rotatedDims.height
      )
      onCircleChange(newCircle)
    }
  }, [dragging, dragStart, clientToImage, circle, rotatedDims, onCircleChange])

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

  // Format time as mm:ss
  const formatTime = (time) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Canvas preview */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center overflow-hidden"
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

      {/* Playback controls */}
      <div className="px-4 py-3 bg-nv-gray/50 border-t border-gray-800">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {/* Play/Pause button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Time display */}
          <span className="text-gray-400 text-sm w-16 text-center">
            {formatTime(currentTime)}
          </span>

          {/* Seek bar */}
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-nv-green
                     [&::-webkit-slider-thumb]:cursor-pointer"
          />

          {/* Duration display */}
          <span className="text-gray-400 text-sm w-16 text-center">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
