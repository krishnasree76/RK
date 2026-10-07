import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Package, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ProductImage from '../components/ProductImage'
import QuantityInput from '../components/QuantityInput'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { getCategoryName, getProductById } from '../data/products'
import { BUSINESS, whatsappLink } from '../data/business'
import { useCart } from '../context/CartContext'
import usePageMeta from '../hooks/usePageMeta'

export default function Cart() {
  usePageMeta('Order List | RK ENTERPRICES DELHI', 'Review your wholesale order list and send it to RK Enterprices Delhi on WhatsApp.')

  const { items, lineCount, totalPieces, minOrderQty, updateQuantity, removeFromCart, clearCart } = useCart()

  // Prefer live catalogue data (name/image may have changed since it was added).
  const rows = items.map((item) => ({ ...item, ...(getProductById(item.id) ?? {}), quantity: item.quantity }))

  const orderMessage = [
    `Hi ${BUSINESS.shortName}, I'd like to place a wholesale order:`,
    '',
    ...rows.map((r, n) => `${n + 1}. ${r.name} — ${r.quantity} pcs`),
    '',
    `Total: ${totalPieces} pcs across ${lineCount} product${lineCount === 1 ? '' : 's'}.`,
    'Please share pricing and dispatch details.',
  ].join('\n')

  return (
    <>
      <PageHeader
        eyebrow="Order list"
        title="Your order list"
        subtitle="Review quantities, then send your list to us on WhatsApp. We'll confirm pricing and dispatch."
      />

      <section className="section section--light section--tight-top">
        <div className="container">
          <p className="moq-note moq-note--left">
            <Package size={18} aria-hidden="true" />
            Minimum order quantity: <strong>{minOrderQty} pieces per product.</strong>
          </p>

          {rows.length === 0 ? (
            <div className="empty-state empty-state--panel">
              <ClipboardList size={48} strokeWidth={1.25} aria-hidden="true" />
              <h2>Your order list is empty</h2>
              <p>Browse the catalogue and add products in wholesale quantities to build your order.</p>
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
                  <span role="columnheader">Price</span>
                  <span role="columnheader">Total</span>
                  <span role="columnheader"><span className="sr-only">Remove</span></span>
                </div>

                {rows.map((row) => (
                  <div key={row.id} className="order-row" role="row">
                    <div className="order-row__product" role="cell">
                      <Link to={`/products/${row.id}`} className="order-row__media" tabIndex={-1} aria-hidden="true">
                        <ProductImage src={row.image} alt={row.name} category={row.category} />
                      </Link>
                      <div className="order-row__info">
                        <span className="product-card__category">{getCategoryName(row.category)}</span>
                        <Link to={`/products/${row.id}`} className="order-row__name">{row.name}</Link>
                      </div>
                    </div>
                    <div className="order-row__qty" role="cell">
                      <span className="order-row__label">Quantity</span>
                      <QuantityInput
                        value={row.quantity}
                        onChange={(q) => updateQuantity(row.id, q)}
                        label={`Quantity for ${row.name}`}
                      />
                    </div>
                    <div className="order-row__price" role="cell">
                      <span className="order-row__label">Price</span>
                      <span className="order-row__value">On request</span>
                    </div>
                    <div className="order-row__total" role="cell">
                      <span className="order-row__label">Total</span>
                      <span className="order-row__value">On request</span>
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
                ))}

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
                  <div><dt>Total quantity</dt><dd>{totalPieces} pcs</dd></div>
                  <div><dt>Pricing</dt><dd>On request</dd></div>
                </dl>
                <a
                  href={whatsappLink(orderMessage)}
                  className="btn btn--primary btn--block btn--lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon size={18} /> Send order on WhatsApp
                </a>
                <Link to="/products" className="btn btn--ghost btn--block">
                  Continue shopping
                </Link>
                <p className="order-summary__note">
                  Prices are confirmed for your quantities on WhatsApp. {BUSINESS.lrNote}.
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
