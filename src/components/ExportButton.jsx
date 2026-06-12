import { useCallback, useState } from 'react'
import { renderCroppedImage, renderDualCroppedImage, exportCanvas, DEFAULT_TRANSFORM } from '../utils/canvasUtils'

export default function ExportButton({
  mode = 'single',
  // Single mode props
  image,
  circle,
  transform = DEFAULT_TRANSFORM,
  // Dual mode props
  image1,
  image2,
  circle1,
  circle2,
  sharedRadius,
  layout,
  transform1 = DEFAULT_TRANSFORM,
  transform2 = DEFAULT_TRANSFORM,
  // Shared props
  edgeStyle,
  phosphorColor,
  aspectRatio = '9:16',
  filename,
  colorGrading
}) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(() => {
    if (isExporting) return
    if (mode === 'single' && !image) return
    if (mode === 'dual' && (!image1 || !image2)) return

    setIsExporting(true)

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas')

        if (mode === 'single') {
          renderCroppedImage(canvas, image, circle, edgeStyle, phosphorColor, transform, aspectRatio, colorGrading)
        } else {
          renderDualCroppedImage(canvas, image1, image2, circle1, circle2, sharedRadius, layout, edgeStyle, phosphorColor, transform1, transform2, aspectRatio, colorGrading)
        }

        const suffix = mode === 'dual' ? '-dual' : ''
        exportCanvas(canvas, `${filename}${suffix}`, 'png')
      } catch (error) {
        console.error('Export failed:', error)
        alert('Failed to export image. Please try again.')
      } finally {
        setIsExporting(false)
      }
    }, 50)
  }, [mode, image, circle, transform, image1, image2, circle1, circle2, sharedRadius, layout, transform1, transform2, edgeStyle, phosphorColor, aspectRatio, filename, isExporting, colorGrading])

  const isDisabled = mode === 'single' ? !image : (!image1 || !image2)

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isDisabled || isExporting}
      className={`
        w-full py-4 px-6 rounded-xl font-semibold text-lg
        transition-all duration-200
        ${!isDisabled && !isExporting
          ? 'bg-nv-green text-black hover:bg-green-400 active:scale-[0.98]'
          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }
      `}
    >
      {isExporting ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-gray-500 border-t-black rounded-full animate-spin" />
          Exporting...
        </span>
      ) : (
        'Download'
      )}
    </button>
  )
}
