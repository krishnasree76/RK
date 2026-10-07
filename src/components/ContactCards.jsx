import { ArrowUpRight } from 'lucide-react'
import { CONTACT_ICONS } from './icons'
import { CONTACT_CHANNELS } from '../data/business'

// Lets long emails wrap after the @ instead of mid-word.
const breakAfterAt = (text) =>
  text.includes('@') ? (
    <>
      {text.split('@')[0]}@<wbr />
      {text.split('@')[1]}
    </>
  ) : (
    text
  )

// Phone / WhatsApp / Email / Address / Hours cards. Linked channels are clickable.
export default function ContactCards({ className = '' }) {
  return (
    <ul className={`contact-cards ${className}`}>
      {CONTACT_CHANNELS.map(({ key, label, value, href, external, action }) => {
        const Icon = CONTACT_ICONS[key]
        const content = (
          <>
            <span className="contact-card__icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <span className="contact-card__label">{label}</span>
            <span className="contact-card__value">{breakAfterAt(value)}</span>
            {action && (
              <span className="contact-card__action" aria-hidden="true">
                {action} <ArrowUpRight size={14} />
              </span>
            )}
          </>
        )

        return (
          <li key={key}>
            {href ? (
              <a
                href={href}
                className={`contact-card contact-card--link contact-card--${key}`}
                aria-label={`${action}: ${value}`}
                {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {content}
              </a>
            ) : (
              <div className={`contact-card contact-card--${key}`}>{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
