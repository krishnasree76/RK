import SectionHeading from './SectionHeading'

// Dark cinematic title band used at the top of every inner page. It reuses the
// hero poster as a faint backdrop so inner pages feel connected to the homepage.
export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <section className="page-header">
      <div className="page-header__media" aria-hidden="true" />
      <div className="container page-header__inner">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} align="left" tone="dark" as="h1" />
        {children && <div className="page-header__extra">{children}</div>}
      </div>
    </section>
  )
}
