import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BUSINESS } from '../data/business'

// Editorial brand statement directly below the hero.
export default function TradeIntro() {
  return (
    <section className="section section--light trade-intro" aria-labelledby="trade-intro-title">
      <div className="container trade-intro__grid">
        <div className="trade-intro__head">
          <span className="eyebrow">{BUSINESS.name}</span>
          <h2 id="trade-intro-title" className="trade-intro__title">
            Built for the <span className="trade-intro__title-accent">automotive trade</span>
          </h2>
        </div>

        <div className="trade-intro__body">
          <span className="accent-rule" aria-hidden="true" />
          <p className="trade-intro__lead">
            From everyday essentials to premium automotive accessories, {BUSINESS.name} supplies businesses
            with quality products at wholesale quantities.
          </p>
          <p className="trade-intro__text">
            Based at Kashmere Gate, Delhi, we work with retailers, workshops and resellers who need dependable
            stock, clear communication and dispatch they can track.
          </p>
          <div className="trade-intro__links">
            <Link to="/products" className="link-arrow">
              Explore the range <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/about" className="link-arrow link-arrow--muted">
              About us <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
