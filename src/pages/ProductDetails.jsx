import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronRight, Clock, Map as MapIcon, Package, ShoppingCart, Truck } from 'lucide-react'
import ProductImage from '../components/ProductImage'
import QuantityInput from '../components/QuantityInput'
import ProductGrid from '../components/ProductGrid'
import SectionHeading from '../components/SectionHeading'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { getCategory, getProductById, getRelatedProducts } from '../data/products'
import { BUSINESS, MIN_ORDER_QTY, whatsappLink } from '../data/business'
import { useCart } from '../context/CartContext'
import usePageMeta from '../hooks/usePageMeta'

const ASSURANCES = [
  { icon: Package, text: `MOQ ${MIN_ORDER_QTY} pieces` },
  { icon: Truck, text: 'LR within 24 hrs of dispatch' },
  { icon: MapIcon, text: 'Pan-India supply' },
  { icon: Clock, text: 'Open 24/7' },
]

const WHOLESALE_INFO = [
  ['Minimum order', `${MIN_ORDER_QTY} pieces per product`],
  ['Pricing', 'On request — quoted for your quantity'],
  ['How to order', 'Add to your Order List and send it on WhatsApp, or call us'],
  ['Dispatch', 'LR number shared within 24 hours of dispatch'],
  ['Supply', 'Pan-India, from Kashmere Gate, Delhi'],
]

export default function ProductDetails() {
  const { id } = useParams()
  const product = getProductById(id)

  usePageMeta(
    product ? `${product.name} | RK ENTERPRICES DELHI` : 'Product not found | RK ENTERPRICES DELHI',
    product
      ? `${product.name} — wholesale from RK Enterprices Delhi. Minimum order ${MIN_ORDER_QTY} pieces, price on request.`
      : undefined,
  )

  if (!product) {
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

  // Keyed by product id so quantity / "added" state resets when navigating
  // between products via Related Products.
  return <ProductView key={product.id} product={product} />
}

function ProductView({ product }) {
  const category = getCategory(product.category)
  const related = getRelatedProducts(product)
  const { addToCart, items } = useCart()
  const [quantity, setQuantity] = useState(MIN_ORDER_QTY)
  const [added, setAdded] = useState(false)
  const inList = items.find((i) => i.id === product.id)

  const handleAdd = () => {
    addToCart(product, quantity)
    setAdded(true)
  }

  return (
    <>
      <section className="section section--light pdp">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><ChevronRight size={14} aria-hidden="true" /><Link to="/products">Products</Link></li>
              <li>
                <ChevronRight size={14} aria-hidden="true" />
                <Link to={`/products?category=${product.category}`}>{category?.shortName}</Link>
              </li>
              <li aria-current="page"><ChevronRight size={14} aria-hidden="true" /><span>{product.name}</span></li>
            </ol>
          </nav>

          <div className="pdp__grid">
            <div className="pdp__media">
              <ProductImage
                src={product.image}
                alt={product.name}
                category={product.category}
                label={category?.name}
              />
            </div>

            <div className="pdp__info">
              <span className="eyebrow">{category?.name}</span>
              <h1 className="pdp__title">{product.name}</h1>
              <p className="pdp__lead">{product.description}</p>

              <dl className="pdp__terms">
                <div>
                  <dt>Price</dt>
                  <dd>On request</dd>
                </div>
                <div>
                  <dt>MOQ</dt>
                  <dd>{MIN_ORDER_QTY} pcs</dd>
                </div>
              </dl>

              <div className="pdp__order">
                <label htmlFor="pdp-qty" className="field__label">Quantity (pieces)</label>
                <div className="pdp__order-row">
                  <QuantityInput
                    id="pdp-qty"
                    label="Quantity in pieces"
                    value={quantity}
                    onChange={(q) => {
                      setQuantity(q)
                      setAdded(false)
                    }}
                  />
                  <button type="button" className="btn btn--dark pdp__add" onClick={handleAdd}>
                    {added ? <Check size={18} aria-hidden="true" /> : <ShoppingCart size={18} aria-hidden="true" />}
                    {added ? 'Added to order list' : 'Add to order list'}
                  </button>
                </div>
                <p className="pdp__hint">Minimum {MIN_ORDER_QTY} pieces. Use − / + to change in steps of 10, or type a quantity.</p>

                {inList && (
                  <p className="pdp__status" role="status">
                    <Check size={16} aria-hidden="true" /> {inList.quantity} pcs in your order list.{' '}
                    <Link to="/cart">Review order list</Link>
                  </p>
                )}

                <a
                  href={whatsappLink(`Hi, I need a wholesale price for ${product.name} (${quantity} pcs).`)}
                  className="btn btn--outline pdp__whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon size={18} /> Ask price on WhatsApp
                </a>
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
              Supplied in wholesale quantities for retailers, workshops and resellers. Contact us for current
              availability, variants and pricing for your required quantity.
            </p>
          </article>

          <article className="info-panel">
            <h2 className="info-panel__title">Specifications</h2>
            <dl className="spec-table">
              <div>
                <dt>Category</dt>
                <dd>{category?.name}</dd>
              </div>
              {product.specs.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>

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

          <article className="info-panel info-panel--dark">
            <h2 className="info-panel__title">Wholesale information</h2>
            <dl className="spec-table spec-table--dark">
              {WHOLESALE_INFO.map(([label, value]) => (
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

      <section className="section section--light" aria-labelledby="related-title">
        <div className="container">
          <SectionHeading id="related-title" eyebrow="You may also need" title="Related products" align="left" />
          <ProductGrid products={related} className="product-grid--4" />
        </div>
      </section>
    </>
  )
}
