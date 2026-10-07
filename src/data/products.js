// Placeholder catalogue — replace with the client's real catalogue later.
//
// Images are picked up automatically: drop a file into src/assets/categories/
// or src/assets/products/ named after the category / product id (for example
// `wheels-tyres.jpg` or `android-stereo.webp`). Until a file exists the UI shows
// a styled dark placeholder, so there are never broken image requests.
const categoryImages = import.meta.glob('../assets/categories/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
})
const productImages = import.meta.glob('../assets/products/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
})

const findImage = (images, slug) =>
  Object.entries(images).find(([path]) => path.split('/').pop().replace(/\.\w+$/, '') === slug)?.[1] ?? null

// Order here is the order used on the homepage category grid.
const CATEGORY_DATA = [
  {
    id: 'wheels-tyres',
    name: 'Wheels & Tyres',
    shortName: 'Wheels & Tyres',
    tagline: 'Inflators, wheel covers, repair kits and fitment essentials.',
  },
  {
    id: 'lighting',
    name: 'Car Lighting',
    shortName: 'Lighting',
    tagline: 'LED headlight bulbs, fog lamps and interior lighting.',
  },
  {
    id: 'interior',
    name: 'Interior Accessories',
    shortName: 'Interior',
    tagline: 'Seat covers, floor mats, steering covers and more.',
  },
  {
    id: 'exterior',
    name: 'Exterior Accessories',
    shortName: 'Exterior',
    tagline: 'Visors, body covers, guards and styling parts.',
  },
  {
    id: 'electronics',
    name: 'Car Electronics',
    shortName: 'Electronics',
    tagline: 'Stereos, cameras, chargers and in-car tech.',
  },
  {
    id: 'care',
    name: 'Car Care',
    shortName: 'Car Care',
    tagline: 'Cleaning, polishing and detailing supplies.',
  },
]

const PRODUCT_DATA = [
  // Wheels & Tyres
  {
    id: 'tyre-inflator',
    name: 'Portable Digital Tyre Inflator',
    category: 'wheels-tyres',
    featured: true,
    description:
      'Compact 12V tyre inflator with a digital pressure display and auto cut-off at the preset pressure. Runs from the car socket and suits cars, bikes and sports equipment.',
    features: ['Digital pressure display', 'Auto cut-off at preset pressure', 'Built-in LED work light', 'Multiple nozzle adaptors included'],
    specs: [
      ['Power', '12V car socket'],
      ['Display', 'Digital, PSI / BAR'],
      ['Compatibility', 'Cars, bikes, cycles'],
    ],
  },
  {
    id: 'wheel-covers',
    name: 'Universal Wheel Covers',
    category: 'wheels-tyres',
    description:
      'Durable ABS wheel covers with a sporty finish that clip on over steel rims. Available in popular rim sizes for hatchbacks and sedans.',
    features: ['Impact-resistant ABS', 'Secure clip-on fitment', 'Multiple designs and finishes', 'Sold in sets of four'],
    specs: [
      ['Material', 'ABS plastic'],
      ['Sizes', '13", 14", 15"'],
      ['Set', '4 covers'],
    ],
  },
  {
    id: 'tubeless-repair-kit',
    name: 'Tubeless Tyre Puncture Repair Kit',
    category: 'wheels-tyres',
    description:
      'Complete roadside puncture repair kit for tubeless tyres, with T-handle tools and repair strips packed in a compact case.',
    features: ['T-handle reamer and insert tools', 'Self-vulcanising repair strips', 'Compact carry case', 'No wheel removal needed'],
    specs: [
      ['Tyre type', 'Tubeless'],
      ['Contents', 'Tools, strips, lubricant'],
      ['Case', 'Hard plastic'],
    ],
  },

  // Lighting
  {
    id: 'led-headlight-bulbs',
    name: 'LED Headlight Bulbs',
    category: 'lighting',
    featured: true,
    description:
      'High-output LED conversion bulbs with a built-in cooling fan for a bright, white beam. Available in the most common fitments.',
    features: ['Bright white output', 'Built-in cooling fan', 'Plug-and-play installation', 'Long service life'],
    specs: [
      ['Fitments', 'H4, H7, H11, HB3'],
      ['Colour', 'Cool white'],
      ['Voltage', '12V'],
    ],
  },
  {
    id: 'led-fog-lamps',
    name: 'LED Fog Lamps',
    category: 'lighting',
    description:
      'Weather-resistant LED fog lamps with a wide beam for low-visibility conditions. Supplied with mounting hardware and wiring.',
    features: ['Wide, low beam pattern', 'Weather-resistant housing', 'Mounting kit included', 'Universal and model-specific options'],
    specs: [
      ['Type', 'LED'],
      ['Housing', 'Aluminium / ABS'],
      ['Voltage', '12V'],
    ],
  },
  {
    id: 'ambient-led-strip',
    name: 'Interior Ambient LED Strip',
    category: 'lighting',
    description:
      'Multi-colour ambient lighting strips for footwells and dashboards, with remote and app control options.',
    features: ['Multiple colour modes', 'Remote / app control', 'Flexible adhesive strips', 'USB or 12V power'],
    specs: [
      ['Power', 'USB / 12V'],
      ['Control', 'Remote, app'],
      ['Fitment', 'Universal'],
    ],
  },

  // Interior
  {
    id: 'premium-seat-covers',
    name: 'Premium Leatherette Seat Covers',
    category: 'interior',
    featured: true,
    description:
      'Custom-fit leatherette seat covers with double stitching and foam padding. Available for popular hatchbacks, sedans and SUVs.',
    features: ['Model-specific fit', 'Double-stitched seams', 'Foam-padded comfort', 'Easy to clean surface'],
    specs: [
      ['Material', 'Leatherette'],
      ['Fitment', 'Model-specific'],
      ['Set', 'Full car set'],
    ],
  },
  {
    id: '7d-floor-mats',
    name: '7D Floor Mats',
    category: 'interior',
    featured: true,
    description:
      'Full-coverage, waterproof 7D floor mats with anti-slip backing that protect the original flooring and are easy to clean.',
    features: ['Edge-to-edge coverage', 'Waterproof surface', 'Anti-slip backing', 'Model-specific moulding'],
    specs: [
      ['Type', '7D moulded'],
      ['Fitment', 'Model-specific'],
      ['Set', 'Front and rear'],
    ],
  },
  {
    id: 'steering-wheel-cover',
    name: 'Steering Wheel Cover',
    category: 'interior',
    description:
      'Breathable, sweat-resistant steering wheel covers with a firm grip, in multiple colours and universal sizes.',
    features: ['Anti-slip grip', 'Breathable material', 'Universal stretch fit', 'Multiple colours'],
    specs: [
      ['Size', 'Universal (37–38 cm)'],
      ['Material', 'Leatherette / suede'],
      ['Fitment', 'Universal'],
    ],
  },

  // Exterior
  {
    id: 'chrome-door-visors',
    name: 'Chrome-Line Door Visors',
    category: 'exterior',
    description:
      'Impact-resistant rain visors with a chrome strip finish that let you keep windows slightly open in the rain. Model-specific fitment.',
    features: ['Chrome strip finish', 'Impact-resistant acrylic', 'Adhesive tape fitment', 'Set of four'],
    specs: [
      ['Material', 'Acrylic'],
      ['Fitment', 'Model-specific'],
      ['Set', '4 visors'],
    ],
  },
  {
    id: 'body-cover',
    name: 'Waterproof Car Body Cover',
    category: 'exterior',
    description:
      'Triple-layer, UV-protected car body covers with an elastic hem and mirror pockets for a snug fit.',
    features: ['Water-resistant fabric', 'UV protection', 'Elastic hem', 'Mirror pockets'],
    specs: [
      ['Material', 'Triple-layer fabric'],
      ['Fitment', 'Model-specific sizes'],
      ['Includes', 'Storage bag'],
    ],
  },
  {
    id: 'door-edge-guards',
    name: 'Door Edge Guards',
    category: 'exterior',
    description:
      'Flexible door edge guards that protect paint from chips and scratches when doors are opened in tight spaces.',
    features: ['Protects door edges', 'Flexible, easy fitment', 'Clear and coloured options', 'Weather-resistant'],
    specs: [
      ['Material', 'Rubber / PVC'],
      ['Fitment', 'Universal'],
      ['Set', '4 guards'],
    ],
  },

  // Electronics
  {
    id: 'android-stereo',
    name: 'Android Touchscreen Stereo',
    category: 'electronics',
    featured: true,
    description:
      'Android head units with a large touchscreen, GPS navigation, Bluetooth and support for Apple CarPlay and Android Auto.',
    features: ['Large touchscreen display', 'GPS navigation', 'Bluetooth calling and music', 'CarPlay / Android Auto support'],
    specs: [
      ['Screen', '9" / 10"'],
      ['Connectivity', 'Bluetooth, Wi-Fi, USB'],
      ['Fitment', 'Model-specific frames'],
    ],
  },
  {
    id: 'reverse-camera',
    name: 'HD Reverse Parking Camera',
    category: 'electronics',
    featured: true,
    description:
      'Night-vision reverse parking camera with guidelines for safer parking. Universal mounting kit included.',
    features: ['HD night vision', 'Parking guidelines', 'Wide viewing angle', 'Universal mounting kit'],
    specs: [
      ['Resolution', 'HD'],
      ['Mount', 'Universal'],
      ['Weatherproofing', 'Water-resistant'],
    ],
  },
  {
    id: 'fast-car-charger',
    name: 'Dual-Port Fast Car Charger',
    category: 'electronics',
    description:
      'Compact car charger with USB-A and USB-C fast-charging ports, suitable for phones and tablets.',
    features: ['USB-A and USB-C ports', 'Fast charging support', 'Compact metal body', 'Overcharge protection'],
    specs: [
      ['Ports', 'USB-A + USB-C'],
      ['Input', '12V / 24V'],
      ['Body', 'Metal'],
    ],
  },

  // Car Care
  {
    id: 'microfiber-kit',
    name: 'Microfiber Cleaning Kit',
    category: 'care',
    description:
      'Lint-free microfiber cloths, wash mitts and applicators that are safe on paint, glass and interior surfaces.',
    features: ['Lint-free microfiber', 'Scratch-safe on paint', 'Reusable and washable', 'Multi-piece kit'],
    specs: [
      ['Material', 'Microfiber'],
      ['Contents', 'Cloths, mitt, applicators'],
      ['Use', 'Exterior and interior'],
    ],
  },
  {
    id: 'car-wash-shampoo',
    name: 'Car Wash Shampoo',
    category: 'care',
    description: 'pH-balanced, high-foam car wash shampoo that lifts dirt without stripping wax or protection.',
    features: ['High-foam formula', 'pH-balanced', 'Safe on wax and coatings', 'Concentrated'],
    specs: [
      ['Type', 'Concentrate'],
      ['Use', 'Bucket / foam wash'],
      ['Sizes', 'Multiple pack sizes'],
    ],
  },
  {
    id: 'dashboard-polish',
    name: 'Dashboard & Tyre Polish',
    category: 'care',
    description: 'Restores shine to dashboards, trims and tyres with a non-greasy, dust-resistant finish.',
    features: ['Non-greasy finish', 'Dust-resistant', 'For dashboards, trims and tyres', 'Easy spray application'],
    specs: [
      ['Type', 'Spray polish'],
      ['Finish', 'Satin shine'],
      ['Use', 'Interior trims, tyres'],
    ],
  },
]

export const categories = CATEGORY_DATA.map((c) => ({
  ...c,
  image: findImage(categoryImages, c.id),
  productCount: PRODUCT_DATA.filter((p) => p.category === c.id).length,
}))

export const products = PRODUCT_DATA.map((p) => ({
  featured: false,
  ...p,
  image: findImage(productImages, p.id),
}))

export const featuredProducts = products.filter((p) => p.featured).slice(0, 6)

export const getProductById = (id) => products.find((p) => p.id === id)

export const getCategory = (categoryId) => categories.find((c) => c.id === categoryId)

export const getCategoryName = (categoryId) => getCategory(categoryId)?.name ?? 'Accessories'

// Same-category products first, topped up with others so the row is always full.
export const getRelatedProducts = (product, limit = 4) => {
  const same = products.filter((p) => p.category === product.category && p.id !== product.id)
  const others = products.filter((p) => p.category !== product.category)
  return [...same, ...others].slice(0, limit)
}
