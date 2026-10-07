import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { MIN_ORDER_QTY } from '../data/business'

const STEP = 10

// Quantity stepper that never lets the value drop below the wholesale minimum.
// Typing is free-form; the value is clamped when the field loses focus.
export default function QuantityInput({ value, onChange, id, label = 'Quantity' }) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = (next) => {
    const n = Math.max(MIN_ORDER_QTY, Math.floor(Number(next)) || MIN_ORDER_QTY)
    setDraft(String(n))
    if (n !== value) onChange(n)
  }

  return (
    <div className="qty">
      <button
        type="button"
        className="qty__btn"
        onClick={() => commit(value - STEP)}
        disabled={value <= MIN_ORDER_QTY}
        aria-label={`Decrease by ${STEP}`}
      >
        <Minus size={16} />
      </button>
      <input
        id={id}
        className="qty__input"
        type="number"
        inputMode="numeric"
        min={MIN_ORDER_QTY}
        step={1}
        value={draft}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <button type="button" className="qty__btn" onClick={() => commit(value + STEP)} aria-label={`Increase by ${STEP}`}>
        <Plus size={16} />
      </button>
    </div>
  )
}
