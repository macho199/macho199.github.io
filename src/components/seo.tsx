import { graphql, useStaticQuery } from "gatsby"
import * as React from "react"

type SeoProps = {
  title?: string
  description?: string
  pathname: string
  type?: "article" | "website"
  publishedAt?: string
  tags?: string[]
}

type SiteMetadataQuery = {
  site: {
    siteMetadata: {
      title: string
      description: string
      siteUrl: string
    }
  }
}

const Seo = ({
  title,
  description,
  pathname,
  type = "website",
  publishedAt,
  tags = [],
}: SeoProps) => {
  const {
    site: { siteMetadata },
  } = useStaticQuery<SiteMetadataQuery>(graphql`
    query SeoSiteMetadata {
      site {
        siteMetadata {
          title
          description
          siteUrl
        }
      }
    }
  `)
  const pageTitle = title ? `${title} | ${siteMetadata.title}` : siteMetadata.title
  const pageDescription = description ?? siteMetadata.description
  const canonicalPath = pathname.endsWith("/") ? pathname : `${pathname}/`
  const canonicalUrl = new URL(canonicalPath, siteMetadata.siteUrl).toString()

  return (
    <>
      <title>{pageTitle}</title>
      <meta id="description" name="description" content={pageDescription} />
      <link id="canonical" rel="canonical" href={canonicalUrl} />
      <meta id="og-title" property="og:title" content={pageTitle} />
      <meta id="og-description" property="og:description" content={pageDescription} />
      <meta id="og-url" property="og:url" content={canonicalUrl} />
      <meta id="og-site-name" property="og:site_name" content={siteMetadata.title} />
      <meta id="og-type" property="og:type" content={type} />
      <meta id="twitter-card" name="twitter:card" content="summary" />
      <meta id="twitter-title" name="twitter:title" content={pageTitle} />
      <meta id="twitter-description" name="twitter:description" content={pageDescription} />
      {type === "article" && publishedAt ? (
        <meta id="article-published-time" property="article:published_time" content={publishedAt} />
      ) : null}
      {type === "article"
        ? tags.map(tag => <meta property="article:tag" content={tag} key={tag} />)
        : null}
    </>
  )
}

export default Seo
