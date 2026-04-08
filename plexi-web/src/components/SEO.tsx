import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

export const SEO = ({
  title = "Plexi - AI-Powered Study Companion",
  description = "Study with real materials, not generic answers. Plexi helps students revise effectively with AI-powered retrieval and focused chat.",
  url = window.location.origin + window.location.pathname,
  image = window.location.origin + "/logo.png"
}: SEOProps) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
};
