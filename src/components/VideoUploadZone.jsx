import { useRef, useState, useCallback } from 'react'
import { loadVideo, isSupportedVideoFormat } from '../utils/videoLoader'

export default function VideoUploadZone({ onVideoLoaded, disabled }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return

    setError(null)
    setIsLoading(true)
    setLoadingMessage('Loading video...')

    try {
      const videoData = await loadVideo(file, (msg) => {
        setLoadingMessage(msg)
      })
      onVideoLoaded(videoData)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }, [onVideoLoaded])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [handleFile])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  if (disabled) return null

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center
          min-h-[200px]
          ${isDragging
            ? 'border-nv-green bg-nv-green/10'
            : 'border-gray-600 hover:border-gray-500 bg-nv-gray/50'
          }
          ${isLoading ? 'pointer-events-none opacity-75' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
          onChange={handleInputChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-gray-600 border-t-nv-green rounded-full animate-spin"
                 style={{ borderWidth: '3px' }} />
            <p className="text-gray-400 text-sm">{loadingMessage}</p>
          </div>
        ) : (
          <>
            <svg
              className={`w-12 h-12 mb-4 ${isDragging ? 'text-nv-green' : 'text-gray-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-white font-medium mb-1">
              {isDragging ? 'Drop video here' : 'Drop video or tap to upload'}
            </p>
            <p className="text-gray-500 text-sm">
              MP4, WebM, MOV (max 60 seconds)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
