const MODES = [
  {
    value: 'single',
    label: 'Single',
    caption: 'One photo, one circle.',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="7" />
      </svg>
    ),
  },
  {
    value: 'dual',
    label: 'Dual',
    caption: 'Two photos in one frame — stacked or side by side.',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="7.5" cy="12" r="4.5" />
        <circle cx="16.5" cy="12" r="4.5" />
      </svg>
    ),
  },
  {
    value: 'video',
    label: 'Video',
    caption: 'The same circular crop for clips — exports as MP4.',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5.5v13l10-6.5z" />
      </svg>
    ),
  },
]

export default function ModeSelector({ mode, onModeChange }) {
  const current = MODES.find((m) => m.value === mode)

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="flex bg-nv-gray rounded-lg p-1">
        {MODES.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(value)}
            className={`
              flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all
              flex items-center justify-center gap-2
              ${mode === value
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            <span className={mode === value ? 'text-green-400' : ''}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 text-center mt-2.5 min-h-[1rem]">
        {current?.caption}
      </p>
    </div>
  )
}
