import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductImage from './ProductImage'
import { getCategory } from '../data/products'
import { MIN_ORDER_QTY } from '../data/business'

export default function ProductCard({ product, headingLevel: Heading = 'h3' }) {
  const href = `/products/${product.id}`
  const category = getCategory(product.category)

  return (
    <article className="product-card">
      <Link to={href} className="product-card__media" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.image} alt={product.name} category={product.category} />
      </Link>
      <div className="product-card__body">
        <span className="product-card__category">{category?.name ?? 'Accessories'}</span>
        <Heading className="product-card__title">
          <Link to={href} className="product-card__link">{product.name}</Link>
        </Heading>
        <dl className="product-card__meta">
          <div>
            <dt>MOQ</dt>
            <dd>{MIN_ORDER_QTY} pcs</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>On request</dd>
          </div>
        </dl>
        <span className="product-card__cta" aria-hidden="true">
          View details <ArrowRight size={16} />
        </span>
      </div>
    </article>
  )
}
