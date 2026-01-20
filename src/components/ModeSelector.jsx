export default function ModeSelector({ mode, onModeChange }) {
  return (
    <div className="w-full max-w-lg mx-auto px-4 mb-6">
      <div className="flex bg-nv-gray rounded-lg p-1">
        <button
          type="button"
          onClick={() => onModeChange('single')}
          className={`
            flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all
            ${mode === 'single'
              ? 'bg-gray-700 text-white'
              : 'text-gray-500 hover:text-gray-300'
            }
          `}
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => onModeChange('dual')}
          className={`
            flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all
            ${mode === 'dual'
              ? 'bg-gray-700 text-white'
              : 'text-gray-500 hover:text-gray-300'
            }
          `}
        >
          Dual
        </button>
        <button
          type="button"
          onClick={() => onModeChange('video')}
          className={`
            flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all
            ${mode === 'video'
              ? 'bg-gray-700 text-white'
              : 'text-gray-500 hover:text-gray-300'
            }
          `}
        >
          Video
        </button>
      </div>
    </div>
  )
}
