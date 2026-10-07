import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Package, Phone, Truck } from 'lucide-react'
import logo from '../assets/logo.png'
import { BUSINESS, MIN_ORDER_QTY } from '../data/business'
import { categories } from '../data/products'
import { NAV_LINKS } from './Navbar'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer__accent" aria-hidden="true" />
      <div className="container footer__grid">
        <div className="footer__brand">
          <Link to="/" aria-label={`${BUSINESS.name} home`}>
            <img src={logo} alt={BUSINESS.name} className="footer__logo" width="640" height="216" loading="lazy" />
          </Link>
          <p>{BUSINESS.tagline}. Trusted bulk supply for retailers, garages and dealers across India.</p>
          <ul className="footer__badges">
            <li><Package size={16} aria-hidden="true" /> Minimum order {MIN_ORDER_QTY} pieces</li>
            <li><Truck size={16} aria-hidden="true" /> LR within 24 hrs of dispatch</li>
            <li><Clock size={16} aria-hidden="true" /> Open 24/7</li>
          </ul>
        </div>

        <div>
          <h3 className="footer__title">Quick Links</h3>
          <ul className="footer__list">
            {NAV_LINKS.map((link) => (
              <li key={link.to}><Link to={link.to}>{link.label}</Link></li>
            ))}
            <li><Link to="/cart">Order List</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="footer__title">Categories</h3>
          <ul className="footer__list">
            {categories.map((c) => (
              <li key={c.id}><Link to={`/products?category=${c.id}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="footer__title">Contact</h3>
          <ul className="footer__contact">
            <li>
              <Phone size={18} aria-hidden="true" />
              <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
            </li>
            <li>
              <Mail size={18} aria-hidden="true" />
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            </li>
            <li>
              <MapPin size={18} aria-hidden="true" />
              <span>{BUSINESS.address}</span>
            </li>
            <li>
              <Clock size={18} aria-hidden="true" />
              <span>{BUSINESS.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© {year} {BUSINESS.name}. All rights reserved.</p>
          <p>Wholesale only · Prices on request</p>
        </div>
      </div>
    </footer>
  )
}
