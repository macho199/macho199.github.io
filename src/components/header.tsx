import { Link } from "gatsby"
import * as React from "react"

import ContentContainer from "./content-container"

const GITHUB_PROFILE_URL = "https://github.com/macho199"

const GitHubIcon = () => (
  <svg
    className="site-github-icon"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.419-1.305.762-1.604-2.665-.305-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.806 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12Z" />
  </svg>
)

const Header = () => (
  <header className="site-header">
    <ContentContainer>
      <div className="site-header-inner">
        <Link to="/" className="site-logo" aria-label="kjs.log 홈">
          kjs.log
        </Link>
        <a
          className="site-github-link"
          href={GITHUB_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub 프로필 (새 탭)"
        >
          <GitHubIcon />
        </a>
      </div>
    </ContentContainer>
  </header>
)

export default Header
