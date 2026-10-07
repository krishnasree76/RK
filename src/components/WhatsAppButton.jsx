import WhatsAppIcon from './WhatsAppIcon'
import { whatsappLink } from '../data/business'

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappLink('Hi RK Enterprices, I would like a wholesale price list.')}
      className="whatsapp-fab"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  )
}
