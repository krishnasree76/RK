// Large-number facts strip with hairline separators. Reused on Home and About.
export default function StatsStrip({ stats, label = 'Key facts', tone = 'dark' }) {
  return (
    <section className={`stats-strip stats-strip--${tone}`} aria-label={label}>
      <div className="container">
        <dl className="stats-strip__list">
          {stats.map((stat) => (
            <div key={stat.label} className="stats-strip__item">
              <dt className="stats-strip__label">{stat.label}</dt>
              <dd className="stats-strip__value">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
