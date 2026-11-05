import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

// Quantity stepper that never goes below the product's minimum (1 when the
// product has no minimum order). Typing is free-form; the value is clamped
// when the field loses focus.
export default function QuantityInput({ value, onChange, min = 1, max, step = 1, id, label = 'Quantity' }) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = (next) => {
    let n = Math.max(min, Math.floor(Number(next)) || min)
    if (max !== undefined && max >= min) n = Math.min(n, max)
    setDraft(String(n))
    if (n !== value) onChange(n)
  }

  return (
    <div className="qty">
      <button
        type="button"
        className="qty__btn"
        onClick={() => commit(value - step)}
        disabled={value <= min}
        aria-label={`Decrease by ${step}`}
      >
        <Minus size={16} />
      </button>
      <input
        id={id}
        className="qty__input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max !== undefined && max >= min ? max : undefined}
        step={1}
        value={draft}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <button
        type="button"
        className="qty__btn"
        onClick={() => commit(value + step)}
        disabled={max !== undefined && value >= max}
        aria-label={`Increase by ${step}`}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
