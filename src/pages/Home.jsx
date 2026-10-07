import Hero from '../components/Hero'
import TradeIntro from '../components/TradeIntro'
import StatsStrip from '../components/StatsStrip'
import CategoriesSection from '../components/CategoriesSection'
import FeaturedProducts from '../components/FeaturedProducts'
import WhyChooseUs from '../components/WhyChooseUs'
import HowItWorks from '../components/HowItWorks'
import CtaBanner from '../components/CtaBanner'
import ContactSection from '../components/ContactSection'
import usePageMeta from '../hooks/usePageMeta'
import { HOME_STATS, MIN_ORDER_QTY } from '../data/business'

export default function Home() {
  usePageMeta(
    'RK ENTERPRICES DELHI | Wholesale Car Accessories',
    `Wholesale supplier of all types of car accessories from Kashmere Gate, Delhi. Minimum order ${MIN_ORDER_QTY} pieces, LR shared within 24 hours, open 24/7.`,
  )

  return (
    <>
      <Hero />
      <TradeIntro />
      <StatsStrip stats={HOME_STATS} label="Business at a glance" />
      <CategoriesSection />
      <FeaturedProducts />
      <WhyChooseUs />
      <HowItWorks />
      <CtaBanner />
      <ContactSection />
    </>
  )
}
