import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from './SectionHeading'
import ContactCards from './ContactCards'

// Homepage contact preview shown just above the footer.
export default function ContactSection() {
  return (
    <section className="section section--light" aria-labelledby="contact-preview-title">
      <div className="container">
        <div className="section-head-row">
          <SectionHeading
            id="contact-preview-title"
            eyebrow="Contact"
            title="Talk to our wholesale desk"
            subtitle="Call, WhatsApp or email us — we're available 24/7."
            align="left"
          />
          <Link to="/contact" className="link-arrow section-head-row__link">
            Send an enquiry <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ContactCards />
      </div>
    </section>
  )
}
