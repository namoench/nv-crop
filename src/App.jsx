import { useState, useCallback } from 'react'
import ModeSelector from './components/ModeSelector'
import UploadZone from './components/UploadZone'
import DualUploadZone from './components/DualUploadZone'
import VideoUploadZone from './components/VideoUploadZone'
import CropCanvas from './components/CropCanvas'
import DualCropCanvas from './components/DualCropCanvas'
import VideoPreview from './components/VideoPreview'
import Controls from './components/Controls'
import ExportButton from './components/ExportButton'
import VideoExportButton from './components/VideoExportButton'
import { getInitialCircle } from './utils/canvasUtils'
import { revokeImageUrl } from './utils/imageLoader'
import { revokeVideoUrl } from './utils/videoLoader'

export default function App() {
  // Mode: 'single' or 'dual'
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
  }, [mode, imageData, image1, image2, videoData])

  const hasSingleImage = imageData !== null
  const hasBothDualImages = image1 !== null && image2 !== null
  const hasAnyDualImage = image1 !== null || image2 !== null
  const hasVideo = videoData !== null

  return (
    <div className="min-h-screen bg-nv-dark flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-center text-white">
          NV Crop
        </h1>
        <p className="text-xs text-gray-500 text-center mt-1">
          Night Vision Photo Cropper
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Mode selector - only show when no images/video loaded */}
        {!hasSingleImage && !hasAnyDualImage && !hasVideo && (
          <div className="pt-6">
            <ModeSelector mode={mode} onModeChange={handleModeChange} />
          </div>
        )}

        {/* Single Mode */}
        {mode === 'single' && (
          <>
            {!hasSingleImage ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <UploadZone onImageLoaded={handleImageLoaded} disabled={hasSingleImage} />
              </div>
            ) : (
              <>
                <div className="flex-1 min-h-0 p-4 flex flex-col">
                  <CropCanvas
                    image={imageData.image}
                    circle={circle}
                    onCircleChange={setCircle}
                    edgeStyle={edgeStyle}
                    phosphorColor={phosphorColor}
                    rotation={rotation}
                  />
                </div>

                <Controls
                  mode="single"
                  edgeStyle={edgeStyle}
                  onEdgeStyleChange={setEdgeStyle}
                  phosphorColor={phosphorColor}
                  onPhosphorColorChange={setPhosphorColor}
                  rotation={rotation}
                  onRotate={handleRotate}
                  imageInfo={{ width: imageData.width, height: imageData.height }}
                  onReset={handleReset}
                />

                <div className="px-4 pb-6 pt-2 bg-nv-gray/80">
                  <div className="max-w-lg mx-auto">
                    <ExportButton
                      mode="single"
                      image={imageData.image}
                      circle={circle}
                      edgeStyle={edgeStyle}
                      phosphorColor={phosphorColor}
                      rotation={rotation}
                      filename={imageData.originalName}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Dual Mode */}
        {mode === 'dual' && (
          <>
            {!hasBothDualImages ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <DualUploadZone
                  onImagesLoaded={handleDualImagesLoaded}
                  image1={image1}
                  image2={image2}
                />
              </div>
            ) : (
              <>
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
                />

                <Controls
                  mode="dual"
                  edgeStyle={edgeStyle}
                  onEdgeStyleChange={setEdgeStyle}
                  phosphorColor={phosphorColor}
                  onPhosphorColorChange={setPhosphorColor}
                  layout={layout}
                  onLayoutChange={setLayout}
                  rotation1={rotation1}
                  rotation2={rotation2}
                  onRotate1={handleRotate1}
                  onRotate2={handleRotate2}
                  onReset={handleReset}
                />

                <div className="px-4 pb-6 pt-2 bg-nv-gray/80">
                  <div className="max-w-lg mx-auto">
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
                      filename={image1.originalName}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Video Mode */}
        {mode === 'video' && (
          <>
            {!hasVideo ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <VideoUploadZone onVideoLoaded={handleVideoLoaded} disabled={hasVideo} />
              </div>
            ) : (
              <>
                <div className="flex-1 min-h-0 p-4 flex flex-col">
                  <VideoPreview
                    videoData={videoData}
                    circle={videoCircle}
                    onCircleChange={setVideoCircle}
                    edgeStyle={edgeStyle}
                    phosphorColor={phosphorColor}
                    rotation={videoRotation}
                  />
                </div>

                <Controls
                  mode="single"
                  edgeStyle={edgeStyle}
                  onEdgeStyleChange={setEdgeStyle}
                  phosphorColor={phosphorColor}
                  onPhosphorColorChange={setPhosphorColor}
                  rotation={videoRotation}
                  onRotate={handleVideoRotate}
                  imageInfo={{ width: videoData.width, height: videoData.height }}
                  onReset={handleReset}
                />

                <div className="px-4 pb-6 pt-2 bg-nv-gray/80">
                  <div className="max-w-lg mx-auto">
                    <VideoExportButton
                      videoData={videoData}
                      circle={videoCircle}
                      edgeStyle={edgeStyle}
                      phosphorColor={phosphorColor}
                      rotation={videoRotation}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
