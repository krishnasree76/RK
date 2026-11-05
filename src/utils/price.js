// Prices arrive from the API as exact decimal strings ("850.00"). They are
// converted to integer paise so totals are exact (no floating-point drift).

export function toPaise(value) {
  if (value === null || value === undefined || value === '') return null
  const [rupees, fraction = ''] = String(value).trim().split('.')
  const whole = Number.parseInt(rupees, 10)
  if (Number.isNaN(whole)) return null
  const paise = Number.parseInt(`${fraction}00`.slice(0, 2), 10) || 0
  return whole * 100 + (whole < 0 ? -paise : paise)
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatPaise = (paise) => (paise === null || paise === undefined ? '—' : inr.format(paise / 100))

export const lineTotalPaise = (pricePaise, quantity) =>
  pricePaise === null || pricePaise === undefined ? null : pricePaise * quantity

// Quantity selector step: tens for bulk minimums (50 → 60 → 70), ones otherwise.
export const quantityStep = (minQty) => (minQty >= 10 ? 10 : 1)

export const formatPieces = (n) => `${n} ${n === 1 ? 'pc' : 'pcs'}`
