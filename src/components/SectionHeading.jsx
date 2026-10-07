// Consistent eyebrow + title + subtitle block used by every section.
// `tone="dark"` adapts colours for black/graphite backgrounds.
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  tone = 'light',
  as: Tag = 'h2',
  id,
  className = '',
}) {
  return (
    <div className={`section-heading section-heading--${align} section-heading--${tone} ${className}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Tag className="section-heading__title" id={id}>
        {title}
      </Tag>
      {subtitle && <p className="section-heading__subtitle">{subtitle}</p>}
    </div>
  )
}
