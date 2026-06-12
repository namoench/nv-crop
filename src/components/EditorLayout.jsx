import { useState } from 'react'

/**
 * Responsive editor shell: the preview canvas gets the bulk of the viewport.
 * On mobile the settings live in a collapsible bottom sheet (collapsed by
 * default so the image stays large while cropping); on md+ screens they
 * become a fixed right sidebar. The export button is always visible.
 */
export default function EditorLayout({ canvas, controls, exportButton, hint }) {
  const [panelOpen, setPanelOpen] = useState(false)

  return (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row">
      {/* Preview area */}
      <div className="flex-1 min-h-0 flex flex-col p-2 pb-0 md:p-4 md:pb-0">
        {canvas}
        <p className="flex-none text-center text-[11px] text-gray-600 py-1.5 no-select">
          {hint || 'Drag to position · pinch or scroll to resize'}
        </p>
      </div>

      {/* Settings: bottom sheet on mobile, sidebar on desktop */}
      <aside className="flex-none flex flex-col bg-nv-gray border-t border-gray-800 md:w-[340px] md:border-t-0 md:border-l md:bg-nv-gray/60 md:min-h-0">
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
          className="md:hidden relative w-full flex items-center justify-center gap-1.5 pt-3 pb-2 text-xs font-medium uppercase tracking-widest text-gray-400 active:text-white transition-colors"
        >
          <span className="absolute top-1 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-gray-700" />
          Settings
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${panelOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        <div
          className={`
            panel-scroll overflow-y-auto overscroll-contain
            transition-[max-height] duration-300 ease-in-out
            ${panelOpen ? 'max-h-[45dvh]' : 'max-h-0'}
            md:max-h-none md:flex-1
          `}
        >
          {controls}
        </div>

        <div
          className="flex-none px-3 pt-2 md:p-4 md:border-t md:border-gray-800"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {exportButton}
        </div>
      </aside>
    </div>
  )
}
