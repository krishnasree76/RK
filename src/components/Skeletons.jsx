// Loading placeholders that mirror the real layouts so content doesn't jump.

export function ProductGridSkeleton({ count = 6, className = '' }) {
  return (
    <div className={`product-grid ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="product-card product-card--skeleton">
          <div className="product-card__media skeleton" />
          <div className="product-card__body">
            <span className="skeleton skeleton--line" style={{ width: '45%' }} />
            <span className="skeleton skeleton--title" />
            <span className="skeleton skeleton--line" style={{ width: '70%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CategoryGridSkeleton({ count = 6 }) {
  return (
    <div className="category-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`category-card category-card--skeleton${i === 0 ? ' category-card--large' : ''}${i === count - 1 ? ' category-card--span-4 category-card--tablet-wide' : ''}`} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <section className="section section--light pdp" aria-busy="true" aria-label="Loading product">
      <div className="container">
        <span className="skeleton skeleton--line" style={{ width: 220, marginBottom: 28 }} />
        <div className="pdp__grid">
          <div className="pdp__media skeleton" />
          <div className="pdp__info">
            <span className="skeleton skeleton--line" style={{ width: '30%' }} />
            <span className="skeleton skeleton--heading" />
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line" style={{ width: '80%' }} />
            <span className="skeleton skeleton--block" />
          </div>
        </div>
      </div>
    </section>
  )
}
