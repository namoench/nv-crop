import { useCallback, useState, useRef } from 'react'
import { processVideo, downloadVideo, revokeProcessedVideoUrl } from '../utils/videoProcessor'

export default function VideoExportButton({
  videoData,
  circle,
  edgeStyle,
  phosphorColor,
  rotation = 0,
  aspectRatio = '9:16',
}) {
  const [state, setState] = useState('idle') // 'idle' | 'processing' | 'complete' | 'error'
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [outputUrl, setOutputUrl] = useState(null)
  const [error, setError] = useState(null)
  const abortRef = useRef(false)

  const handleProcess = useCallback(async () => {
    if (state === 'processing' || !videoData) return

    setState('processing')
    setProgress(0)
    setStatusMessage('Starting...')
    setError(null)
    abortRef.current = false

    // Clean up previous output
    if (outputUrl) {
      revokeProcessedVideoUrl(outputUrl)
      setOutputUrl(null)
    }

    try {
      const url = await processVideo(
        videoData,
        circle,
        edgeStyle,
        phosphorColor,
        rotation,
        aspectRatio,
        (progressPercent, message) => {
          if (abortRef.current) return
          setProgress(progressPercent)
          setStatusMessage(message || '')
        }
      )

      if (abortRef.current) {
        revokeProcessedVideoUrl(url)
        setState('idle')
        return
      }

      setOutputUrl(url)
      setState('complete')
    } catch (err) {
      console.error('Video processing failed:', err)
      setError(err.message || 'Video processing failed. Please try again.')
      setState('error')
    }
  }, [videoData, circle, edgeStyle, phosphorColor, rotation, state, outputUrl])

  const handleDownload = useCallback(() => {
    if (outputUrl && videoData) {
      downloadVideo(outputUrl, videoData.originalName)
    }
  }, [outputUrl, videoData])

  const handleReset = useCallback(() => {
    if (outputUrl) {
      revokeProcessedVideoUrl(outputUrl)
    }
    setOutputUrl(null)
    setState('idle')
    setProgress(0)
    setStatusMessage('')
    setError(null)
  }, [outputUrl])

  const handleCancel = useCallback(() => {
    abortRef.current = true
    setState('idle')
    setProgress(0)
    setStatusMessage('')
  }, [])

  const isDisabled = !videoData

  // Processing state - show progress
  if (state === 'processing') {
    return (
      <div className="w-full">
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">{statusMessage}</span>
            <span className="text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-nv-green transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="w-full py-3 px-6 rounded-xl font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  // Complete state - show download button
  if (state === 'complete' && outputUrl) {
    return (
      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-nv-green text-black hover:bg-green-400 active:scale-[0.98] transition-all duration-200"
        >
          Download Video
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="w-full py-2 px-6 rounded-lg font-medium text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          Process Again
        </button>
      </div>
    )
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="w-full space-y-3">
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="w-full py-3 px-6 rounded-xl font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Idle state - show process button
  return (
    <div className="w-full">
      {videoData && videoData.duration > 30 && (
        <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400 text-sm">
          Long video detected ({Math.round(videoData.duration)}s). Processing may take a while.
        </div>
      )}
      <button
        type="button"
        onClick={handleProcess}
        disabled={isDisabled}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-200
          ${!isDisabled
            ? 'bg-nv-green text-black hover:bg-green-400 active:scale-[0.98]'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        Process Video
      </button>
    </div>
  )
}
