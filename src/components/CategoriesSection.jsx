import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from './SectionHeading'
import CategoryCard from './CategoryCard'
import ErrorState from './ErrorState'
import { CategoryGridSkeleton } from './Skeletons'
import useCategories from '../hooks/useCategories'

// Layout classes for the editorial grid, computed from position so it works
// for any number of admin-managed categories:
// - desktop (4 cols): the first card is large (2×2); the last card stretches
//   to fill an incomplete final row.
// - tablet (2 cols): the large card spans the row; an unpaired last card spans 2.
// - mobile (2 cols): equal tiles; an unpaired last card spans 2.
function layoutFor(index, total) {
  const classes = []
  const isLast = index === total - 1
  const editorial = total >= 5

  if (editorial && index === 0) classes.push('category-card--large')
  if (editorial && isLast) {
    const remainder = (total - 5) % 4
    if (remainder) classes.push(`category-card--span-${5 - remainder}`)
  }
  if (isLast && (editorial ? (total - 1) % 2 === 1 : total % 2 === 1)) classes.push('category-card--tablet-wide')
  if (isLast && total % 2 === 1) classes.push('category-card--mobile-wide')
  return classes.join(' ')
}

export default function CategoriesSection() {
  const { categories, loading, error, reload } = useCategories()

  if (!loading && !error && categories.length === 0) return null

  return (
    <section className="section section--white" aria-labelledby="categories-title">
      <div className="container">
        <div className="section-head-row">
          <SectionHeading
            id="categories-title"
            eyebrow="Categories"
            title="Explore our range"
            subtitle="Wholesale automotive accessories for every drive."
            align="left"
          />
          <Link to="/products" className="link-arrow section-head-row__link">
            All products <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {loading && <CategoryGridSkeleton />}
        {error && (
          <ErrorState title="Categories unavailable" message="We couldn't load the categories right now." onRetry={reload} />
        )}
        {!loading && !error && (
          <div className={`category-grid${categories.length >= 5 ? ' category-grid--editorial' : ''}`}>
            {categories.map((category, i) => (
              <CategoryCard key={category.id} category={category} index={i} layoutClass={layoutFor(i, categories.length)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
