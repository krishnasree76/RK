import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ProductGrid from '../components/ProductGrid'
import ErrorState from '../components/ErrorState'
import { ProductGridSkeleton } from '../components/Skeletons'
import useCategories from '../hooks/useCategories'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useProductList from '../hooks/useProductList'
import usePageMeta from '../hooks/usePageMeta'

export default function Products() {
  usePageMeta(
    'Wholesale Car Accessories | RK ENTERPRICES DELHI',
    `Browse wholesale car accessories — interior, exterior, lighting, electronics, wheels & tyres and car care. Prices per piece on every product.`,
  )

  // Category lives in the URL (shareable; used by category links across the
  // site). The search text is local and debounced before hitting the API.
  const [searchParams, setSearchParams] = useSearchParams()
  const active = searchParams.get('category') || 'all'
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)

  const { categories, loading: categoriesLoading } = useCategories()
  const activeCategory = categories.find((c) => c.slug === active)
  const unknownCategory = active !== 'all' && !categoriesLoading && !activeCategory

  const list = useProductList({ category: active === 'all' ? undefined : active, search })

  const selectCategory = (slug) => setSearchParams(slug === 'all' ? {} : { category: slug }, { replace: true })
  const filters = [{ slug: 'all', name: 'All' }, ...categories]
  const activeLabel = active === 'all' ? 'All products' : activeCategory?.name ?? 'Category'

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Our products"
        subtitle="Wholesale automotive accessories for every requirement."
      >
        <ul className="header-facts">
          <li>Price per piece listed</li>
          <li>LR within 24 hrs</li>
          <li>Pan-India supply</li>
        </ul>
      </PageHeader>

      <section className="section section--light section--tight-top">
        <div className="container">
          <div className="catalog-toolbar">
            <div className="filter-bar" role="group" aria-label="Filter by category">
              {filters.map((f) => (
                <button
                  key={f.slug}
                  type="button"
                  className={`chip${active === f.slug ? ' is-active' : ''}`}
                  aria-pressed={active === f.slug}
                  onClick={() => selectCategory(f.slug)}
                >
                  {f.name}
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
                <button type="button" className="search-field__clear" onClick={() => setQuery('')} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {unknownCategory ? (
            <div className="empty-note">
              <p>This category doesn't exist or has been removed.</p>
              <Link to="/products" className="btn btn--dark btn--sm" onClick={() => selectCategory('all')}>
                View all products
              </Link>
            </div>
          ) : (
            <>
              <p className="catalog-count" aria-live="polite">
                <strong>{activeLabel}</strong>
                {!list.loading && !list.error && (
                  <>
                    {' '}· {list.count} product{list.count === 1 ? '' : 's'}
                    {search && <> matching “{search}”</>}
                  </>
                )}
              </p>

              {list.loading && <ProductGridSkeleton count={8} />}
              {list.error && (
                <ErrorState title="Products unavailable" message="We couldn't load the catalogue right now." onRetry={list.reload} />
              )}
              {!list.loading && !list.error && (
                <ProductGrid
                  products={list.products}
                  emptyMessage={search ? 'No products match your search. Try another term or category.' : 'No products in this category yet.'}
                />
              )}

              {list.hasMore && !list.loading && (
                <div className="load-more">
                  <p className="load-more__status">
                    Showing {list.products.length} of {list.count}
                  </p>
                  <button type="button" className="btn btn--outline" onClick={list.loadMore} disabled={list.loadingMore}>
                    {list.loadingMore ? 'Loading…' : 'Load more products'}
                  </button>
                  {list.moreError && <p className="field__error">Couldn't load more products. Please try again.</p>}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
