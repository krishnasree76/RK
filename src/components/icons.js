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

// Data files reference icons by key so they stay free of presentation code.
export const CATEGORY_ICONS = {
  'wheels-tyres': Disc3,
  lighting: Lightbulb,
  interior: Armchair,
  exterior: Car,
  electronics: Radio,
  care: SprayCan,
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

export const getCategoryIcon = (categoryId) => CATEGORY_ICONS[categoryId] ?? Car
