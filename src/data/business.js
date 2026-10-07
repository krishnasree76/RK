// Single source of truth for business details and the factual content used
// across the site. Only real business information belongs here — no invented
// awards, years, customer counts or reviews.
export const BUSINESS = {
  name: 'RK Enterprices Delhi',
  shortName: 'RK Enterprices',
  seoName: 'RK ENTERPRICES DELHI',
  tagline: 'Wholesale supplier of all types of car accessories',
  phone: '9515289991',
  phoneDisplay: '+91 95152 89991',
  phoneHref: 'tel:+919515289991',
  whatsappNumber: '919515289991',
  email: 'krishnadoddi969@gmail.com',
  address: 'Kashmere Gate, Delhi - 110006',
  hours: 'Open 24/7 — weekdays & weekends',
  hoursShort: 'Open 24/7',
  lrNote: 'LR number shared within 24 hours of dispatch',
}

// Wholesale rule: every line item must be at least this many pieces.
export const MIN_ORDER_QTY = 50

export const whatsappLink = (message = '') =>
  `https://wa.me/${BUSINESS.whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`

export const mailtoLink = (subject = '') =>
  `mailto:${BUSINESS.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`

/* ---------------------------------------------------------------------------
   Page content (icons are referenced by key and resolved in the components)
   ------------------------------------------------------------------------ */

export const HOME_STATS = [
  { value: `${MIN_ORDER_QTY}+`, label: 'Minimum order' },
  { value: '24 hrs', label: 'LR update' },
  { value: 'Pan India', label: 'Supply' },
  { value: '24/7', label: 'Availability' },
]

export const ABOUT_STATS = [
  { value: `${MIN_ORDER_QTY}+`, label: 'Pieces MOQ' },
  { value: '24 hrs', label: 'LR shared' },
  { value: '24/7', label: 'Open every day' },
  { value: 'Delhi', label: 'Kashmere Gate based' },
]

export const BENEFITS = [
  {
    icon: 'package',
    title: 'Wholesale-first',
    text: `Built for bulk buyers. Minimum order starts at ${MIN_ORDER_QTY} pieces per product.`,
  },
  {
    icon: 'layers',
    title: 'Quality range',
    text: 'A wide range of automotive accessories, from everyday essentials to premium upgrades.',
  },
  {
    icon: 'truck',
    title: 'Fast dispatch',
    text: 'LR number shared within 24 hours of dispatch, so you always know where your order is.',
  },
  {
    icon: 'map',
    title: 'Pan-India supply',
    text: 'Wholesale supply from Delhi to businesses across India.',
  },
]

export const ORDER_STEPS = [
  { title: 'Browse', text: 'Explore the automotive range by category or search.' },
  { title: 'Select', text: `Choose products and the quantity you need — ${MIN_ORDER_QTY} pieces minimum each.` },
  { title: 'Order', text: 'Add products to your Order List and send it to us on WhatsApp.' },
  { title: 'Dispatch', text: 'We confirm pricing, dispatch your order and share LR details within 24 hours.' },
]

export const CONTACT_CHANNELS = [
  { key: 'phone', label: 'Phone', value: BUSINESS.phoneDisplay, href: BUSINESS.phoneHref, action: 'Call now' },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    value: BUSINESS.phoneDisplay,
    href: whatsappLink('Hi RK Enterprices, I have a wholesale enquiry.'),
    external: true,
    action: 'Chat on WhatsApp',
  },
  { key: 'email', label: 'Email', value: BUSINESS.email, href: mailtoLink('Wholesale enquiry'), action: 'Send email' },
  { key: 'address', label: 'Address', value: BUSINESS.address },
  { key: 'hours', label: 'Business hours', value: '24/7 — Weekdays & Weekends' },
]
