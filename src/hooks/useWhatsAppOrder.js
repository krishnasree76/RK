import { useCallback, useState } from 'react'
import { whatsappLink } from '../data/business'
import { createOrder, orderWhatsAppMessage } from '../services/orderService'

const IDLE = { status: 'idle', error: null, itemErrors: {} }

// Per-product messages from the API, keyed by product slug. The API returns
// either {slug: message} (stock checks) or a list aligned with the items sent.
function itemErrorsFrom(error, items) {
  const data = error?.data?.items
  if (!data) return {}
  if (Array.isArray(data)) {
    return Object.fromEntries(
      data
        .map((entry, i) => [items[i]?.id, entry && Object.values(entry).flat()[0]])
        .filter(([id, message]) => id && message),
    )
  }
  return typeof data === 'object' ? data : {}
}

// Places the order in the backend, then opens WhatsApp with the saved order.
// The WhatsApp tab is opened synchronously on click (so popup blockers allow
// it) and pointed at WhatsApp once the server has saved the order.
// Resolves to { order, waUrl, opened } on success, or null on failure.
export default function useWhatsAppOrder() {
  const [state, setState] = useState(IDLE)

  const placeOrder = useCallback(async ({ items, phone, notes }) => {
    const tab = window.open('', '_blank')
    if (tab) {
      tab.opener = null
      tab.document.title = 'Placing your order…'
      tab.document.body.innerHTML =
        '<p style="font:16px system-ui,sans-serif;padding:32px">Placing your order with RK Enterprices Delhi…</p>'
    }

    setState({ ...IDLE, status: 'submitting' })
    try {
      const order = await createOrder({ items, phone, notes })
      const waUrl = whatsappLink(orderWhatsAppMessage(order))
      if (tab) tab.location.href = waUrl
      setState({ ...IDLE, status: 'done' })
      return { order, waUrl, opened: Boolean(tab) }
    } catch (error) {
      tab?.close()
      setState({ ...IDLE, status: 'error', error, itemErrors: itemErrorsFrom(error, items) })
      return null
    }
  }, [])

  const reset = useCallback(() => setState(IDLE), [])
  return { ...state, placeOrder, reset }
}
