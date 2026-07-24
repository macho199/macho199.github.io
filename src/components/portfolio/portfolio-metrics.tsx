import * as React from "react"

import type { Portfolio } from "../../content/portfolio"

type PortfolioMetricsProps = Readonly<{ metrics: Portfolio["metrics"] }>

const PortfolioMetrics = ({ metrics }: PortfolioMetricsProps) => (
  <section className="portfolio-metrics" aria-labelledby="portfolio-metrics-title">
    <h2 id="portfolio-metrics-title">핵심 성과</h2>
    <dl className="portfolio-metrics-list">
      {metrics.map(metric => (
        <div className="portfolio-metric" key={metric.label}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
    </dl>
  </section>
)

export default PortfolioMetrics
