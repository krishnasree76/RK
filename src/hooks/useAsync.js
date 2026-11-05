import { useCallback, useEffect, useState } from 'react'

// Runs an async loader whenever `deps` change, cancelling stale requests.
// Returns { data, error, loading, reload }.
export default function useAsync(loader, deps) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ data: undefined, error: null, loading: true })

    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ data: undefined, error, loading: false })
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, reload }
}
