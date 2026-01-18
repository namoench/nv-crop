import { useState, useCallback } from 'react'
import UploadZone from './components/UploadZone'
import CropCanvas from './components/CropCanvas'
import Controls from './components/Controls'
import ExportButton from './components/ExportButton'
import { getInitialCircle } from './utils/canvasUtils'
import { revokeImageUrl } from './utils/imageLoader'

export default function App() {
  const [imageData, setImageData] = useState(null)
  const [circle, setCircle] = useState(null)
  const [edgeStyle, setEdgeStyle] = useState('hard')
  const [phosphorColor, setPhosphorColor] = useState('green')

  const handleImageLoaded = useCallback((data) => {
    // Clean up previous image URL
    if (imageData?.url) {
      revokeImageUrl(imageData.url)
    }

    setImageData(data)
    setCircle(getInitialCircle(data.width, data.height))
    setEdgeStyle('hard')
    setPhosphorColor('green')
  }, [imageData])

  const handleReset = useCallback(() => {
    if (imageData?.url) {
      revokeImageUrl(imageData.url)
    }
    setImageData(null)
    setCircle(null)
    setEdgeStyle('hard')
    setPhosphorColor('green')
  }, [imageData])

  const hasImage = imageData !== null

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
        {!hasImage ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <UploadZone onImageLoaded={handleImageLoaded} disabled={hasImage} />
          </div>
        ) : (
          <>
            {/* Preview area */}
            <div className="flex-1 min-h-0 p-4 flex flex-col">
              <CropCanvas
                image={imageData.image}
                circle={circle}
                onCircleChange={setCircle}
                edgeStyle={edgeStyle}
                phosphorColor={phosphorColor}
              />
            </div>

            {/* Controls */}
            <Controls
              edgeStyle={edgeStyle}
              onEdgeStyleChange={setEdgeStyle}
              phosphorColor={phosphorColor}
              onPhosphorColorChange={setPhosphorColor}
              imageInfo={{ width: imageData.width, height: imageData.height }}
              onReset={handleReset}
            />

            {/* Export button */}
            <div className="px-4 pb-6 pt-2 bg-nv-gray/80">
              <div className="max-w-lg mx-auto">
                <ExportButton
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
      </main>
    </div>
  )
}
