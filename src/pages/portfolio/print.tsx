import type { HeadFC } from "gatsby"
import * as React from "react"

import PortfolioPrintDocument from "../../components/portfolio/portfolio-print-document"
import Seo from "../../components/seo"

const PortfolioPrintPage = () => <PortfolioPrintDocument />

export default PortfolioPrintPage

export const Head: HeadFC = ({ location }) => (
  <Seo
    title="백엔드 개발자 포트폴리오 인쇄본"
    description="권종성 백엔드 개발자 포트폴리오 인쇄용 문서입니다."
    pathname={location.pathname}
    robots="noindex, nofollow"
  />
)
