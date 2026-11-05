import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { lineTotalPaise, toPaise } from '../utils/price'

const STORAGE_KEY = 'rk-cart-v1'

const CartContext = createContext(null)

// Each line item is clamped to its product minimum (1 when none is set) and,
// when known, to the available stock.
const clampQty = (qty, minQty = 1, stock = null) => {
  const min = Math.max(1, Math.floor(Number(minQty)) || 1)
  const n = Math.floor(Number(qty))
  const clamped = Number.isFinite(n) && n >= min ? n : min
  return stock !== null && stock >= min ? Math.min(clamped, stock) : clamped
}

// Snapshot of the product taken when it is added (refreshed from the API on
// the Order List page via SYNC).
const snapshot = (product) => ({
  name: product.name,
  category: product.category?.slug ?? product.category ?? null,
  categoryName: product.category?.name ?? product.categoryName ?? null,
  image: product.image ?? null,
  pricePerPiece: product.pricePerPiece ?? null,
  minQty: Math.max(1, Number(product.minQty) || 1),
  hasMinimumOrder: Boolean(product.hasMinimumOrder),
  stock: Number.isFinite(Number(product.stock)) && product.stock !== null && product.stock !== undefined ? Number(product.stock) : null,
})

function cartReducer(items, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, quantity } = action
      const fresh = snapshot(product)
      const existing = items.find((i) => i.id === product.id)
      if (existing) {
        return items.map((i) =>
          i.id === product.id ? { ...i, ...fresh, quantity: clampQty(i.quantity + quantity, fresh.minQty, fresh.stock) } : i,
        )
      }
      return [...items, { id: product.id, ...fresh, quantity: clampQty(quantity, fresh.minQty, fresh.stock) }]
    }
    case 'UPDATE':
      return items.map((i) => (i.id === action.id ? { ...i, quantity: clampQty(action.quantity, i.minQty, i.stock) } : i))
    case 'SYNC': {
      // Apply the latest price / minimum / name from the API.
      const byId = new Map(action.products.map((p) => [p.id, p]))
      let changed = false
      const next = items.map((i) => {
        const product = byId.get(i.id)
        if (!product) return i
        const fresh = snapshot(product)
        const updated = { ...i, ...fresh, quantity: clampQty(i.quantity, fresh.minQty, fresh.stock) }
        if (JSON.stringify(updated) !== JSON.stringify(i)) changed = true
        return updated
      })
      return changed ? next : items
    }
    case 'REMOVE':
      return items.filter((i) => i.id !== action.id)
    case 'CLEAR':
      return []
    default:
      return items
  }
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed
          .filter((i) => i && i.id)
          .map((i) => {
            const minQty = Math.max(1, Number(i.minQty) || 1)
            return { pricePerPiece: null, hasMinimumOrder: false, stock: null, ...i, minQty, quantity: clampQty(i.quantity, minQty) }
          })
      : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage unavailable (private mode, quota) — cart still works in memory.
    }
  }, [items])

  const addToCart = useCallback((product, quantity) => dispatch({ type: 'ADD', product, quantity }), [])
  const updateQuantity = useCallback((id, quantity) => dispatch({ type: 'UPDATE', id, quantity }), [])
  const syncProducts = useCallback((products) => dispatch({ type: 'SYNC', products }), [])
  const removeFromCart = useCallback((id) => dispatch({ type: 'REMOVE', id }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])
  const isInCart = useCallback((id) => items.some((i) => i.id === id), [items])

  const value = useMemo(() => {
    const lineTotals = items.map((i) => lineTotalPaise(toPaise(i.pricePerPiece), i.quantity))
    return {
      items,
      lineCount: items.length,
      totalPieces: items.reduce((sum, i) => sum + i.quantity, 0),
      // Grand total in paise; null while any line has no known price.
      totalPaise: lineTotals.some((t) => t === null) ? null : lineTotals.reduce((sum, t) => sum + t, 0),
      addToCart,
      updateQuantity,
      syncProducts,
      removeFromCart,
      clearCart,
      isInCart,
    }
  }, [items, addToCart, updateQuantity, syncProducts, removeFromCart, clearCart, isInCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
