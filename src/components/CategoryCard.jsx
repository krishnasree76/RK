import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { getCategoryIcon } from './icons'

// Editorial category tile. `variant` controls its size in the homepage grid.
export default function CategoryCard({ category, index, variant = 'medium' }) {
  const Icon = getCategoryIcon(category.id)
  const number = String(index + 1).padStart(2, '0')

  return (
    <Link
      to={`/products?category=${category.id}`}
      className={`category-card category-card--${variant} category-card--${category.id}`}
    >
      <div className="category-card__media" aria-hidden="true">
        {category.image ? (
          <img src={category.image} alt="" loading="lazy" decoding="async" />
        ) : (
          <Icon className="category-card__icon" strokeWidth={0.75} />
        )}
      </div>
      <div className="category-card__shade" aria-hidden="true" />

      <span className="category-card__index" aria-hidden="true">{number}</span>
      <span className="category-card__arrow" aria-hidden="true">
        <ArrowUpRight size={20} />
      </span>

      <div className="category-card__body">
        <h3 className="category-card__title">{category.name}</h3>
        <p className="category-card__tagline">{category.tagline}</p>
        <span className="category-card__count">
          {category.productCount} product{category.productCount === 1 ? '' : 's'}
        </span>
      </div>
    </Link>
  )
}
