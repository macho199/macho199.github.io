import type { HeadFC } from "gatsby"
import * as React from "react"

import ContentContainer from "../components/content-container"
import Layout from "../components/layout"
import PortfolioWeb from "../components/portfolio/portfolio-web"
import Seo from "../components/seo"
import { portfolio } from "../content/portfolio"

const PortfolioPage = () => (
  <Layout>
    <ContentContainer>
      <PortfolioWeb portfolio={portfolio} />
    </ContentContainer>
  </Layout>
)

export default PortfolioPage

export const Head: HeadFC = ({ location }) => (
  <Seo
    title="백엔드 개발자 포트폴리오"
    description="17년 경력 백엔드 개발자 권종성의 레거시 현대화, 대규모 데이터 전환, 성능 개선 사례입니다."
    pathname={location.pathname}
  />
)
