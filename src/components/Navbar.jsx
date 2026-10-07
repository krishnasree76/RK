import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Clock, Mail, Menu, Package, Phone, ShoppingCart, Truck, X } from 'lucide-react'
import logo from '../assets/logo.png'
import { BUSINESS, MIN_ORDER_QTY } from '../data/business'
import { useCart } from '../context/CartContext'

export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { lineCount } = useCart()
  const { pathname } = useLocation()

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll and allow Escape to close while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.body.classList.add('no-scroll')
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('no-scroll')
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Collapse the mobile menu if the viewport grows past the breakpoint.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 961px)')
    const onChange = (e) => e.matches && setMenuOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="topbar">
        <div className="container topbar__inner">
          <ul className="topbar__notes">
            <li><Package size={14} aria-hidden="true" /> MOQ {MIN_ORDER_QTY} pcs</li>
            <li><Clock size={14} aria-hidden="true" /> Open 24/7</li>
            <li className="hide-sm"><Truck size={14} aria-hidden="true" /> LR no. within 24 hrs</li>
          </ul>
          <div className="topbar__contact">
            <a href={BUSINESS.phoneHref} aria-label={`Call ${BUSINESS.phoneDisplay}`} className="topbar__phone">
              <Phone size={14} aria-hidden="true" />
              <span className="topbar__phone-full">{BUSINESS.phoneDisplay}</span>
              <span className="topbar__phone-short">Call</span>
            </a>
            <a href={`mailto:${BUSINESS.email}`} className="hide-md">
              <Mail size={14} aria-hidden="true" /> {BUSINESS.email}
            </a>
          </div>
        </div>
      </div>

      <nav className="navbar" aria-label="Main">
        <div className="container navbar__inner">
          <Link to="/" className="navbar__brand" aria-label={`${BUSINESS.name} home`}>
            <img src={logo} alt={BUSINESS.name} width="640" height="216" />
          </Link>

          <ul className="navbar__links">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className="navbar__link">
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar__actions">
            <a href={BUSINESS.phoneHref} className="btn btn--primary btn--sm navbar__cta">
              <Phone size={16} aria-hidden="true" /> Call for bulk price
            </a>
            <NavLink
              to="/cart"
              className="navbar__cart"
              aria-label={`Order list, ${lineCount} item${lineCount === 1 ? '' : 's'}`}
            >
              <ShoppingCart size={22} aria-hidden="true" />
              {lineCount > 0 && <span className="navbar__badge">{lineCount}</span>}
            </NavLink>
            <button
              type="button"
              className="navbar__toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' is-open' : ''}`} inert={!menuOpen}>
        <ul className="mobile-menu__links">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end} className="mobile-menu__link">
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/cart" className="mobile-menu__link">
              Order List
              {lineCount > 0 && <span className="navbar__badge navbar__badge--inline">{lineCount}</span>}
            </NavLink>
          </li>
        </ul>
        <div className="mobile-menu__footer">
          <a href={BUSINESS.phoneHref} className="btn btn--primary btn--block">
            <Phone size={18} aria-hidden="true" /> {BUSINESS.phoneDisplay}
          </a>
          <p className="mobile-menu__note">Minimum order {MIN_ORDER_QTY} pieces · Open 24/7</p>
        </div>
      </div>
      {menuOpen && <div className="mobile-menu__backdrop" onClick={() => setMenuOpen(false)} />}
    </header>
  )
}
