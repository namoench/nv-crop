export default function Controls({
  mode,
  edgeStyle,
  onEdgeStyleChange,
  phosphorColor,
  onPhosphorColorChange,
  layout,
  onLayoutChange,
  rotation,
  onRotate,
  rotation1,
  rotation2,
  onRotate1,
  onRotate2,
  imageInfo,
  onReset,
}) {
  return (
    <div className="w-full px-4 py-3 bg-nv-gray/80 border-t border-gray-800">
      <div className="max-w-lg mx-auto space-y-3">
        {/* Image dimensions - only show for single mode */}
        {imageInfo && mode === 'single' && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Source: {imageInfo.width} × {imageInfo.height}</span>
            <span>Output: 1080 × 1920</span>
          </div>
        )}

        {/* Rotation controls - single mode */}
        {mode === 'single' && onRotate && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-12">Rotate:</span>
            <div className="flex gap-2 flex-1">
              <button
                type="button"
                onClick={() => onRotate('left')}
                className="flex-1 py-2 px-3 rounded-lg bg-nv-dark text-gray-400 hover:text-white hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
                </svg>
                90° Left
              </button>
              <button
                type="button"
                onClick={() => onRotate('right')}
                className="flex-1 py-2 px-3 rounded-lg bg-nv-dark text-gray-400 hover:text-white hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'scaleX(-1)' }}>
                  <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
                </svg>
                90° Right
              </button>
            </div>
          </div>
        )}

        {/* Rotation controls - dual mode */}
        {mode === 'dual' && (onRotate1 || onRotate2) && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-12">Rotate:</span>
            <div className="flex gap-2 flex-1">
              <button
                type="button"
                onClick={() => onRotate1('left')}
                className="flex-1 py-2 px-2 rounded-lg bg-nv-dark text-gray-400 hover:text-white hover:bg-gray-700 transition-all flex items-center justify-center gap-1 text-xs"
                title="Rotate image 1 left"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
                </svg>
                1
              </button>
              <button
                type="button"
                onClick={() => onRotate1('right')}
                className="flex-1 py-2 px-2 rounded-lg bg-nv-dark text-gray-400 hover:text-white hover:bg-gray-700 transition-all flex items-center justify-center gap-1 text-xs"
                title="Rotate image 1 right"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'scaleX(-1)' }}>
                  <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
                </svg>
                1
              </button>
              <div className="w-px bg-gray-700" />
              <button
                type="button"
                onClick={() => onRotate2('left')}
                className="flex-1 py-2 px-2 rounded-lg bg-nv-dark text-gray-400 hover:text-white hover:bg-gray-700 transition-all flex items-center justify-center gap-1 text-xs"
                title="Rotate image 2 left"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
                </svg>
                2
              </button>
              <button
                type="button"
                onClick={() => onRotate2('right')}
                className="flex-1 py-2 px-2 rounded-lg bg-nv-dark text-gray-400 hover:text-white hover:bg-gray-700 transition-all flex items-center justify-center gap-1 text-xs"
                title="Rotate image 2 right"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'scaleX(-1)' }}>
                  <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
                </svg>
                2
              </button>
            </div>
          </div>
        )}

        {/* Layout toggle - only for dual mode */}
        {mode === 'dual' && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-12">Layout:</span>
            <div className="flex bg-nv-dark rounded-lg p-1 flex-1">
              <button
                type="button"
                onClick={() => onLayoutChange('vertical')}
                className={`
                  flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
                  ${layout === 'vertical'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="7" r="5" />
                  <circle cx="12" cy="17" r="5" />
                </svg>
                Stack
              </button>
              <button
                type="button"
                onClick={() => onLayoutChange('horizontal')}
                className={`
                  flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
                  ${layout === 'horizontal'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="7" cy="12" r="5" />
                  <circle cx="17" cy="12" r="5" />
                </svg>
                Side
              </button>
            </div>
          </div>
        )}

        {/* Edge style toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 w-12">Edge:</span>
          <div className="flex bg-nv-dark rounded-lg p-1 flex-1">
            <button
              type="button"
              onClick={() => onEdgeStyleChange('hard')}
              className={`
                flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all
                ${edgeStyle === 'hard'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
                }
              `}
            >
              Hard
            </button>
            <button
              type="button"
              onClick={() => onEdgeStyleChange('feathered')}
              className={`
                flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all
                ${edgeStyle === 'feathered'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
                }
              `}
            >
              Feathered
            </button>
          </div>
        </div>

        {/* Phosphor color toggle - only show when feathered */}
        {edgeStyle === 'feathered' && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-12">Tube:</span>
            <div className="flex bg-nv-dark rounded-lg p-1 flex-1">
              <button
                type="button"
                onClick={() => onPhosphorColorChange('green')}
                className={`
                  flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
                  ${phosphorColor === 'green'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Green
              </button>
              <button
                type="button"
                onClick={() => onPhosphorColorChange('white')}
                className={`
                  flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
                  ${phosphorColor === 'white'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <span className="w-2 h-2 rounded-full bg-gray-200" />
                White
              </button>
            </div>
          </div>
        )}

        {/* Reset button */}
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}
