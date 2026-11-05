import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from './SectionHeading'
import ProductGrid from './ProductGrid'
import ErrorState from './ErrorState'
import { ProductGridSkeleton } from './Skeletons'
import useAsync from '../hooks/useAsync'
import { getFeaturedProducts } from '../services/productService'

export default function FeaturedProducts() {
  const { data: products, loading, error, reload } = useAsync((signal) => getFeaturedProducts(6, { signal }), [])

  if (!loading && !error && !products?.length) return null

  return (
    <section className="section section--light" aria-labelledby="featured-title">
      <div className="container">
        <div className="section-head-row">
          <SectionHeading
            id="featured-title"
            eyebrow="Wholesale picks"
            title="Featured products"
            subtitle="Popular wholesale picks from our automotive range."
            align="left"
          />
          <Link to="/products" className="link-arrow section-head-row__link">
            View all products <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {loading && <ProductGridSkeleton count={6} className="product-grid--3" />}
        {error && <ErrorState title="Products unavailable" message="We couldn't load featured products." onRetry={reload} />}
        {products?.length > 0 && <ProductGrid products={products} className="product-grid--3" />}
      </div>
    </section>
  )
}
