import { getCategoryIcon } from './icons'

// Renders the real photo when one exists, otherwise an intentional dark
// placeholder built from the category icon — never a broken image.
export default function ProductImage({ src, alt, category, label, className = '' }) {
  if (src) {
    return (
      <img src={src} alt={alt} className={`product-image ${className}`} loading="lazy" decoding="async" />
    )
  }

  const Icon = getCategoryIcon(category)
  return (
    <div className={`product-image media-placeholder ${className}`} role="img" aria-label={alt}>
      <Icon className="media-placeholder__icon" strokeWidth={1} aria-hidden="true" />
      {label && <span className="media-placeholder__label">{label}</span>}
    </div>
  )
}
