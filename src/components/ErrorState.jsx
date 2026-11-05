import { RefreshCw, TriangleAlert } from 'lucide-react'
import { BUSINESS } from '../data/business'

// Friendly failure message for API-driven sections, with a retry action.
export default function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this right now.",
  onRetry,
  compact = false,
  tone = 'light',
}) {
  return (
    <div className={`error-state error-state--${tone}${compact ? ' error-state--compact' : ''}`} role="alert">
      <TriangleAlert size={compact ? 22 : 32} strokeWidth={1.5} aria-hidden="true" />
      <div className="error-state__copy">
        <p className="error-state__title">{title}</p>
        <p className="error-state__text">
          {message} You can also reach us on <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.
        </p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn--outline btn--sm error-state__retry" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  )
}
