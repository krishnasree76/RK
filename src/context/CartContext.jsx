import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { MIN_ORDER_QTY } from '../data/business'

const STORAGE_KEY = 'rk-cart-v1'

const CartContext = createContext(null)

// Every line item is clamped to the wholesale minimum.
const clampQty = (qty) => {
  const n = Math.floor(Number(qty))
  return Number.isFinite(n) && n >= MIN_ORDER_QTY ? n : MIN_ORDER_QTY
}

function cartReducer(items, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, quantity } = action
      const existing = items.find((i) => i.id === product.id)
      if (existing) {
        return items.map((i) =>
          i.id === product.id ? { ...i, quantity: clampQty(i.quantity + quantity) } : i,
        )
      }
      return [
        ...items,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          image: product.image ?? null,
          quantity: clampQty(quantity),
        },
      ]
    }
    case 'UPDATE':
      return items.map((i) => (i.id === action.id ? { ...i, quantity: clampQty(action.quantity) } : i))
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
      ? parsed.filter((i) => i && i.id).map((i) => ({ ...i, quantity: clampQty(i.quantity) }))
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

  const addToCart = useCallback(
    (product, quantity = MIN_ORDER_QTY) => dispatch({ type: 'ADD', product, quantity }),
    [],
  )
  const updateQuantity = useCallback((id, quantity) => dispatch({ type: 'UPDATE', id, quantity }), [])
  const removeFromCart = useCallback((id) => dispatch({ type: 'REMOVE', id }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])
  const isInCart = useCallback((id) => items.some((i) => i.id === id), [items])

  const value = useMemo(
    () => ({
      items,
      lineCount: items.length,
      totalPieces: items.reduce((sum, i) => sum + i.quantity, 0),
      minOrderQty: MIN_ORDER_QTY,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      isInCart,
    }),
    [items, addToCart, updateQuantity, removeFromCart, clearCart, isInCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
