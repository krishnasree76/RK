import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronRight, Clock, Map as MapIcon, PackageCheck, PackageX, ShoppingCart, Truck } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import QuantityInput from '../components/QuantityInput'
import ProductGrid from '../components/ProductGrid'
import SectionHeading from '../components/SectionHeading'
import WhatsAppIcon from '../components/WhatsAppIcon'
import ErrorState from '../components/ErrorState'
import { ProductDetailSkeleton, ProductGridSkeleton } from '../components/Skeletons'
import { BUSINESS } from '../data/business'
import { useCart } from '../context/CartContext'
import useAsync from '../hooks/useAsync'
import usePageMeta from '../hooks/usePageMeta'
import { isNotFound } from '../services/api'
import { getProduct, getRelatedProducts } from '../services/productService'
import { formatPaise, formatPieces, lineTotalPaise, quantityStep } from '../utils/price'

const ASSURANCES = [
  { icon: Truck, text: 'LR within 24 hrs of dispatch' },
  { icon: MapIcon, text: 'Pan-India supply' },
  { icon: Clock, text: 'Open 24/7' },
]

const WHOLESALE_INFO = [
  ['How to order', 'Add to your Order List and send it on WhatsApp, or call us'],
  ['Dispatch', 'LR number shared within 24 hours of dispatch'],
  ['Supply', 'Pan-India, from Kashmere Gate, Delhi'],
]

export default function ProductDetails() {
  const { id: slug } = useParams()
  const { data: product, loading, error, reload } = useAsync((signal) => getProduct(slug, { signal }), [slug])
  const notFound = isNotFound(error)

  usePageMeta(
    product
      ? `${product.name} | RK ENTERPRICES DELHI`
      : notFound
        ? 'Product not found | RK ENTERPRICES DELHI'
        : 'Product | RK ENTERPRICES DELHI',
    product
      ? `${product.name} — wholesale from RK Enterprices Delhi at ${formatPaise(product.pricePaise)} per piece.`
      : undefined,
  )

  if (loading) return <ProductDetailSkeleton />

  if (notFound) {
    return (
      <section className="section">
        <div className="container empty-state">
          <h1>Product not found</h1>
          <p>This product may have been moved or is no longer listed.</p>
          <Link to="/products" className="btn btn--dark">
            <ArrowLeft size={18} aria-hidden="true" /> Back to products
          </Link>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <ErrorState title="Product unavailable" message="We couldn't load this product right now." onRetry={reload} />
        </div>
      </section>
    )
  }

  // Keyed so quantity / "added" state resets when moving between products.
  return <ProductView key={product.slug} product={product} />
}

function ProductView({ product }) {
  const category = product.category
  const { addToCart, updateQuantity, items } = useCart()
  const navigate = useNavigate()
  const orderable = product.inStock
  const minQty = product.minQty
  const step = quantityStep(minQty)
  const [quantity, setQuantity] = useState(minQty)
  const [added, setAdded] = useState(false)
  const inList = items.find((i) => i.id === product.id)
  const totalPaise = lineTotalPaise(product.pricePaise, quantity)
  const minimumText = product.hasMinimumOrder ? formatPieces(minQty) : 'No minimum'
  const wholesaleInfo = [
    ['Price per piece', formatPaise(product.pricePaise)],
    ['Minimum order', product.hasMinimumOrder ? `${formatPieces(minQty)} for this product` : 'No minimum — order from 1 piece'],
    ...WHOLESALE_INFO,
  ]
  const related = useAsync((signal) => getRelatedProducts(product, 4, { signal }), [product.slug])

  const handleAdd = () => {
    addToCart(product, quantity)
    setAdded(true)
  }

  // "Order now" uses the same checkout as the Order List (sign-in required,
  // order saved in the backend before WhatsApp opens).
  const handleOrderNow = () => {
    if (inList) updateQuantity(product.id, quantity)
    else addToCart(product, quantity)
    navigate('/cart')
  }

  return (
    <>
      <section className="section section--light pdp">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><ChevronRight size={14} aria-hidden="true" /><Link to="/products">Products</Link></li>
              {category && (
                <li>
                  <ChevronRight size={14} aria-hidden="true" />
                  <Link to={`/products?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link>
                </li>
              )}
              <li aria-current="page"><ChevronRight size={14} aria-hidden="true" /><span>{product.name}</span></li>
            </ol>
          </nav>

          <div className="pdp__grid">
            <div className="pdp__media">
              <ProductImage src={product.image} alt={product.name} category={category} label={category?.name} />
            </div>

            <div className="pdp__info">
              {category && <span className="eyebrow">{category.name}</span>}
              <h1 className="pdp__title">{product.name}</h1>
              <p className="pdp__lead">{product.description}</p>

              <dl className="pdp__terms">
                <div>
                  <dt>Price per piece</dt>
                  <dd>{formatPaise(product.pricePaise)}</dd>
                </div>
                <div>
                  <dt>Minimum order</dt>
                  <dd>{minimumText}</dd>
                </div>
              </dl>

              <p className={`stock-line${orderable ? '' : ' stock-line--out'}`}>
                {orderable ? <PackageCheck size={18} aria-hidden="true" /> : <PackageX size={18} aria-hidden="true" />}
                {orderable
                  ? `In stock — ${formatPieces(product.stock)} available`
                  : product.stock > 0
                    ? `Only ${formatPieces(product.stock)} left — below the minimum order`
                    : 'Out of stock'}
              </p>

              <div className="pdp__order">
                <label htmlFor="pdp-qty" className="field__label">Quantity (pieces)</label>
                <div className="pdp__order-row">
                  <QuantityInput
                    id="pdp-qty"
                    label="Quantity in pieces"
                    value={quantity}
                    min={minQty}
                    max={orderable ? product.stock : undefined}
                    step={step}
                    onChange={(q) => {
                      setQuantity(q)
                      setAdded(false)
                    }}
                  />
                  <button type="button" className="btn btn--dark pdp__add" onClick={handleAdd} disabled={!orderable}>
                    {added ? <Check size={18} aria-hidden="true" /> : <ShoppingCart size={18} aria-hidden="true" />}
                    {!orderable ? 'Out of stock' : added ? 'Added to order list' : 'Add to order list'}
                  </button>
                </div>
                <p className="pdp__hint">
                  {product.hasMinimumOrder
                    ? `Minimum ${formatPieces(minQty)} for this product. Use − / + to change in steps of ${step}, or type a quantity.`
                    : 'Order from 1 piece. Use − / + or type a quantity.'}
                </p>

                <div className="pdp__total" aria-live="polite">
                  <span>
                    Total <small>({formatPieces(quantity)} × {formatPaise(product.pricePaise)})</small>
                  </span>
                  <strong>{formatPaise(totalPaise)}</strong>
                </div>

                {inList && (
                  <p className="pdp__status" role="status">
                    <Check size={16} aria-hidden="true" /> {inList.quantity} pcs in your order list.{' '}
                    <Link to="/cart">Review order list</Link>
                  </p>
                )}

                <button type="button" className="btn btn--outline pdp__whatsapp" onClick={handleOrderNow} disabled={!orderable}>
                  <WhatsAppIcon size={18} /> Order now on WhatsApp
                </button>
              </div>

              <ul className="pdp__assurances">
                {ASSURANCES.map(({ icon: Icon, text }) => (
                  <li key={text}>
                    <Icon size={18} aria-hidden="true" /> {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--white pdp-details" aria-label="Product information">
        <div className="container pdp-details__grid">
          <article className="info-panel">
            <h2 className="info-panel__title">Product description</h2>
            <p>{product.description}</p>
            <p>
              Supplied to retailers, workshops and resellers across India. Contact us for current availability
              and variants.
            </p>
          </article>

          <article className="info-panel">
            <h2 className="info-panel__title">Specifications</h2>
            <dl className="spec-table">
              {category && (
                <div>
                  <dt>Category</dt>
                  <dd>{category.name}</dd>
                </div>
              )}
              {product.specs.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              <div>
                <dt>Price per piece</dt>
                <dd>{formatPaise(product.pricePaise)}</dd>
              </div>
              {product.hasMinimumOrder && (
                <div>
                  <dt>Minimum order</dt>
                  <dd>{formatPieces(minQty)}</dd>
                </div>
              )}
            </dl>
          </article>

          {product.features.length > 0 && (
            <article className="info-panel">
              <h2 className="info-panel__title">Features</h2>
              <ul className="feature-list">
                {product.features.map((f) => (
                  <li key={f}>
                    <Check size={16} aria-hidden="true" /> {f}
                  </li>
                ))}
              </ul>
            </article>
          )}

          <article className={`info-panel info-panel--dark${product.features.length ? '' : ' info-panel--full'}`}>
            <h2 className="info-panel__title">Wholesale information</h2>
            <dl className="spec-table spec-table--dark">
              {wholesaleInfo.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <a href={BUSINESS.phoneHref} className="link-arrow link-arrow--light">
              Call {BUSINESS.phoneDisplay}
            </a>
          </article>
        </div>
      </section>

      {(related.loading || related.data?.length > 0) && (
        <section className="section section--light" aria-labelledby="related-title">
          <div className="container">
            <SectionHeading id="related-title" eyebrow="You may also need" title="Related products" align="left" />
            {related.loading ? (
              <ProductGridSkeleton count={4} className="product-grid--4" />
            ) : (
              <ProductGrid products={related.data} className="product-grid--4" />
            )}
          </div>
        </section>
      )}
    </>
  )
}
