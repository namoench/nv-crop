import { useState, useCallback } from 'react'
import ModeSelector from './components/ModeSelector'
import UploadZone from './components/UploadZone'
import DualUploadZone from './components/DualUploadZone'
import CropCanvas from './components/CropCanvas'
import DualCropCanvas from './components/DualCropCanvas'
import Controls from './components/Controls'
import ExportButton from './components/ExportButton'
import { getInitialCircle } from './utils/canvasUtils'
import { revokeImageUrl } from './utils/imageLoader'

export default function App() {
  // Mode: 'single' or 'dual'
  const [mode, setMode] = useState('single')

  // Single mode state
  const [imageData, setImageData] = useState(null)
  const [circle, setCircle] = useState(null)

  // Dual mode state
  const [image1, setImage1] = useState(null)
  const [image2, setImage2] = useState(null)
  const [circle1, setCircle1] = useState(null)
  const [circle2, setCircle2] = useState(null)
  const [sharedRadius, setSharedRadius] = useState(200)
  const [layout, setLayout] = useState('vertical')

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
    setEdgeStyle('hard')
    setPhosphorColor('green')
  }, [imageData])

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
    }
    if (img2 && (!circle2 || img2 !== image2)) {
      const initial = getInitialCircle(img2.width, img2.height)
      setCircle2({ x: initial.x, y: initial.y })
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
    } else {
      if (image1?.url) revokeImageUrl(image1.url)
      if (image2?.url) revokeImageUrl(image2.url)
      setImage1(null)
      setImage2(null)
      setCircle1(null)
      setCircle2(null)
      setSharedRadius(200)
    }
    setEdgeStyle('hard')
    setPhosphorColor('green')
    setLayout('vertical')
  }, [mode, imageData, image1, image2])

  const hasSingleImage = imageData !== null
  const hasBothDualImages = image1 !== null && image2 !== null
  const hasAnyDualImage = image1 !== null || image2 !== null

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
        {/* Mode selector - only show when no images loaded */}
        {!hasSingleImage && !hasAnyDualImage && (
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
                  />
                </div>

                <Controls
                  mode="single"
                  edgeStyle={edgeStyle}
                  onEdgeStyleChange={setEdgeStyle}
                  phosphorColor={phosphorColor}
                  onPhosphorColorChange={setPhosphorColor}
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
                />

                <Controls
                  mode="dual"
                  edgeStyle={edgeStyle}
                  onEdgeStyleChange={setEdgeStyle}
                  phosphorColor={phosphorColor}
                  onPhosphorColorChange={setPhosphorColor}
                  layout={layout}
                  onLayoutChange={setLayout}
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
                      filename={image1.originalName}
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
