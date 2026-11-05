import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductImage from './ProductImage'
import { formatPaise, formatPieces } from '../utils/price'

export default function ProductCard({ product, headingLevel: Heading = 'h3' }) {
  const href = `/products/${product.slug}`

  return (
    <article className="product-card">
      <Link to={href} className="product-card__media" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.image} alt={product.name} category={product.category} />
        {!product.inStock && <span className="stock-tag">Out of stock</span>}
      </Link>
      <div className="product-card__body">
        <span className="product-card__category">{product.category?.name ?? 'Accessories'}</span>
        <Heading className="product-card__title">
          <Link to={href} className="product-card__link">{product.name}</Link>
        </Heading>
        <dl className="product-card__meta">
          <div>
            <dt>Price / pc</dt>
            <dd>{formatPaise(product.pricePaise)}</dd>
          </div>
          <div>
            <dt>Min. order</dt>
            <dd>{product.hasMinimumOrder ? formatPieces(product.minQty) : 'No minimum'}</dd>
          </div>
        </dl>
        <span className="product-card__cta" aria-hidden="true">
          View details <ArrowRight size={16} />
        </span>
      </div>
    </article>
  )
}
