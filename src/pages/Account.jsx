import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardList, LogOut, Mail, Phone, Truck, UserRound } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ErrorState from '../components/ErrorState'
import { useAuth } from '../context/AuthContext'
import useAsync from '../hooks/useAsync'
import usePageMeta from '../hooks/usePageMeta'
import { listOrders } from '../services/orderService'
import { formatPaise, formatPieces, toPaise } from '../utils/price'

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

function ProfileCard() {
  const { user, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(!user.phone)
  const [values, setValues] = useState({ name: user.name || '', phone: user.phone ? user.phone.replace(/^\+91/, '') : '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const save = async (e) => {
    e.preventDefault()
    setStatus('saving')
    setErrors({})
    try {
      await updateProfile({ name: values.name, phone: values.phone })
      setStatus('saved')
      setEditing(false)
    } catch (error) {
      setErrors({ ...error.fieldErrors, form: Object.keys(error.fieldErrors).length ? '' : error.message })
      setStatus('idle')
    }
  }

  const handleSignOut = () => {
    // Leave the protected page first so its sign-in redirect doesn't kick in.
    navigate('/', { replace: true })
    signOut()
  }

  return (
    <aside className="account-card" aria-labelledby="profile-title">
      <div className="account-card__head">
        <span className="account-card__avatar" aria-hidden="true">
          {(user.name || user.email || '?').trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <h2 id="profile-title" className="account-card__name">{user.name}</h2>
          <p className="account-card__method">Signed in with {user.auth_provider === 'google' ? 'Google' : 'email & password'}</p>
        </div>
      </div>

      {!user.phone && !editing && (
        <p className="account-card__notice">Add your mobile number so we can confirm your orders.</p>
      )}

      {editing ? (
        <form className="account-card__form" onSubmit={save} noValidate>
          {!user.phone && <p className="account-card__notice">Add your mobile number so we can confirm your orders.</p>}
          {errors.form && <p className="form-alert" role="alert">{errors.form}</p>}
          <div className={`field${errors.name ? ' field--error' : ''}`}>
            <label htmlFor="profile-name" className="field__label">Full name</label>
            <input id="profile-name" className="field__input" value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} autoComplete="name" />
            {errors.name && <p className="field__error">{errors.name}</p>}
          </div>
          <div className={`field${errors.phone ? ' field--error' : ''}`}>
            <label htmlFor="profile-phone" className="field__label">Mobile number</label>
            <div className="field__prefixed">
              <span className="field__prefix">+91</span>
              <input id="profile-phone" type="tel" inputMode="tel" className="field__input" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} autoComplete="tel-national" placeholder="98765 43210" />
            </div>
            {errors.phone && <p className="field__error">{errors.phone}</p>}
          </div>
          <div className="btn-row">
            <button type="submit" className="btn btn--dark" disabled={status === 'saving'}>
              {status === 'saving' ? 'Saving…' : 'Save details'}
            </button>
            {user.phone && (
              <button type="button" className="btn btn--text" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <dl className="account-card__details">
          <div>
            <dt><Mail size={16} aria-hidden="true" /> Email</dt>
            <dd>{user.email || '—'}</dd>
          </div>
          <div>
            <dt><Phone size={16} aria-hidden="true" /> Mobile</dt>
            <dd>{user.phone || 'Not added'}</dd>
          </div>
        </dl>
      )}

      {status === 'saved' && !editing && <p className="account-card__saved" role="status">Details saved.</p>}

      <div className="account-card__actions">
        {!editing && (
          <button type="button" className="btn btn--outline btn--block" onClick={() => setEditing(true)}>
            <UserRound size={18} aria-hidden="true" /> Edit details
          </button>
        )}
        <button type="button" className="btn btn--text btn--block" onClick={handleSignOut}>
          <LogOut size={18} aria-hidden="true" /> Sign out
        </button>
      </div>
    </aside>
  )
}

function OrderCard({ order }) {
  return (
    <li className="order-card">
      <div className="order-card__head">
        <div>
          <p className="order-card__number">{order.number}</p>
          <p className="order-card__date">{dateFormat.format(new Date(order.created_at))}</p>
        </div>
        <span className={`status-badge status-badge--${order.status}`}>{order.status_label}</span>
      </div>
      <ul className="order-card__items">
        {order.items.map((item) => (
          <li key={item.product_slug + item.product_name}>
            <Link to={`/products/${item.product_slug}`}>{item.product_name}</Link>
            <span>
              {formatPieces(item.quantity)} × {formatPaise(toPaise(item.unit_price))}
            </span>
            <strong>{formatPaise(toPaise(item.line_total))}</strong>
          </li>
        ))}
      </ul>
      <div className="order-card__foot">
        <span>
          {formatPieces(order.total_quantity)}
          {order.lr_number && (
            <>
              {' '}· <Truck size={14} aria-hidden="true" /> LR {order.lr_number}
            </>
          )}
        </span>
        <strong>{formatPaise(toPaise(order.total_amount))}</strong>
      </div>
    </li>
  )
}

export default function Account() {
  const { user } = useAuth()
  usePageMeta('My account | RK ENTERPRICES DELHI', 'Your RK Enterprices Delhi account and order history.')
  const orders = useAsync((signal) => listOrders({ signal }), [])
  const list = orders.data?.results ?? []

  return (
    <>
      <PageHeader eyebrow="My account" title={`Hi, ${user.name.split(' ')[0]}`} subtitle="Your details and wholesale orders." />
      <section className="section section--light section--tight-top">
        <div className="container account-layout">
          <ProfileCard />

          <div className="account-orders" aria-labelledby="orders-title">
            <div className="account-orders__head">
              <h2 id="orders-title" className="account-orders__title">My orders</h2>
              {list.length > 0 && <span className="account-orders__count">{orders.data.count} order{orders.data.count === 1 ? '' : 's'}</span>}
            </div>

            {orders.loading && <p className="account-orders__loading">Loading your orders…</p>}
            {orders.error && <ErrorState title="Orders unavailable" message="We couldn't load your orders." onRetry={orders.reload} />}
            {!orders.loading && !orders.error && list.length === 0 && (
              <div className="empty-state empty-state--panel">
                <ClipboardList size={44} strokeWidth={1.25} aria-hidden="true" />
                <h3>No orders yet</h3>
                <p>Orders you send from your Order List will appear here with their status.</p>
                <Link to="/products" className="btn btn--dark">
                  Browse products <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            )}
            {list.length > 0 && (
              <ul className="order-cards">
                {list.map((order) => (
                  <OrderCard key={order.number} order={order} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
