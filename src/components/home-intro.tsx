import { Link } from "gatsby"
import * as React from "react"

const HomeIntro = () => (
  <section className="home-intro" aria-labelledby="home-title">
    <h1 id="home-title" className="sr-only">
      개발자 블로그
    </h1>
    <p className="home-intro-copy">
      AI를 활용한 개발 워크플로우, 백엔드 구현 기록, 제품 관점의
      엔지니어링 판단을 짧고 실용적으로 정리하는 블로그입니다.
    </p>
    <Link to="/portfolio/" className="home-intro-portfolio-link">
      백엔드 포트폴리오 보기
    </Link>
  </section>
)

export default HomeIntro
