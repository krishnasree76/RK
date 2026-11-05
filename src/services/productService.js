import { apiGet } from './api'
import { toPaise } from '../utils/price'

export const PRODUCTS_PAGE_SIZE = 12

// API → UI shape used by ProductCard / ProductDetails / the Order List.
export const normalizeProduct = (p) => ({
  id: p.slug,
  slug: p.slug,
  name: p.name,
  pricePerPiece: p.price_per_piece ?? null,
  pricePaise: toPaise(p.price_per_piece),
  hasMinimumOrder: Boolean(p.has_minimum_order),
  // Effective minimum from the API: the product's minimum, or 1.
  minQty: Math.max(1, Number(p.min_order_quantity) || 1),
  stock: Math.max(0, Number(p.stock) || 0),
  // Enough stock to meet the minimum quantity.
  inStock: Boolean(p.in_stock),
  description: p.description || '',
  category: p.category ? { id: p.category.id, slug: p.category.slug, name: p.category.name } : null,
  image: p.image || null,
  features: p.features ?? [],
  specs: (p.specifications ?? []).map((s) => [s.label, s.value]),
  isFeatured: Boolean(p.is_featured),
})

export async function getProducts({ category, search, featured, slugs, page = 1, pageSize = PRODUCTS_PAGE_SIZE } = {}, options) {
  const data = await apiGet('/products/', {
    ...options,
    params: {
      category,
      search: search?.trim(),
      featured: featured ? 'true' : undefined,
      slugs,
      page,
      page_size: pageSize,
    },
  })
  return {
    count: data.count,
    hasMore: Boolean(data.next),
    results: data.results.map(normalizeProduct),
  }
}

export const getProduct = (slug, options) =>
  apiGet(`/products/${encodeURIComponent(slug)}/`, options).then(normalizeProduct)

// Products flagged "featured" in the admin; falls back to the first products
// so the homepage section is never empty while the catalogue is being set up.
export async function getFeaturedProducts(limit = 6, options) {
  const featured = await getProducts({ featured: true, pageSize: limit }, options)
  if (featured.results.length) return featured.results
  return (await getProducts({ pageSize: limit }, options)).results
}

export async function getRelatedProducts(product, limit = 4, options) {
  if (!product?.category) return []
  const { results } = await getProducts({ category: product.category.slug, pageSize: limit + 1 }, options)
  return results.filter((p) => p.slug !== product.slug).slice(0, limit)
}

// Fresh data for specific products (used to refresh prices/minimums in the Order List).
export async function getProductsBySlugs(slugs, options) {
  if (!slugs.length) return []
  const { results } = await getProducts({ slugs: slugs.join(','), pageSize: 100 }, options)
  return results
}
