import { apiGet, apiPost } from './api'
import { BUSINESS } from '../data/business'
import { formatPaise, formatPieces, toPaise } from '../utils/price'

// Orders are created in the backend first (prices and stock are checked
// there); the WhatsApp message is then built from the saved order.
export const createOrder = ({ items, phone, notes }) =>
  apiPost(
    '/orders/',
    { items: items.map((i) => ({ product: i.id, quantity: i.quantity })), phone, notes },
    { auth: true },
  )

export const listOrders = (options) => apiGet('/orders/', { ...options, params: { page_size: 50 }, auth: true })

export function orderWhatsAppMessage(order) {
  const lines = order.items.map(
    (item, n) =>
      `${n + 1}. ${item.product_name} — ${formatPieces(item.quantity)} × ${formatPaise(toPaise(item.unit_price))} = ${formatPaise(toPaise(item.line_total))}`,
  )
  return [
    `Hi ${BUSINESS.shortName}, I've placed order ${order.number} on your website:`,
    '',
    ...lines,
    '',
    `Total: ${formatPieces(order.total_quantity)} — ${formatPaise(toPaise(order.total_amount))}`,
    '',
    `Name: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    ...(order.notes ? [`Note: ${order.notes}`] : []),
    '',
    'Please confirm availability and dispatch details.',
  ].join('\n')
}
