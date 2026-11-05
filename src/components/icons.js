import {
  Armchair,
  Car,
  Clock,
  Disc3,
  Layers,
  Lightbulb,
  Mail,
  Map as MapIcon,
  MapPin,
  Package,
  Phone,
  Radio,
  SprayCan,
  Truck,
} from 'lucide-react'
import WhatsAppIcon from './WhatsAppIcon'

// Categories are managed in the admin, so placeholder icons are chosen by
// keywords in the category slug/name rather than fixed ids.
const CATEGORY_ICON_RULES = [
  [/wheel|tyre|tire|rim/i, Disc3],
  [/light|lamp|led|bulb/i, Lightbulb],
  [/interior|seat|mat|steering/i, Armchair],
  [/electronic|stereo|camera|audio|charger|gps/i, Radio],
  [/care|clean|polish|wash|detail/i, SprayCan],
  [/exterior|body|cover|visor|guard/i, Car],
]

export const getCategoryIcon = (category) => {
  const key = typeof category === 'string' ? category : `${category?.slug ?? ''} ${category?.name ?? ''}`
  return CATEGORY_ICON_RULES.find(([pattern]) => pattern.test(key))?.[1] ?? Car
}

export const FEATURE_ICONS = {
  package: Package,
  layers: Layers,
  truck: Truck,
  map: MapIcon,
}

export const CONTACT_ICONS = {
  phone: Phone,
  whatsapp: WhatsAppIcon,
  email: Mail,
  address: MapPin,
  hours: Clock,
}
