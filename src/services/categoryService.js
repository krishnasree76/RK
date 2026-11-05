import { apiGet } from './api'

// API → UI shape used by CategoryCard, filters and the footer.
export const normalizeCategory = (c) => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  tagline: c.description || '',
  image: c.image || null,
  productCount: c.product_count ?? 0,
})

// Categories are a short list used on many screens (homepage, filters,
// footer), so one request is shared per page load. Failures are not cached.
let categoriesPromise = null

export function getCategories() {
  if (!categoriesPromise) {
    categoriesPromise = apiGet('/categories/')
      .then((list) => list.map(normalizeCategory))
      .catch((error) => {
        categoriesPromise = null
        throw error
      })
  }
  return categoriesPromise
}

export const getCategory = (slug, options) =>
  apiGet(`/categories/${encodeURIComponent(slug)}/`, options).then(normalizeCategory)
