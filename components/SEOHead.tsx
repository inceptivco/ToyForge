import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_TITLE = 'CharacterForge - AI Character & Avatar Generator for Apps, Games & Design';
const DEFAULT_DESCRIPTION = 'Generate production-ready 3D characters and avatars with AI. Perfect for game development, app design, and digital projects. React components, REST API, and transparent PNGs. Instant character generation in seconds.';
const DEFAULT_KEYWORDS = 'character generator, avatar generator, AI character creator, game characters, app avatars, 3D character generator, character API, avatar API, character assets, design characters, NPC generator, profile avatars, React character component';
const DEFAULT_IMAGE = '/og-image.png'; // You'll need to create this
const BASE_URL = 'https://characterforge.app';

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
}) => {
  const location = useLocation();
  const currentUrl = url || `${BASE_URL}${location.pathname}`;
  const fullImageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'CharacterForge');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    updateMetaTag('theme-color', '#ef4444');

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', fullImageUrl, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'CharacterForge', true);
    updateMetaTag('og:locale', 'en_US', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', fullImageUrl);
    updateMetaTag('twitter:site', '@characterforge');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

    // Structured Data (JSON-LD)
    let structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.type = 'application/ld+json';
      document.head.appendChild(structuredData);
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'CharacterForge',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0.10',
        priceCurrency: 'USD',
        description: 'Pay per generation - $0.10 with credit packs',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
      },
      description: description,
      url: BASE_URL,
      author: {
        '@type': 'Organization',
        name: 'CharacterForge',
      },
      featureList: [
        'AI-powered 3D character generation',
        'React and React Native components',
        'REST API access',
        'Transparent PNG exports',
        'Customizable attributes',
      ],
    };

    structuredData.textContent = JSON.stringify(jsonLd);
  }, [title, description, keywords, image, currentUrl, type, fullImageUrl]);

  return null;
};

