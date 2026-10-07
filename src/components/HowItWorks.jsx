import { Package } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { MIN_ORDER_QTY, ORDER_STEPS } from '../data/business'

export default function HowItWorks() {
  return (
    <section className="section section--white" aria-labelledby="process-title">
      <div className="container">
        <SectionHeading
          id="process-title"
          eyebrow="Ordering process"
          title="How wholesale ordering works"
          subtitle="Four simple steps from browsing to dispatch."
        />

        <ol className="process">
          {ORDER_STEPS.map((step, i) => (
            <li key={step.title} className="process__step">
              <span className="process__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="process__dot" aria-hidden="true" />
              <div className="process__body">
                <h3 className="process__title">{step.title}</h3>
                <p className="process__text">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="moq-note">
          <Package size={18} aria-hidden="true" />
          Minimum order quantity: <strong>{MIN_ORDER_QTY} pieces per product</strong>
        </p>
      </div>
    </section>
  )
}
