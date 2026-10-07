import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ProductGrid from '../components/ProductGrid'
import { categories, getCategoryName, products } from '../data/products'
import { MIN_ORDER_QTY } from '../data/business'
import usePageMeta from '../hooks/usePageMeta'

const FILTER_ORDER = ['interior', 'exterior', 'lighting', 'electronics', 'wheels-tyres', 'care']
const FILTERS = [
  { id: 'all', label: 'All' },
  ...FILTER_ORDER.map((id) => ({ id, label: categories.find((c) => c.id === id)?.shortName ?? id })),
]

const matches = (product, query) => {
  if (!query) return true
  const haystack = `${product.name} ${product.description} ${getCategoryName(product.category)}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word))
}

export default function Products() {
  usePageMeta(
    'Wholesale Car Accessories | RK ENTERPRICES DELHI',
    `Browse wholesale car accessories — interior, exterior, lighting, electronics, wheels & tyres and car care. Minimum order ${MIN_ORDER_QTY} pieces per product.`,
  )

  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('category')
  const active = FILTERS.some((f) => f.id === requested) ? requested : 'all'
  // Category lives in the URL (shareable, used by footer/category links);
  // the search text is local so typing never races URL updates.
  const [query, setQuery] = useState('')

  const visible = useMemo(
    () => products.filter((p) => (active === 'all' || p.category === active) && matches(p, query.trim())),
    [active, query],
  )

  const selectCategory = (id) => setSearchParams(id === 'all' ? {} : { category: id }, { replace: true })

  const activeLabel = active === 'all' ? 'All products' : getCategoryName(active)

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Our products"
        subtitle="Wholesale automotive accessories for every requirement."
      >
        <ul className="header-facts">
          <li>MOQ {MIN_ORDER_QTY} pcs per product</li>
          <li>Price on request</li>
          <li>LR within 24 hrs</li>
        </ul>
      </PageHeader>

      <section className="section section--light section--tight-top">
        <div className="container">
          <div className="catalog-toolbar">
            <div className="filter-bar" role="group" aria-label="Filter by category">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`chip${active === f.id ? ' is-active' : ''}`}
                  aria-pressed={active === f.id}
                  onClick={() => selectCategory(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="search-field">
              <Search size={18} className="search-field__icon" aria-hidden="true" />
              <input
                type="search"
                className="search-field__input"
                placeholder="Search products"
                aria-label="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="search-field__clear"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <p className="catalog-count" aria-live="polite">
            <strong>{activeLabel}</strong> · {visible.length} product{visible.length === 1 ? '' : 's'}
            {query && <> matching “{query}”</>}
          </p>

          <ProductGrid
            products={visible}
            emptyMessage="No products match your search. Try another term or category."
          />
        </div>
      </section>
    </>
  )
}
