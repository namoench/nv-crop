import { useCallback, useState } from 'react'
import { renderCroppedImage, exportCanvas } from '../utils/canvasUtils'

export default function ExportButton({ image, circle, edgeStyle, phosphorColor, filename }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(() => {
    if (!image || isExporting) return

    setIsExporting(true)

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas')
        renderCroppedImage(canvas, image, circle, edgeStyle, phosphorColor)
        exportCanvas(canvas, filename, 'png')
      } catch (error) {
        console.error('Export failed:', error)
        alert('Failed to export image. Please try again.')
      } finally {
        setIsExporting(false)
      }
    }, 50)
  }, [image, circle, edgeStyle, phosphorColor, filename, isExporting])

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!image || isExporting}
      className={`
        w-full py-4 px-6 rounded-xl font-semibold text-lg
        transition-all duration-200
        ${image && !isExporting
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
