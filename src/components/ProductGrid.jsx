import ProductCard from './ProductCard'

export default function ProductGrid({ products, emptyMessage = 'No products found.', className = '' }) {
  if (!products.length) {
    return <p className="empty-note">{emptyMessage}</p>
  }
  return (
    <div className={`product-grid ${className}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
