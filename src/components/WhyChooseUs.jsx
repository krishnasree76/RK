import SectionHeading from './SectionHeading'
import { FEATURE_ICONS } from './icons'
import { BENEFITS } from '../data/business'

export default function WhyChooseUs() {
  return (
    <section className="section section--dark why" aria-labelledby="why-title">
      <div className="container">
        <SectionHeading
          id="why-title"
          eyebrow="Why wholesale buyers choose us"
          title="Why RK Enterprices?"
          tone="dark"
          align="left"
        />
        <ul className="why__list">
          {BENEFITS.map(({ icon, title, text }) => {
            const Icon = FEATURE_ICONS[icon]
            return (
              <li key={title} className="why__item">
                <span className="why__icon" aria-hidden="true">
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <h3 className="why__title">{title}</h3>
                <p className="why__text">{text}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
