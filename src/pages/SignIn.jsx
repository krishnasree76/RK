import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ClipboardList, Eye, EyeOff, Phone, ShieldCheck, Truck } from 'lucide-react'
import logo from '../assets/logo.png'
import GoogleSignInButton, { isGoogleSignInEnabled } from '../components/GoogleSignInButton'
import { BUSINESS } from '../data/business'
import { safeNext, useAuth } from '../context/AuthContext'
import usePageMeta from '../hooks/usePageMeta'
import { login, loginWithGoogle, register } from '../services/authService'

const BENEFITS = [
  { icon: ClipboardList, text: 'Track every order and its status in one place' },
  { icon: Phone, text: 'Send your order list to us on WhatsApp in one tap' },
  { icon: Truck, text: 'LR number shared within 24 hours of dispatch' },
  { icon: ShieldCheck, text: 'Your details are only used for your orders' },
]

const EMPTY = { name: '', email: '', phone: '', identifier: '', password: '' }

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id} className="field__label">{label}</label>
      {children}
      {error ? (
        <p className="field__error" id={`${id}-error`}>{error}</p>
      ) : (
        hint && <p className="field__hint-text">{hint}</p>
      )}
    </div>
  )
}

export default function SignIn() {
  const [params, setParams] = useSearchParams()
  const mode = params.get('mode') === 'signup' ? 'signup' : 'signin'
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const { isAuthenticated, completeAuth } = useAuth()

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  usePageMeta(
    mode === 'signup' ? 'Create account | RK ENTERPRICES DELHI' : 'Sign in | RK ENTERPRICES DELHI',
    'Sign in to RK Enterprices Delhi to place and track your wholesale orders.',
  )

  if (isAuthenticated) return <Navigate to={next} replace />

  const switchMode = (nextMode) => {
    setErrors({})
    setFormError('')
    const updated = new URLSearchParams(params)
    if (nextMode === 'signup') updated.set('mode', 'signup')
    else updated.delete('mode')
    setParams(updated, { replace: true })
  }

  const update = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }))
  }

  const finish = (data) => {
    completeAuth(data)
    navigate(next, { replace: true })
  }

  const handleError = (error, fieldMap = {}) => {
    const fields = error?.fieldErrors ?? {}
    setErrors(Object.fromEntries(Object.entries(fields).map(([k, v]) => [fieldMap[k] ?? k, v])))
    setFormError(Object.keys(fields).length ? '' : error?.message || 'Something went wrong. Please try again.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const required = mode === 'signup' ? ['name', 'email', 'phone', 'password'] : ['identifier', 'password']
    const missing = Object.fromEntries(required.filter((k) => !values[k].trim()).map((k) => [k, 'This field is required.']))
    if (Object.keys(missing).length) {
      setErrors(missing)
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const data =
        mode === 'signup'
          ? await register({ name: values.name, email: values.email, phone: values.phone, password: values.password })
          : await login({ identifier: values.identifier, password: values.password })
      finish(data)
    } catch (error) {
      handleError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async (credential) => {
    setFormError('')
    setSubmitting(true)
    try {
      finish(await loginWithGoogle(credential))
    } catch (error) {
      handleError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const passwordToggle = (
    <button
      type="button"
      className="field__toggle"
      onClick={() => setShowPassword((s) => !s)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )

  return (
    <section className="auth">
      <div className="auth__brand" aria-hidden="true">
        <div className="auth__brand-inner">
          <img src={logo} alt="" width="640" height="216" className="auth__logo" />
          <h2 className="auth__brand-title">
            Your wholesale <span className="text-accent">account</span>
          </h2>
          <ul className="auth__benefits">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon size={18} /> {text}
              </li>
            ))}
          </ul>
          <p className="auth__help">
            Need help? Call <span>{BUSINESS.phoneDisplay}</span>
          </p>
        </div>
      </div>

      <div className="auth__panel">
        <div className="auth__card">
          <div className="auth__tabs" role="tablist" aria-label="Account">
            <button type="button" role="tab" aria-selected={mode === 'signin'} className="auth__tab" onClick={() => switchMode('signin')}>
              Sign in
            </button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} className="auth__tab" onClick={() => switchMode('signup')}>
              Create account
            </button>
          </div>

          <h1 className="auth__title">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
          <p className="auth__intro">
            {mode === 'signup'
              ? 'Create an account to place orders and track them.'
              : 'Sign in to place orders and see your order history.'}
          </p>

          <GoogleSignInButton onCredential={handleGoogle} text={mode === 'signup' ? 'signup_with' : 'signin_with'} />
          {(isGoogleSignInEnabled || import.meta.env.DEV) && (
            <div className="auth__divider"><span>or with {mode === 'signup' ? 'your details' : 'email or phone'}</span></div>
          )}

          {formError && <p className="form-alert" role="alert">{formError}</p>}

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            {mode === 'signup' ? (
              <>
                <Field id="auth-name" label="Full name" error={errors.name}>
                  <input id="auth-name" name="name" className="field__input" autoComplete="name" value={values.name} onChange={update} aria-invalid={Boolean(errors.name)} />
                </Field>
                <Field id="auth-email" label="Email" error={errors.email}>
                  <input id="auth-email" name="email" type="email" className="field__input" autoComplete="email" value={values.email} onChange={update} aria-invalid={Boolean(errors.email)} />
                </Field>
                <Field id="auth-phone" label="Mobile number" error={errors.phone} hint="Used to confirm your orders on WhatsApp.">
                  <div className="field__prefixed">
                    <span className="field__prefix">+91</span>
                    <input id="auth-phone" name="phone" type="tel" inputMode="tel" className="field__input" autoComplete="tel-national" placeholder="98765 43210" value={values.phone} onChange={update} aria-invalid={Boolean(errors.phone)} />
                  </div>
                </Field>
              </>
            ) : (
              <Field id="auth-identifier" label="Email or mobile number" error={errors.identifier}>
                <input id="auth-identifier" name="identifier" className="field__input" autoComplete="username" value={values.identifier} onChange={update} aria-invalid={Boolean(errors.identifier)} />
              </Field>
            )}

            <Field id="auth-password" label="Password" error={errors.password} hint={mode === 'signup' ? 'At least 8 characters. Avoid common passwords.' : undefined}>
              <div className="field__with-toggle">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="field__input"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={values.password}
                  onChange={update}
                  aria-invalid={Boolean(errors.password)}
                />
                {passwordToggle}
              </div>
            </Field>

            <button type="submit" className="btn btn--dark btn--lg btn--block" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth__switch">
            {mode === 'signup' ? 'Already have an account?' : 'New to RK Enterprices?'}{' '}
            <button type="button" className="auth__link" onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}>
              {mode === 'signup' ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="auth__back">
            <Link to="/products">← Continue browsing products</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
