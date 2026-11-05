import { useEffect, useRef, useState } from 'react'

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

export const isGoogleSignInEnabled = Boolean(CLIENT_ID)

let scriptPromise = null
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = resolve
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Google Sign-In could not be loaded.'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

// Official "Sign in with Google" button (Google Identity Services). Calls
// onCredential with the ID token, which the backend verifies.
export default function GoogleSignInButton({ onCredential, text = 'continue_with' }) {
  const containerRef = useRef(null)
  const callbackRef = useRef(onCredential)
  const [failed, setFailed] = useState(false)
  callbackRef.current = onCredential

  useEffect(() => {
    if (!CLIENT_ID) return undefined
    let cancelled = false
    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => callbackRef.current?.(response.credential),
          ux_mode: 'popup',
        })
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'center',
          width: Math.min(400, containerRef.current.offsetWidth || 320),
        })
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [text])

  if (!CLIENT_ID) {
    // Shown only during development until the Google client ID is configured.
    return import.meta.env.DEV ? (
      <p className="auth-google-note">Google sign-in appears here once VITE_GOOGLE_CLIENT_ID is set.</p>
    ) : null
  }

  return (
    <div className="auth-google">
      <div ref={containerRef} className="auth-google__button" />
      {failed && <p className="field__error">Google sign-in is unavailable right now. Please use email instead.</p>}
    </div>
  )
}
