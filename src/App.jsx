import { useState, useCallback } from 'react'
import { Analytics } from '@vercel/analytics/react'
import ModeSelector from './components/ModeSelector'
import UploadZone from './components/UploadZone'
import DualUploadZone from './components/DualUploadZone'
import VideoUploadZone from './components/VideoUploadZone'
import CropCanvas from './components/CropCanvas'
import DualCropCanvas from './components/DualCropCanvas'
import VideoPreview from './components/VideoPreview'
import Controls from './components/Controls'
import EditorLayout from './components/EditorLayout'
import ExportButton from './components/ExportButton'
import VideoExportButton from './components/VideoExportButton'
import { getInitialCircle, DEFAULT_COLOR_GRADING } from './utils/canvasUtils'
import { revokeImageUrl } from './utils/imageLoader'
import { revokeVideoUrl } from './utils/videoLoader'

// Color grading presets for auto-optimization based on phosphor type
const COLOR_GRADING_PRESETS = {
  green: { brightness: 1, contrast: 1.15, saturation: 0.8 },
  white: { brightness: 1.05, contrast: 1.2, saturation: 0.2 },
}

const HOW_IT_WORKS = [
  {
    title: 'Shoot zoomed in',
    detail: 'Zoom your camera all the way into the tube so the whole frame is night vision.',
  },
  {
    title: 'Frame the circle',
    detail: 'Drag the crop circle over the clean part of the image and pinch to size it.',
  },
  {
    title: 'Export',
    detail: 'Get a 9:16 or 1:1 image on pure black, ready for Stories and Reels.',
  },
]

export default function App() {
  // Mode: 'single', 'dual', or 'video'
  const [mode, setMode] = useState('single')

  // Single mode state
  const [imageData, setImageData] = useState(null)
  const [circle, setCircle] = useState(null)
  const [rotation, setRotation] = useState(0)

  // Dual mode state
  const [image1, setImage1] = useState(null)
  const [image2, setImage2] = useState(null)
  const [circle1, setCircle1] = useState(null)
  const [circle2, setCircle2] = useState(null)
  const [sharedRadius, setSharedRadius] = useState(200)
  const [layout, setLayout] = useState('vertical')
  const [rotation1, setRotation1] = useState(0)
  const [rotation2, setRotation2] = useState(0)

  // Video mode state
  const [videoData, setVideoData] = useState(null)
  const [videoCircle, setVideoCircle] = useState(null)
  const [videoRotation, setVideoRotation] = useState(0)

  // Shared state
  const [edgeStyle, setEdgeStyle] = useState('hard')
  const [phosphorColor, setPhosphorColor] = useState('green')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [colorGrading, setColorGrading] = useState({ ...DEFAULT_COLOR_GRADING })

  // Handler for edge style changes - apply presets when switching to feathered
  const handleEdgeStyleChange = useCallback((newStyle) => {
    setEdgeStyle(newStyle)
    if (newStyle === 'feathered') {
      setColorGrading(prev => ({ ...prev, ...COLOR_GRADING_PRESETS[phosphorColor] }))
    }
  }, [phosphorColor])

  // Handler for phosphor color changes - apply presets when in feathered mode
  const handlePhosphorColorChange = useCallback((newColor) => {
    setPhosphorColor(newColor)
    if (edgeStyle === 'feathered') {
      setColorGrading(prev => ({ ...prev, ...COLOR_GRADING_PRESETS[newColor] }))
    }
  }, [edgeStyle])

  // Single mode handlers
  const handleImageLoaded = useCallback((data) => {
    if (imageData?.url) {
      revokeImageUrl(imageData.url)
    }
    setImageData(data)
    setCircle(getInitialCircle(data.width, data.height))
    setRotation(0)
    setEdgeStyle('hard')
    setPhosphorColor('green')
  }, [imageData])

  // Rotation handler for single mode
  const handleRotate = useCallback((direction) => {
    setRotation(prev => {
      const delta = direction === 'left' ? -90 : 90
      return (prev + delta + 360) % 360
    })
  }, [])

  // Rotation handlers for dual mode
  const handleRotate1 = useCallback((direction) => {
    setRotation1(prev => {
      const delta = direction === 'left' ? -90 : 90
      return (prev + delta + 360) % 360
    })
  }, [])

  const handleRotate2 = useCallback((direction) => {
    setRotation2(prev => {
      const delta = direction === 'left' ? -90 : 90
      return (prev + delta + 360) % 360
    })
  }, [])

  // Video mode handlers
  const handleVideoLoaded = useCallback((data) => {
    if (videoData?.url) {
      revokeVideoUrl(videoData.url)
    }
    setVideoData(data)
    setVideoCircle(getInitialCircle(data.width, data.height))
    setVideoRotation(0)
    setEdgeStyle('hard')
    setPhosphorColor('green')
  }, [videoData])

  const handleVideoRotate = useCallback((direction) => {
    setVideoRotation(prev => {
      const delta = direction === 'left' ? -90 : 90
      return (prev + delta + 360) % 360
    })
  }, [])

  // Dual mode handlers
  const handleDualImagesLoaded = useCallback((img1, img2) => {
    // Clean up old URLs
    if (image1?.url && img1 !== image1) revokeImageUrl(image1.url)
    if (image2?.url && img2 !== image2) revokeImageUrl(image2.url)

    setImage1(img1)
    setImage2(img2)

    // Set initial circles if new images
    if (img1 && (!circle1 || img1 !== image1)) {
      const initial = getInitialCircle(img1.width, img1.height)
      setCircle1({ x: initial.x, y: initial.y })
      setSharedRadius(initial.radius)
      setRotation1(0)
    }
    if (img2 && (!circle2 || img2 !== image2)) {
      const initial = getInitialCircle(img2.width, img2.height)
      setCircle2({ x: initial.x, y: initial.y })
      setRotation2(0)
    }
  }, [image1, image2, circle1, circle2])

  const handleCircle1Change = useCallback((newCircle) => {
    setCircle1(newCircle)
  }, [])

  const handleCircle2Change = useCallback((newCircle) => {
    setCircle2(newCircle)
  }, [])

  // Mode change handler
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode)
  }, [])

  // Reset handler
  const handleReset = useCallback(() => {
    if (mode === 'single') {
      if (imageData?.url) revokeImageUrl(imageData.url)
      setImageData(null)
      setCircle(null)
      setRotation(0)
    } else if (mode === 'dual') {
      if (image1?.url) revokeImageUrl(image1.url)
      if (image2?.url) revokeImageUrl(image2.url)
      setImage1(null)
      setImage2(null)
      setCircle1(null)
      setCircle2(null)
      setSharedRadius(200)
      setRotation1(0)
      setRotation2(0)
    } else if (mode === 'video') {
      if (videoData?.url) revokeVideoUrl(videoData.url)
      setVideoData(null)
      setVideoCircle(null)
      setVideoRotation(0)
    }
    setEdgeStyle('hard')
    setPhosphorColor('green')
    setLayout('vertical')
    setColorGrading({ ...DEFAULT_COLOR_GRADING })
  }, [mode, imageData, image1, image2, videoData])

  const hasSingleImage = imageData !== null
  const hasBothDualImages = image1 !== null && image2 !== null
  const hasAnyDualImage = image1 !== null || image2 !== null
  const hasVideo = videoData !== null

  // Editing = a crop canvas is on screen; lock the app to the viewport so the
  // preview gets all remaining height. Otherwise the page scrolls normally.
  const isEditing =
    (mode === 'single' && hasSingleImage) ||
    (mode === 'dual' && hasBothDualImages) ||
    (mode === 'video' && hasVideo)

  const showLanding = !hasSingleImage && !hasAnyDualImage && !hasVideo

  return (
    <div className={`app-h bg-nv-dark flex flex-col ${isEditing ? 'overflow-hidden' : ''}`}>
      {/* Main content */}
      <main className={`flex-1 min-h-0 flex flex-col ${isEditing ? '' : 'overflow-y-auto'}`}>
        {/* Landing: intro, mode selector */}
        {showLanding && (
          <>
            <div className="max-w-lg mx-auto px-4 pt-8 pb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span
                  aria-hidden="true"
                  className="w-3.5 h-3.5 rounded-full flex-none"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #b9ffb9 0%, #22c55e 45%, #052e10 100%)',
                    boxShadow: '0 0 12px rgba(34, 197, 94, 0.45)',
                  }}
                />
                <h1 className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400">NV Crop</h1>
              </div>
              <h2 className="text-2xl font-bold text-white leading-snug">
                The night-vision look,{' '}
                <span className="text-green-400">cropped clean.</span>
              </h2>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                Shooting through a PVS-14 or another analog tube with your phone?
                Zoom all the way in when you capture, then crop the shot back into
                a perfect circle on black — the clean, centered view through the
                tube that&apos;s nearly impossible to frame in-camera.
              </p>
            </div>
            <ModeSelector mode={mode} onModeChange={handleModeChange} />
          </>
        )}

        {/* Single Mode */}
        {mode === 'single' && (
          !hasSingleImage ? (
            <div className="py-6">
              <UploadZone onImageLoaded={handleImageLoaded} disabled={hasSingleImage} />
            </div>
          ) : (
            <EditorLayout
              canvas={
                <CropCanvas
                  image={imageData.image}
                  circle={circle}
                  onCircleChange={setCircle}
                  edgeStyle={edgeStyle}
                  phosphorColor={phosphorColor}
                  rotation={rotation}
                  colorGrading={colorGrading}
                />
              }
              controls={
                <Controls
                  mode="single"
                  edgeStyle={edgeStyle}
                  onEdgeStyleChange={handleEdgeStyleChange}
                  phosphorColor={phosphorColor}
                  onPhosphorColorChange={handlePhosphorColorChange}
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={setAspectRatio}
                  rotation={rotation}
                  onRotate={handleRotate}
                  imageInfo={{ width: imageData.width, height: imageData.height }}
                  colorGrading={colorGrading}
                  onColorGradingChange={setColorGrading}
                  onReset={handleReset}
                />
              }
              exportButton={
                <ExportButton
                  mode="single"
                  image={imageData.image}
                  circle={circle}
                  edgeStyle={edgeStyle}
                  phosphorColor={phosphorColor}
                  rotation={rotation}
                  aspectRatio={aspectRatio}
                  filename={imageData.originalName}
                  colorGrading={colorGrading}
                />
              }
            />
          )
        )}

        {/* Dual Mode */}
        {mode === 'dual' && (
          !hasBothDualImages ? (
            <div className="py-6">
              <DualUploadZone
                onImagesLoaded={handleDualImagesLoaded}
                image1={image1}
                image2={image2}
              />
            </div>
          ) : (
            <EditorLayout
              canvas={
                <DualCropCanvas
                  image1={image1}
                  image2={image2}
                  circle1={circle1}
                  circle2={circle2}
                  onCircle1Change={handleCircle1Change}
                  onCircle2Change={handleCircle2Change}
                  sharedRadius={sharedRadius}
                  onRadiusChange={setSharedRadius}
                  edgeStyle={edgeStyle}
                  phosphorColor={phosphorColor}
                  layout={layout}
                  rotation1={rotation1}
                  rotation2={rotation2}
                  colorGrading={colorGrading}
                />
              }
              controls={
                <Controls
                  mode="dual"
                  edgeStyle={edgeStyle}
                  onEdgeStyleChange={handleEdgeStyleChange}
                  phosphorColor={phosphorColor}
                  onPhosphorColorChange={handlePhosphorColorChange}
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={setAspectRatio}
                  layout={layout}
                  onLayoutChange={setLayout}
                  rotation1={rotation1}
                  rotation2={rotation2}
                  onRotate1={handleRotate1}
                  onRotate2={handleRotate2}
                  colorGrading={colorGrading}
                  onColorGradingChange={setColorGrading}
                  onReset={handleReset}
                />
              }
              exportButton={
                <ExportButton
                  mode="dual"
                  image1={image1.image}
                  image2={image2.image}
                  circle1={circle1}
                  circle2={circle2}
                  sharedRadius={sharedRadius}
                  layout={layout}
                  edgeStyle={edgeStyle}
                  phosphorColor={phosphorColor}
                  rotation1={rotation1}
                  rotation2={rotation2}
                  aspectRatio={aspectRatio}
                  filename={image1.originalName}
                  colorGrading={colorGrading}
                />
              }
            />
          )
        )}

        {/* Video Mode */}
        {mode === 'video' && (
          !hasVideo ? (
            <div className="py-6">
              <VideoUploadZone onVideoLoaded={handleVideoLoaded} disabled={hasVideo} />
            </div>
          ) : (
            <EditorLayout
              canvas={
                <VideoPreview
                  videoData={videoData}
                  circle={videoCircle}
                  onCircleChange={setVideoCircle}
                  edgeStyle={edgeStyle}
                  phosphorColor={phosphorColor}
                  rotation={videoRotation}
                  colorGrading={colorGrading}
                />
              }
              controls={
                <Controls
                  mode="single"
                  edgeStyle={edgeStyle}
                  onEdgeStyleChange={handleEdgeStyleChange}
                  phosphorColor={phosphorColor}
                  onPhosphorColorChange={handlePhosphorColorChange}
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={setAspectRatio}
                  rotation={videoRotation}
                  onRotate={handleVideoRotate}
                  imageInfo={{ width: videoData.width, height: videoData.height }}
                  colorGrading={colorGrading}
                  onColorGradingChange={setColorGrading}
                  onReset={handleReset}
                />
              }
              exportButton={
                <VideoExportButton
                  videoData={videoData}
                  circle={videoCircle}
                  edgeStyle={edgeStyle}
                  phosphorColor={phosphorColor}
                  rotation={videoRotation}
                  aspectRatio={aspectRatio}
                  colorGrading={colorGrading}
                />
              }
            />
          )
        )}

        {/* Landing: how it works + privacy notes */}
        {showLanding && (
          <div className="max-w-lg mx-auto px-4 mt-10 pb-10 w-full">
            {/* How it works */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {HOW_IT_WORKS.map(({ title, detail }, i) => (
                <div key={title} className="flex flex-col items-center gap-2">
                  <span className="w-7 h-7 rounded-full border border-green-500/40 text-green-400 text-sm font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-300 font-medium leading-tight">{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>

            {/* Privacy & performance info */}
            <div className="text-xs text-gray-500 space-y-3 mt-10 pt-6 border-t border-gray-800/80">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-nv-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p>
                  <span className="text-gray-400 font-medium">100% Private.</span> This app runs entirely in your browser. Your photos and videos never leave your device and are not uploaded to any server.
                </p>
              </div>
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p>
                  <span className="text-gray-400 font-medium">Performance varies by device.</span> Processing happens locally, so speed depends on your device&apos;s capabilities.
                </p>
              </div>
              {mode === 'video' && (
                <div className="flex gap-2">
                  <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p>
                    <span className="text-yellow-500 font-medium">Chrome users:</span> Chrome&apos;s aggressive memory management can cause video processing to fail or run slowly. Safari or Firefox may work better for video.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Analytics />
    </div>
  )
}
