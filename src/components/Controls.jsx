import {
  ASPECT_RATIOS,
  DEFAULT_COLOR_GRADING,
  DEFAULT_TRANSFORM,
  STRAIGHTEN_RANGE,
  isDefaultTransform,
  rotateTransform,
  flipTransform,
  getViewFlips,
} from '../utils/canvasUtils'

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

function ToolButton({ onClick, active, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        flex-1 py-2 px-1.5 rounded-lg transition-all
        flex items-center justify-center gap-1.5 text-sm
        ${active
          ? SEG_ACTIVE
          : 'bg-nv-dark text-gray-400 hover:text-white hover:bg-gray-700 active:bg-gray-700'}
      `}
    >
      {children}
    </button>
  )
}

function RotateIcon({ direction }) {
  return (
    <svg
      className="w-4 h-4 flex-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={direction === 'right' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
    </svg>
  )
}

function FlipIcon({ axis }) {
  return (
    <svg
      className="w-4 h-4 flex-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      style={axis === 'vertical' ? { transform: 'rotate(90deg)' } : undefined}
    >
      <path d="M3 7l5 5-5 5V7z" />
      <path d="M21 7l-5 5 5 5V7z" />
      <path d="M12 20v2M12 14v2M12 8v2M12 2v2" />
    </svg>
  )
}

// Compact rotate / flip button strip for one image (dual mode)
function TransformButtons({ transform, onChange, imageLabel }) {
  const viewFlips = getViewFlips(transform)
  const suffix = imageLabel ? ` (image ${imageLabel})` : ''
  return (
    <div className="flex gap-2 flex-1">
      <ToolButton onClick={() => onChange(rotateTransform(transform, 'left'))} title={`Rotate 90° left${suffix}`}>
        <RotateIcon direction="left" />
      </ToolButton>
      <ToolButton onClick={() => onChange(rotateTransform(transform, 'right'))} title={`Rotate 90° right${suffix}`}>
        <RotateIcon direction="right" />
      </ToolButton>
      <ToolButton
        onClick={() => onChange(flipTransform(transform, 'horizontal'))}
        active={viewFlips.horizontal}
        title={`Flip horizontally${suffix}`}
      >
        <FlipIcon axis="horizontal" />
      </ToolButton>
      <ToolButton
        onClick={() => onChange(flipTransform(transform, 'vertical'))}
        active={viewFlips.vertical}
        title={`Flip vertically${suffix}`}
      >
        <FlipIcon axis="vertical" />
      </ToolButton>
    </div>
  )
}

function StraightenSlider({ transform, onChange }) {
  return (
    <>
      <input
        type="range"
        min={-STRAIGHTEN_RANGE}
        max={STRAIGHTEN_RANGE}
        step="1"
        value={transform.straighten}
        onChange={(e) => onChange({ ...transform, straighten: parseFloat(e.target.value) })}
        onDoubleClick={() => onChange({ ...transform, straighten: 0 })}
        style={{ WebkitAppearance: 'none', touchAction: 'manipulation' }}
        className={SLIDER_CLASS}
      />
      <span className="text-xs text-gray-500 w-12 text-right tabular-nums">{transform.straighten}°</span>
    </>
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
  transform,
  onTransformChange,
  transform1,
  transform2,
  onTransform1Change,
  onTransform2Change,
  imageInfo,
  colorGrading,
  onColorGradingChange,
  onReset,
}) {
  const currentAspect = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['9:16']

  const hasSingleTransform = mode === 'single' && transform && onTransformChange
  const hasDualTransform = mode === 'dual' && transform1 && transform2 && onTransform1Change && onTransform2Change
  const transformDirty = hasSingleTransform
    ? !isDefaultTransform(transform)
    : hasDualTransform && (!isDefaultTransform(transform1) || !isDefaultTransform(transform2))

  const singleViewFlips = hasSingleTransform ? getViewFlips(transform) : null

  const resetTransforms = () => {
    if (hasSingleTransform) onTransformChange({ ...DEFAULT_TRANSFORM })
    if (hasDualTransform) {
      onTransform1Change({ ...DEFAULT_TRANSFORM })
      onTransform2Change({ ...DEFAULT_TRANSFORM })
    }
  }

  return (
    <div className="px-4 py-4 space-y-5 max-w-lg mx-auto md:max-w-none">
      {/* Image dimensions */}
      {imageInfo && (
        <div className="flex justify-between text-xs text-gray-500 tabular-nums">
          <span>Source: {imageInfo.width} × {imageInfo.height}</span>
          <span>Output: {currentAspect.width} × {currentAspect.height}</span>
        </div>
      )}

      <Section
        title="Frame"
        action={
          transformDirty && (
            <button
              type="button"
              onClick={resetTransforms}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Reset
            </button>
          )
        }
      >
        {/* Rotate / flip / straighten - single mode */}
        {hasSingleTransform && (
          <>
            <Row label="Rotate">
              <div className="flex gap-2 flex-1">
                <ToolButton onClick={() => onTransformChange(rotateTransform(transform, 'left'))} title="Rotate 90° left">
                  <RotateIcon direction="left" />
                  90° Left
                </ToolButton>
                <ToolButton onClick={() => onTransformChange(rotateTransform(transform, 'right'))} title="Rotate 90° right">
                  <RotateIcon direction="right" />
                  90° Right
                </ToolButton>
              </div>
            </Row>
            <Row label="Flip">
              <div className="flex gap-2 flex-1">
                <ToolButton
                  onClick={() => onTransformChange(flipTransform(transform, 'horizontal'))}
                  active={singleViewFlips.horizontal}
                  title="Flip horizontally"
                >
                  <FlipIcon axis="horizontal" />
                  Horizontal
                </ToolButton>
                <ToolButton
                  onClick={() => onTransformChange(flipTransform(transform, 'vertical'))}
                  active={singleViewFlips.vertical}
                  title="Flip vertically"
                >
                  <FlipIcon axis="vertical" />
                  Vertical
                </ToolButton>
              </div>
            </Row>
            <Row label="Straighten">
              <StraightenSlider transform={transform} onChange={onTransformChange} />
            </Row>
          </>
        )}

        {/* Rotate / flip / straighten - dual mode */}
        {hasDualTransform && (
          <>
            <Row label="Image 1">
              <TransformButtons transform={transform1} onChange={onTransform1Change} imageLabel="1" />
            </Row>
            <Row label="Straighten">
              <StraightenSlider transform={transform1} onChange={onTransform1Change} />
            </Row>
            <Row label="Image 2">
              <TransformButtons transform={transform2} onChange={onTransform2Change} imageLabel="2" />
            </Row>
            <Row label="Straighten">
              <StraightenSlider transform={transform2} onChange={onTransform2Change} />
            </Row>
          </>
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
          <Row label="Aspect ratio">
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
