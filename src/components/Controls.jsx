import { ASPECT_RATIOS, DEFAULT_COLOR_GRADING } from '../utils/canvasUtils'

const SLIDER_CLASS = `flex-1 h-2 bg-gray-700 rounded-full cursor-pointer
  [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:w-5
  [&::-webkit-slider-thumb]:h-5
  [&::-webkit-slider-thumb]:rounded-full
  [&::-webkit-slider-thumb]:bg-nv-green
  [&::-webkit-slider-thumb]:border-2
  [&::-webkit-slider-thumb]:border-white
  [&::-webkit-slider-thumb]:shadow-md
  [&::-webkit-slider-thumb]:cursor-pointer
  [&::-moz-range-thumb]:w-5
  [&::-moz-range-thumb]:h-5
  [&::-moz-range-thumb]:rounded-full
  [&::-moz-range-thumb]:bg-nv-green
  [&::-moz-range-thumb]:border-2
  [&::-moz-range-thumb]:border-white
  [&::-moz-range-thumb]:cursor-pointer`

const SEG_ACTIVE = 'bg-green-500/15 text-green-300 shadow-[inset_0_0_0_1px_rgba(74,222,128,0.3)]'
const SEG_IDLE = 'text-gray-500 hover:text-gray-300'

function Section({ title, action, children }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500 uppercase tracking-widest font-medium">{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-20 flex-none">{label}</span>
      {children}
    </div>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex bg-nv-dark rounded-lg p-1 flex-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 py-2 px-2 rounded-md text-sm font-medium transition-all
            flex items-center justify-center gap-2
            ${value === opt.value ? SEG_ACTIVE : SEG_IDLE}
          `}
        >
          {opt.dot && <span className={`w-2 h-2 rounded-full ${opt.dot}`} />}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function RotateButton({ onClick, direction, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex-1 py-2 px-2 rounded-lg bg-nv-dark text-gray-400 hover:text-white hover:bg-gray-700 active:bg-gray-700 transition-all flex items-center justify-center gap-1.5 text-sm"
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={direction === 'right' ? { transform: 'scaleX(-1)' } : undefined}
      >
        <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
      </svg>
      {children}
    </button>
  )
}

function GradingSlider({ label, min, max, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-20 flex-none">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ WebkitAppearance: 'none', touchAction: 'manipulation' }}
        className={SLIDER_CLASS}
      />
      <span className="text-xs text-gray-500 w-12 text-right tabular-nums">{Math.round(value * 100)}%</span>
    </div>
  )
}

export default function Controls({
  mode,
  edgeStyle,
  onEdgeStyleChange,
  phosphorColor,
  onPhosphorColorChange,
  aspectRatio,
  onAspectRatioChange,
  layout,
  onLayoutChange,
  onRotate,
  onRotate1,
  onRotate2,
  imageInfo,
  colorGrading,
  onColorGradingChange,
  onReset,
}) {
  const currentAspect = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['9:16']

  return (
    <div className="px-4 py-4 space-y-5 max-w-lg mx-auto md:max-w-none">
      {/* Image dimensions */}
      {imageInfo && (
        <div className="flex justify-between text-xs text-gray-500 tabular-nums">
          <span>Source: {imageInfo.width} × {imageInfo.height}</span>
          <span>Output: {currentAspect.width} × {currentAspect.height}</span>
        </div>
      )}

      <Section title="Frame">
        {/* Rotation - single mode */}
        {mode === 'single' && onRotate && (
          <Row label="Rotate">
            <div className="flex gap-2 flex-1">
              <RotateButton onClick={() => onRotate('left')} direction="left">90° Left</RotateButton>
              <RotateButton onClick={() => onRotate('right')} direction="right">90° Right</RotateButton>
            </div>
          </Row>
        )}

        {/* Rotation - dual mode */}
        {mode === 'dual' && (onRotate1 || onRotate2) && (
          <Row label="Rotate">
            <div className="flex gap-2 flex-1">
              <RotateButton onClick={() => onRotate1('left')} direction="left" title="Rotate image 1 left">1</RotateButton>
              <RotateButton onClick={() => onRotate1('right')} direction="right" title="Rotate image 1 right">1</RotateButton>
              <div className="w-px bg-gray-700" />
              <RotateButton onClick={() => onRotate2('left')} direction="left" title="Rotate image 2 left">2</RotateButton>
              <RotateButton onClick={() => onRotate2('right')} direction="right" title="Rotate image 2 right">2</RotateButton>
            </div>
          </Row>
        )}

        {/* Layout - dual mode */}
        {mode === 'dual' && onLayoutChange && (
          <Row label="Layout">
            <Segmented
              value={layout}
              onChange={onLayoutChange}
              options={[
                { value: 'vertical', label: 'Stack' },
                { value: 'horizontal', label: 'Side' },
              ]}
            />
          </Row>
        )}

        {/* Aspect ratio */}
        {onAspectRatioChange && (
          <Row label="Output">
            <Segmented
              value={aspectRatio}
              onChange={onAspectRatioChange}
              options={[
                { value: '9:16', label: '9:16 Story' },
                { value: '1:1', label: '1:1 Square' },
              ]}
            />
          </Row>
        )}

        {/* Edge style */}
        <Row label="Edge">
          <Segmented
            value={edgeStyle}
            onChange={onEdgeStyleChange}
            options={[
              { value: 'hard', label: 'Hard' },
              { value: 'feathered', label: 'Feathered' },
            ]}
          />
        </Row>

        {/* Phosphor glow color - only when feathered */}
        {edgeStyle === 'feathered' && (
          <Row label="Tube">
            <Segmented
              value={phosphorColor}
              onChange={onPhosphorColorChange}
              options={[
                { value: 'green', label: 'Green', dot: 'bg-green-500' },
                { value: 'white', label: 'White', dot: 'bg-gray-200' },
              ]}
            />
          </Row>
        )}
      </Section>

      {/* Color grading */}
      {colorGrading && onColorGradingChange && (
        <div className="pt-4 border-t border-gray-800">
          <Section
            title="Color"
            action={
              <button
                type="button"
                onClick={() => onColorGradingChange({ ...DEFAULT_COLOR_GRADING })}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Reset
              </button>
            }
          >
            <Row label="Tint">
              <Segmented
                value={colorGrading.tint || 'none'}
                onChange={(value) => onColorGradingChange({ ...colorGrading, tint: value })}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'green', label: 'Green', dot: 'bg-green-500' },
                  { value: 'white', label: 'B&W', dot: 'bg-gray-200' },
                ]}
              />
            </Row>

            {colorGrading.tint && colorGrading.tint !== 'none' && (
              <GradingSlider
                label="Strength"
                min="0"
                max="1"
                value={colorGrading.tintStrength ?? 1}
                onChange={(v) => onColorGradingChange({ ...colorGrading, tintStrength: v })}
              />
            )}

            <GradingSlider
              label="Brightness"
              min="0.5"
              max="1.5"
              value={colorGrading.brightness}
              onChange={(v) => onColorGradingChange({ ...colorGrading, brightness: v })}
            />
            <GradingSlider
              label="Contrast"
              min="0.5"
              max="2.0"
              value={colorGrading.contrast}
              onChange={(v) => onColorGradingChange({ ...colorGrading, contrast: v })}
            />
            <GradingSlider
              label="Saturation"
              min="0"
              max="2.0"
              value={colorGrading.saturation}
              onChange={(v) => onColorGradingChange({ ...colorGrading, saturation: v })}
            />
          </Section>
        </div>
      )}

      {/* Start over */}
      {onReset && (
        <div className="pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onReset}
            className="w-full py-2 text-sm text-gray-400 hover:text-white active:text-white transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  )
}
