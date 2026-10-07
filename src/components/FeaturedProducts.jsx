import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from './SectionHeading'
import ProductGrid from './ProductGrid'
import { featuredProducts } from '../data/products'

export default function FeaturedProducts() {
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
        <ProductGrid products={featuredProducts} className="product-grid--3" />
      </div>
    </section>
  )
}
