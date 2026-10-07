import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const DEFAULT_ACTIONS = [
  { to: '/products', label: 'Explore products', variant: 'light', icon: true },
  { to: '/contact', label: 'Contact us', variant: 'ghost' },
]

// Dark call-to-action band. Reused on Home and About with different copy.
export default function CtaBanner({
  eyebrow = 'Wholesale orders',
  title = 'Ready to order wholesale?',
  text = "Tell us what you need and we'll help you build your order.",
  actions = DEFAULT_ACTIONS,
}) {
  return (
    <section className="cta-banner" aria-labelledby="cta-title">
      <div className="cta-banner__media" aria-hidden="true" />
      <div className="container cta-banner__inner">
        <div className="cta-banner__copy">
          <span className="eyebrow">{eyebrow}</span>
          <h2 id="cta-title" className="cta-banner__title">{title}</h2>
          <p className="cta-banner__text">{text}</p>
        </div>
        <div className="cta-banner__actions">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className={`btn btn--${a.variant} btn--lg`}>
              {a.label}
              {a.icon && <ArrowRight size={18} aria-hidden="true" />}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
