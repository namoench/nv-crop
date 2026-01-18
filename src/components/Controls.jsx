export default function Controls({
  edgeStyle,
  onEdgeStyleChange,
  phosphorColor,
  onPhosphorColorChange,
  imageInfo,
  onReset,
}) {
  return (
    <div className="w-full px-4 py-3 bg-nv-gray/80 border-t border-gray-800">
      <div className="max-w-lg mx-auto space-y-3">
        {/* Image dimensions */}
        {imageInfo && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Source: {imageInfo.width} × {imageInfo.height}</span>
            <span>Output: 1080 × 1920</span>
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
