import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, CircleCheck, ClipboardList, LogIn, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ProductImage from '../components/ProductImage'
import QuantityInput from '../components/QuantityInput'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { BUSINESS } from '../data/business'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import usePageMeta from '../hooks/usePageMeta'
import useWhatsAppOrder from '../hooks/useWhatsAppOrder'
import { getProductsBySlugs } from '../services/productService'
import { formatPaise, formatPieces, lineTotalPaise, quantityStep, toPaise } from '../utils/price'

// Stock problem for a line, if any (null when the line can be ordered).
function stockIssue(item) {
  if (item.stock === null || item.stock === undefined) return null
  if (item.stock <= 0) return 'Out of stock'
  if (item.stock < item.minQty) return `Only ${formatPieces(item.stock)} left — below the minimum order`
  if (item.quantity > item.stock) return `Only ${formatPieces(item.stock)} in stock`
  return null
}

function OrderPlaced({ order, waUrl, opened }) {
  return (
    <div className="order-placed" role="status">
      <CircleCheck size={48} strokeWidth={1.5} aria-hidden="true" />
      <h2>Order {order.number} placed</h2>
      <p>
        {formatPieces(order.total_quantity)} · <strong>{formatPaise(toPaise(order.total_amount))}</strong>
      </p>
      <p className="order-placed__text">
        {opened
          ? 'WhatsApp has opened in a new tab with your order — press send so we can confirm availability and dispatch.'
          : 'Your order is saved. Open WhatsApp to send it to us so we can confirm availability and dispatch.'}
      </p>
      <div className="btn-row btn-row--center">
        <a href={waUrl} className="btn btn--primary btn--lg" target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon size={18} /> {opened ? 'Open WhatsApp again' : 'Open WhatsApp'}
        </a>
        <Link to="/account" className="btn btn--outline btn--lg">
          View my orders
        </Link>
      </div>
      <p className="order-placed__note">{BUSINESS.lrNote}.</p>
    </div>
  )
}

function Checkout({ rows, totalPaise, onPlaced, onItemErrors }) {
  const { user, isAuthenticated, isChecking } = useAuth()
  const location = useLocation()
  const order = useWhatsAppOrder()
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace(/^\+91/, '') : '')
  const [notes, setNotes] = useState('')
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    if (user?.phone) setPhone((p) => p || user.phone.replace(/^\+91/, ''))
  }, [user?.phone])

  // Show server-side item problems (e.g. stock changed) on the matching lines.
  useEffect(() => {
    onItemErrors(order.itemErrors)
  }, [order.itemErrors, onItemErrors])

  const blocked = rows.some((r) => stockIssue(r))
  const next = encodeURIComponent(location.pathname)

  if (isChecking) {
    return <button type="button" className="btn btn--primary btn--block btn--lg" disabled>Checking your account…</button>
  }

  if (!isAuthenticated) {
    return (
      <div className="checkout-signin">
        <p>Sign in or create an account to send your order. Your order list is saved.</p>
        <Link to={`/signin?next=${next}`} className="btn btn--primary btn--block btn--lg">
          <LogIn size={18} aria-hidden="true" /> Sign in to order
        </Link>
        <Link to={`/signin?mode=signup&next=${next}`} className="btn btn--ghost btn--block">
          Create an account
        </Link>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!phone.replace(/\D/g, '')) {
      setPhoneError('Enter your mobile number so we can confirm the order.')
      return
    }
    setPhoneError('')
    const result = await order.placeOrder({ items: rows, phone, notes: notes.trim() })
    if (result) onPlaced(result)
  }

  const apiPhoneError = order.error?.fieldErrors?.phone
  const generalError =
    order.status === 'error' && !apiPhoneError && !Object.keys(order.itemErrors).length ? order.error?.message : ''

  return (
    <form className="checkout" onSubmit={submit} noValidate>
      <p className="checkout__who">
        Ordering as <strong>{user.name}</strong>
      </p>
      <div className={`field${phoneError || apiPhoneError ? ' field--error' : ''}`}>
        <label htmlFor="checkout-phone" className="field__label">Mobile number</label>
        <div className="field__prefixed field__prefixed--dark">
          <span className="field__prefix">+91</span>
          <input
            id="checkout-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className="field__input"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {(phoneError || apiPhoneError) && <p className="field__error">{phoneError || apiPhoneError}</p>}
      </div>
      <div className="field">
        <label htmlFor="checkout-notes" className="field__label">Note (optional)</label>
        <textarea
          id="checkout-notes"
          rows={2}
          maxLength={1000}
          className="field__input field__input--textarea checkout__notes"
          placeholder="Delivery city, transport preference…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {Object.keys(order.itemErrors).length > 0 && (
        <p className="checkout__error" role="alert">Some items need attention — see the highlighted lines.</p>
      )}
      {generalError && <p className="checkout__error" role="alert">{generalError}</p>}
      {blocked && <p className="checkout__error">Adjust or remove the items marked in red to continue.</p>}

      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={blocked || order.status === 'submitting' || totalPaise === null}>
        <WhatsAppIcon size={18} /> {order.status === 'submitting' ? 'Placing order…' : 'Send order on WhatsApp'}
      </button>
    </form>
  )
}

export default function Cart() {
  usePageMeta('Order List | RK ENTERPRICES DELHI', 'Review your order list and send it to RK Enterprices Delhi on WhatsApp.')

  const { items, lineCount, totalPieces, totalPaise, updateQuantity, syncProducts, removeFromCart, clearCart } = useCart()
  const [placed, setPlaced] = useState(null)
  const [itemErrors, setItemErrors] = useState({})

  // Refresh prices, minimums and stock from the API so totals always use the
  // current admin values (the stored snapshot is the offline fallback).
  const slugKey = items.map((i) => i.id).sort().join(',')
  useEffect(() => {
    if (!slugKey) return undefined
    const controller = new AbortController()
    getProductsBySlugs(slugKey.split(','), { signal: controller.signal })
      .then(syncProducts)
      .catch(() => {
        // Offline / API down: keep the saved snapshot.
      })
    return () => controller.abort()
  }, [slugKey, syncProducts])

  const rows = items.map((item) => {
    const pricePaise = toPaise(item.pricePerPiece)
    return { ...item, pricePaise, linePaise: lineTotalPaise(pricePaise, item.quantity) }
  })

  const handlePlaced = (result) => {
    setPlaced(result)
    clearCart()
  }

  return (
    <>
      <PageHeader
        eyebrow="Order list"
        title="Your order list"
        subtitle="Review quantities and totals, then send your order to us on WhatsApp. We'll confirm availability and dispatch."
      />

      <section className="section section--light section--tight-top">
        <div className="container">
          {placed ? (
            <OrderPlaced {...placed} />
          ) : rows.length === 0 ? (
            <div className="empty-state empty-state--panel">
              <ClipboardList size={48} strokeWidth={1.25} aria-hidden="true" />
              <h2>Your order list is empty</h2>
              <p>Browse the catalogue and add products to build your order.</p>
              <Link to="/products" className="btn btn--dark">
                Browse products <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="order-layout">
              <div className="order-table" role="table" aria-label="Order list">
                <div className="order-table__head" role="row">
                  <span role="columnheader">Product</span>
                  <span role="columnheader">Quantity</span>
                  <span role="columnheader">Price / pc</span>
                  <span role="columnheader">Total</span>
                  <span role="columnheader"><span className="sr-only">Remove</span></span>
                </div>

                {rows.map((row) => {
                  const issue = itemErrors[row.id] || stockIssue(row)
                  return (
                    <div key={row.id} className={`order-row${issue ? ' order-row--issue' : ''}`} role="row">
                      <div className="order-row__product" role="cell">
                        <Link to={`/products/${row.id}`} className="order-row__media" tabIndex={-1} aria-hidden="true">
                          <ProductImage src={row.image} alt={row.name} category={row.category} />
                        </Link>
                        <div className="order-row__info">
                          <span className="product-card__category">{row.categoryName || 'Accessories'}</span>
                          <Link to={`/products/${row.id}`} className="order-row__name">{row.name}</Link>
                          {row.hasMinimumOrder && (
                            <span className="order-row__min">Minimum order {formatPieces(row.minQty)}</span>
                          )}
                          {issue && <span className="order-row__issue">{issue}</span>}
                        </div>
                      </div>
                      <div className="order-row__qty" role="cell">
                        <span className="order-row__label">Quantity</span>
                        <QuantityInput
                          value={row.quantity}
                          min={row.minQty}
                          max={row.stock !== null && row.stock >= row.minQty ? row.stock : undefined}
                          step={quantityStep(row.minQty)}
                          onChange={(q) => {
                            updateQuantity(row.id, q)
                            setItemErrors((errs) => ({ ...errs, [row.id]: undefined }))
                          }}
                          label={`Quantity for ${row.name}`}
                        />
                      </div>
                      <div className="order-row__price" role="cell">
                        <span className="order-row__label">Price / pc</span>
                        <span className="order-row__value">{formatPaise(row.pricePaise)}</span>
                      </div>
                      <div className="order-row__total" role="cell">
                        <span className="order-row__label">Total</span>
                        <span className="order-row__value order-row__value--strong">{formatPaise(row.linePaise)}</span>
                      </div>
                      <div className="order-row__remove" role="cell">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => removeFromCart(row.id)}
                          aria-label={`Remove ${row.name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                <div className="order-table__foot">
                  <button type="button" className="btn btn--text" onClick={clearCart}>
                    Clear order list
                  </button>
                </div>
              </div>

              <aside className="order-summary" aria-labelledby="summary-title">
                <h2 id="summary-title" className="order-summary__title">Order summary</h2>
                <dl className="order-summary__rows">
                  <div><dt>Products</dt><dd>{lineCount}</dd></div>
                  <div><dt>Total quantity</dt><dd>{formatPieces(totalPieces)}</dd></div>
                </dl>
                <div className="order-summary__total">
                  <span>Order total</span>
                  <strong>{formatPaise(totalPaise)}</strong>
                </div>
                <Checkout rows={rows} totalPaise={totalPaise} onPlaced={handlePlaced} onItemErrors={setItemErrors} />
                <Link to="/products" className="btn btn--ghost btn--block">
                  Continue shopping
                </Link>
                <p className="order-summary__note">
                  Your order is saved to your account, then sent to us on WhatsApp. {BUSINESS.lrNote}.
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

