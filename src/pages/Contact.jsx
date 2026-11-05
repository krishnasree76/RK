import { Clock, Phone, Truck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ContactCards from '../components/ContactCards'
import ContactForm from '../components/ContactForm'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { BUSINESS, whatsappLink } from '../data/business'
import usePageMeta from '../hooks/usePageMeta'

export default function Contact() {
  usePageMeta(
    'Contact RK ENTERPRICES DELHI',
    `Contact RK Enterprices Delhi for wholesale car accessories. Call or WhatsApp ${BUSINESS.phoneDisplay}. Kashmere Gate, Delhi. Open 24/7.`,
  )

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        subtitle={`Looking for wholesale automotive accessories? Talk to ${BUSINESS.seoName}.`}
      />

      <section className="section section--light section--tight-top">
        <div className="container">
          <ContactCards className="contact-cards--page" />

          <div className="enquiry">
            <div className="enquiry__form">
              <span className="eyebrow">Enquiry form</span>
              <h2 className="enquiry__title">Send us your requirement</h2>
              <p className="enquiry__intro">
                Tell us the products and quantities you need and we'll get back to you.
              </p>
              <ContactForm />
            </div>

            <aside className="enquiry__aside" aria-label="Quick contact">
              <h2 className="enquiry__aside-title">Prefer a quick chat?</h2>
              <p>WhatsApp is the fastest way to share product lists, photos and quantities with our team.</p>
              <a
                href={whatsappLink('Hi RK Enterprices, I have a wholesale enquiry.')}
                className="btn btn--light btn--block btn--lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon size={18} /> WhatsApp us
              </a>
              <a href={BUSINESS.phoneHref} className="btn btn--ghost btn--block">
                <Phone size={18} aria-hidden="true" /> {BUSINESS.phoneDisplay}
              </a>
              <ul className="enquiry__facts">
                <li><Truck size={16} aria-hidden="true" /> {BUSINESS.lrNote}</li>
                <li><Clock size={16} aria-hidden="true" /> {BUSINESS.hours}</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
