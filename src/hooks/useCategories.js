import useAsync from './useAsync'
import { getCategories } from '../services/categoryService'

// Shared category list (one request per page load, see categoryService).
export default function useCategories() {
  const { data, ...rest } = useAsync(() => getCategories(), [])
  return { categories: data ?? [], ...rest }
}
