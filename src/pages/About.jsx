import PageHeader from '../components/PageHeader'
import StatsStrip from '../components/StatsStrip'
import CtaBanner from '../components/CtaBanner'
import { FEATURE_ICONS } from '../components/icons'
import { ABOUT_STATS, BENEFITS, BUSINESS, MIN_ORDER_QTY } from '../data/business'
import usePageMeta from '../hooks/usePageMeta'

const PILLARS = [
  { ...BENEFITS[0], title: 'Wholesale-first approach' },
  { ...BENEFITS[1], title: 'Wide automotive range' },
  { ...BENEFITS[2], title: 'Reliable dispatch communication' },
  { ...BENEFITS[3], title: 'Pan-India supply' },
]

export default function About() {
  usePageMeta(
    'About RK ENTERPRICES DELHI',
    'RK Enterprices Delhi is a wholesale supplier of car accessories based in Kashmere Gate, Delhi, supplying businesses across India.',
  )

  return (
    <>
      <PageHeader
        eyebrow="About us"
        title={`About ${BUSINESS.name}`}
        subtitle="Wholesale car accessories, supplied from the heart of Delhi."
      />

      <section className="section section--light" aria-labelledby="who-title">
        <div className="container about-intro">
          <div className="about-intro__head">
            <span className="eyebrow">Who we are</span>
            <h2 id="who-title" className="about-intro__title">A wholesale partner for the automotive trade</h2>
            <span className="accent-rule" aria-hidden="true" />
          </div>
          <div className="about-intro__body">
            <p className="about-intro__lead">
              {BUSINESS.name} is a wholesale supplier of car accessories based in Kashmere Gate, Delhi.
            </p>
            <p>
              We focus on supplying automotive accessories to businesses and customers who need wholesale
              quantities — retailers, workshops, resellers and fleet buyers. Every product is available with a
              minimum order of {MIN_ORDER_QTY} pieces, and pricing is quoted for your required quantity.
            </p>
            <p>
              We're available 24/7, weekdays and weekends, and share the LR number within 24 hours of dispatch so
              you can track every consignment.
            </p>
          </div>
        </div>

        <div className="container">
          <ul className="pillars">
            {PILLARS.map(({ icon, title, text }) => {
              const Icon = FEATURE_ICONS[icon]
              return (
                <li key={title} className="pillar">
                  <span className="pillar__icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.5} />
                  </span>
                  <h3 className="pillar__title">{title}</h3>
                  <p className="pillar__text">{text}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <StatsStrip stats={ABOUT_STATS} label="About RK Enterprices in numbers" />

      <CtaBanner
        eyebrow="Work with us"
        title="Looking for wholesale automotive accessories?"
        text="Share your requirement and we'll help you put together the right order."
        actions={[
          { to: '/contact', label: 'Contact us', variant: 'light', icon: true },
          { to: '/products', label: 'View products', variant: 'ghost' },
        ]}
      />
    </>
  )
}
