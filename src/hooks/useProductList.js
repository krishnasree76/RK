import { useCallback, useEffect, useRef, useState } from 'react'
import { getProducts, PRODUCTS_PAGE_SIZE } from '../services/productService'

const INITIAL = { products: [], count: 0, page: 0, hasMore: false, loading: true, loadingMore: false, error: null, moreError: null }

// Paginated product list for the catalogue: loads page 1 whenever the
// filters change and appends further pages with loadMore().
export default function useProductList({ category, search }) {
  const [state, setState] = useState(INITIAL)
  const [attempt, setAttempt] = useState(0)
  const stateRef = useRef(state)
  const controllerRef = useRef(null)
  stateRef.current = state

  useEffect(() => {
    const controller = new AbortController()
    controllerRef.current = controller
    setState(INITIAL)

    getProducts({ category, search, page: 1, pageSize: PRODUCTS_PAGE_SIZE }, { signal: controller.signal })
      .then(({ results, count, hasMore }) => {
        if (!controller.signal.aborted) setState({ ...INITIAL, products: results, count, hasMore, page: 1, loading: false })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ ...INITIAL, loading: false, error })
      })

    return () => controller.abort()
  }, [category, search, attempt])

  const loadMore = useCallback(() => {
    const current = stateRef.current
    const controller = controllerRef.current
    if (current.loading || current.loadingMore || !current.hasMore || !controller) return

    const nextPage = current.page + 1
    setState((s) => ({ ...s, loadingMore: true, moreError: null }))
    getProducts({ category, search, page: nextPage, pageSize: PRODUCTS_PAGE_SIZE }, { signal: controller.signal })
      .then(({ results, count, hasMore }) => {
        if (controller.signal.aborted) return
        setState((s) => ({ ...s, products: [...s.products, ...results], count, hasMore, page: nextPage, loadingMore: false }))
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState((s) => ({ ...s, loadingMore: false, moreError: error }))
      })
  }, [category, search])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, loadMore, reload }
}
