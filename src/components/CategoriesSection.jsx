import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from './SectionHeading'
import CategoryCard from './CategoryCard'
import { categories } from '../data/products'

// Wheels & Tyres leads the grid (it echoes the hero's wheel visuals),
// Car Care closes it as a wide banner; the rest are medium tiles.
const variantFor = (id) => (id === 'wheels-tyres' ? 'large' : id === 'care' ? 'wide' : 'medium')

export default function CategoriesSection() {
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

        <div className="category-grid">
          {categories.map((category, i) => (
            <CategoryCard key={category.id} category={category} index={i} variant={variantFor(category.id)} />
          ))}
        </div>
      </div>
    </section>
  )
}
