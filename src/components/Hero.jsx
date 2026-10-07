import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BUSINESS, MIN_ORDER_QTY } from '../data/business'
import './Hero.css'

// Served from /public so the browser can stream the video instead of bundling it.
const HERO_VIDEO = `${import.meta.env.BASE_URL}assets/hero-video.mp4`
const HERO_POSTER = `${import.meta.env.BASE_URL}assets/hero-poster.jpg`

const HIGHLIGHTS = [`MOQ ${MIN_ORDER_QTY} pcs`, 'LR within 24 hrs', 'Pan-India supply']

export default function Hero() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const [videoFailed, setVideoFailed] = useState(false)

  // Keep the background video playing only while it is useful: pause it when the
  // hero is off-screen or when the visitor prefers reduced motion.
  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    if (!video || !section) return

    // React doesn't always reflect `muted` as an attribute; set it explicitly so
    // mobile browsers allow autoplay.
    video.muted = true
    video.defaultMuted = true

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let inView = true

    const sync = () => {
      if (reducedMotion.matches || !inView) {
        video.pause()
      } else {
        video.play().catch(() => {
          // Autoplay blocked (e.g. low-power mode) — the poster stays visible.
        })
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        sync()
      },
      { threshold: 0.05 },
    )

    observer.observe(section)
    reducedMotion.addEventListener('change', sync)
    sync()

    return () => {
      observer.disconnect()
      reducedMotion.removeEventListener('change', sync)
    }
  }, [])

  const scrollPastHero = () => {
    const section = sectionRef.current
    if (!section) return
    const navHeight = document.querySelector('.navbar')?.offsetHeight ?? 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: section.getBoundingClientRect().bottom + window.scrollY - navHeight,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  return (
    <section
      ref={sectionRef}
      className={`hero${videoFailed ? ' hero--no-video' : ''}`}
      aria-labelledby="hero-title"
    >
      <div className="hero__media" aria-hidden="true">
        {!videoFailed && (
          <video
            ref={videoRef}
            className="hero__video"
            src={HERO_VIDEO}
            poster={HERO_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            tabIndex={-1}
            onError={() => setVideoFailed(true)}
          />
        )}
        <div className="hero__overlay" />
      </div>

      <div className="hero__content">
        <p className="hero__eyebrow hero-reveal" style={{ '--d': '0.15s' }}>
          <span className="hero__eyebrow-line" aria-hidden="true" />
          {BUSINESS.name}
        </p>

        <h1 id="hero-title" className="hero__title hero-reveal" style={{ '--d': '0.3s' }}>
          <span className="hero__title-line">Wholesale</span>
          <span className="hero__title-line hero__title-line--metal">Car Accessories</span>
        </h1>

        <p className="hero__text hero-reveal" style={{ '--d': '0.5s' }}>
          Premium automotive accessories supplied <br className="hero__br" />
          wholesale from Delhi.
        </p>

        <ul className="hero__highlights hero-reveal" style={{ '--d': '0.62s' }} aria-label="Key terms">
          {HIGHLIGHTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="hero__actions hero-reveal" style={{ '--d': '0.78s' }}>
          <Link to="/products" className="btn btn--light hero__btn">
            Explore Products
            <ArrowRight size={18} className="hero__btn-icon" aria-hidden="true" />
          </Link>
          <Link to="/contact" className="btn btn--ghost hero__btn hero__btn--ghost">
            Contact Us
          </Link>
        </div>
      </div>

      <button type="button" className="hero__scroll" onClick={scrollPastHero}>
        <span className="hero__scroll-label">Scroll to explore</span>
        <span className="hero__scroll-track" aria-hidden="true">
          <span className="hero__scroll-thumb" />
        </span>
      </button>
    </section>
  )
}
