import { useRef, useState, useCallback } from 'react'
import { loadImage, isSupportedFormat } from '../utils/imageLoader'

function UploadBox({ label, imageData, onImageLoaded, isLoading, loadingMessage, error }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    onImageLoaded(file)
  }, [onImageLoaded])

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
    e.target.value = ''
  }, [handleFile])

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const hasImage = imageData !== null

  return (
    <div className="flex-1">
      <p className="text-xs text-gray-500 text-center mb-2">{label}</p>
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-4
          transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center
          min-h-[120px]
          ${isDragging
            ? 'border-nv-green bg-nv-green/10'
            : hasImage
              ? 'border-green-600 bg-green-900/20'
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
          accept=".jpg,.jpeg,.png,.heic,.heif,.dng,image/jpeg,image/png,image/heic,image/heif,image/dng,image/x-adobe-dng"
          onChange={handleInputChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-600 border-t-nv-green rounded-full animate-spin" />
            <p className="text-gray-400 text-xs">{loadingMessage}</p>
          </div>
        ) : hasImage ? (
          <div className="flex flex-col items-center gap-1">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-gray-400 text-xs">Tap to change</p>
          </div>
        ) : (
          <>
            <svg
              className={`w-8 h-8 mb-2 ${isDragging ? 'text-nv-green' : 'text-gray-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-gray-500 text-xs">Add image</p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-2 text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}

export default function DualUploadZone({ onImagesLoaded, image1, image2 }) {
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [message1, setMessage1] = useState('')
  const [message2, setMessage2] = useState('')
  const [error1, setError1] = useState(null)
  const [error2, setError2] = useState(null)

  const handleImage1 = useCallback(async (file) => {
    setError1(null)
    setLoading1(true)
    setMessage1('Loading...')
    try {
      const data = await loadImage(file, (msg) => setMessage1(msg))
      onImagesLoaded(data, image2)
    } catch (err) {
      setError1(err.message)
    } finally {
      setLoading1(false)
      setMessage1('')
    }
  }, [onImagesLoaded, image2])

  const handleImage2 = useCallback(async (file) => {
    setError2(null)
    setLoading2(true)
    setMessage2('Loading...')
    try {
      const data = await loadImage(file, (msg) => setMessage2(msg))
      onImagesLoaded(image1, data)
    } catch (err) {
      setError2(err.message)
    } finally {
      setLoading2(false)
      setMessage2('')
    }
  }, [onImagesLoaded, image1])

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="flex gap-4">
        <UploadBox
          label="Top / Left"
          imageData={image1}
          onImageLoaded={handleImage1}
          isLoading={loading1}
          loadingMessage={message1}
          error={error1}
        />
        <UploadBox
          label="Bottom / Right"
          imageData={image2}
          onImageLoaded={handleImage2}
          isLoading={loading2}
          loadingMessage={message2}
          error={error2}
        />
      </div>
    </div>
  )
}
