import { Link } from "gatsby"
import * as React from "react"

import ContentContainer from "./content-container"

const Header = () => (
  <header className="site-header">
    <ContentContainer>
      <div className="site-header-inner">
        <Link to="/" className="site-logo" aria-label="kjs.log 홈">
          kjs.log
        </Link>
      </div>
    </ContentContainer>
  </header>
)

export default Header
