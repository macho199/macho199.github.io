import { graphql, useStaticQuery } from "gatsby"
import * as React from "react"

import {
  createBlogPosting,
  serializeJsonLd,
} from "../lib/blog-posting.mjs"

type SeoProps = Readonly<{
  title?: string
  description?: string
  pathname: string
  type?: "article" | "website"
  publishedAt?: string
  tags?: string[]
  robots?: "noindex, nofollow"
}>

type SiteMetadataQuery = {
  site: {
    siteMetadata: {
      title: string
      description: string
      siteUrl: string
      authorName: string
      authorUrl: string
      googleSiteVerification: string
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
  robots,
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
          authorName
          authorUrl
          googleSiteVerification
        }
      }
    }
  `)
  const pageTitle = title ? `${title} | ${siteMetadata.title}` : siteMetadata.title
  const pageDescription = description ?? siteMetadata.description
  const canonicalPath = pathname.endsWith("/") ? pathname : `${pathname}/`
  const canonicalUrl = new URL(canonicalPath, siteMetadata.siteUrl).toString()
  const blogPosting =
    type === "article" && title && publishedAt
      ? createBlogPosting({
          title,
          description: pageDescription,
          publishedAt,
          tags,
          canonicalUrl,
          authorName: siteMetadata.authorName,
          authorUrl: siteMetadata.authorUrl,
        })
      : null

  return (
    <>
      <title>{pageTitle}</title>
      <meta id="description" name="description" content={pageDescription} />
      <meta
        id="google-site-verification"
        name="google-site-verification"
        content={siteMetadata.googleSiteVerification}
      />
      <link id="canonical" rel="canonical" href={canonicalUrl} />
      <link id="favicon" rel="icon" type="image/png" sizes="128x128" href="/favicon.png" />
      <meta id="og-title" property="og:title" content={pageTitle} />
      <meta id="og-description" property="og:description" content={pageDescription} />
      <meta id="og-url" property="og:url" content={canonicalUrl} />
      <meta id="og-site-name" property="og:site_name" content={siteMetadata.title} />
      <meta id="og-type" property="og:type" content={type} />
      <meta id="twitter-card" name="twitter:card" content="summary" />
      <meta id="twitter-title" name="twitter:title" content={pageTitle} />
      <meta id="twitter-description" name="twitter:description" content={pageDescription} />
      {robots ? (
        <meta id="robots" name="robots" content={robots} />
      ) : null}
      {type === "article" && publishedAt ? (
        <meta id="article-published-time" property="article:published_time" content={publishedAt} />
      ) : null}
      {type === "article"
        ? tags.map(tag => <meta property="article:tag" content={tag} key={tag} />)
        : null}
      {blogPosting ? (
        <script
          id="blog-posting-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogPosting) }}
        />
      ) : null}
    </>
  )
}

export default Seo
