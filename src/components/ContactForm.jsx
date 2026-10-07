import { useState } from 'react'
import { CircleCheck, Phone, Send } from 'lucide-react'
import WhatsAppIcon from './WhatsAppIcon'
import { BUSINESS, whatsappLink } from '../data/business'
import { submitEnquiry, validateEnquiry } from '../services/enquiry'

const EMPTY = { name: '', phone: '', email: '', message: '' }

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', inputMode: 'tel', required: true },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', hint: 'Optional' },
]

const enquiryMessage = ({ name, phone, email, message }) =>
  [
    `Hi ${BUSINESS.shortName}, wholesale enquiry from ${name.trim()}.`,
    `Phone: ${phone.trim()}`,
    ...(email.trim() ? [`Email: ${email.trim()}`] : []),
    '',
    message.trim(),
  ].join('\n')

export default function ContactForm() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | done | error
  const [delivered, setDelivered] = useState(false)

  const update = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validateEnquiry(values)
    setErrors(found)
    if (Object.keys(found).length) {
      e.currentTarget.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus()
      return
    }
    setStatus('submitting')
    try {
      const result = await submitEnquiry(values)
      setDelivered(result.delivered)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="form-success" role="status">
        <CircleCheck size={40} strokeWidth={1.5} aria-hidden="true" />
        <h3>Thanks, {values.name.trim().split(' ')[0]}.</h3>
        {delivered ? (
          <p>Your enquiry has been sent. Our team will get back to you shortly.</p>
        ) : (
          <p>
            Your enquiry is ready. Online form delivery is still being connected, so please send it to us on
            WhatsApp or call us to make sure it reaches our team right away.
          </p>
        )}
        <div className="btn-row btn-row--center">
          {!delivered && (
            <a
              href={whatsappLink(enquiryMessage(values))}
              className="btn btn--dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon size={18} /> Send on WhatsApp
            </a>
          )}
          <a href={BUSINESS.phoneHref} className="btn btn--outline">
            <Phone size={18} aria-hidden="true" /> Call {BUSINESS.phoneDisplay}
          </a>
        </div>
        <button
          type="button"
          className="btn btn--text"
          onClick={() => {
            setValues(EMPTY)
            setStatus('idle')
          }}
        >
          Write another enquiry
        </button>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form__grid">
        {FIELDS.map((f) => (
          <div key={f.name} className={`field${errors[f.name] ? ' field--error' : ''}`}>
            <label htmlFor={`enquiry-${f.name}`} className="field__label">
              {f.label}
              {f.required ? <span className="field__req" aria-hidden="true"> *</span> : <span className="field__hint"> ({f.hint})</span>}
            </label>
            <input
              id={`enquiry-${f.name}`}
              name={f.name}
              type={f.type}
              autoComplete={f.autoComplete}
              inputMode={f.inputMode}
              className="field__input"
              value={values[f.name]}
              onChange={update}
              required={f.required}
              aria-invalid={Boolean(errors[f.name])}
              aria-describedby={errors[f.name] ? `enquiry-${f.name}-error` : undefined}
            />
            {errors[f.name] && (
              <p className="field__error" id={`enquiry-${f.name}-error`}>{errors[f.name]}</p>
            )}
          </div>
        ))}

        <div className={`field field--full${errors.message ? ' field--error' : ''}`}>
          <label htmlFor="enquiry-message" className="field__label">
            Message<span className="field__req" aria-hidden="true"> *</span>
          </label>
          <textarea
            id="enquiry-message"
            name="message"
            rows={5}
            className="field__input field__input--textarea"
            placeholder="Products, quantities (minimum 50 pcs each) and delivery city"
            value={values.message}
            onChange={update}
            required
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'enquiry-message-error' : undefined}
          />
          {errors.message && (
            <p className="field__error" id="enquiry-message-error">{errors.message}</p>
          )}
        </div>
      </div>

      {status === 'error' && (
        <p className="form-alert" role="alert">
          Something went wrong. Please try again, or contact us on WhatsApp.
        </p>
      )}

      <div className="contact-form__footer">
        <button type="submit" className="btn btn--dark btn--lg" disabled={status === 'submitting'}>
          <Send size={18} aria-hidden="true" />
          {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
        </button>
        <p className="contact-form__note">* Required fields</p>
      </div>
    </form>
  )
}
