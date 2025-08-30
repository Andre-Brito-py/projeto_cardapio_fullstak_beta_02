import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const SEO = ({ 
  title = 'Food Delivery', 
  description = 'Peça comida online dos melhores restaurantes da sua região', 
  keywords = 'food delivery, comida online, restaurantes, pedidos', 
  image = '/default-og-image.jpg',
  url = window.location.href,
  type = 'website',
  storeName = null,
  storeDescription = null,
  storeImage = null
}) => {
  // Se for uma página de loja específica, personalizar as meta tags
  const finalTitle = storeName ? `${storeName} - Food Delivery` : title;
  const finalDescription = storeDescription || description;
  const finalImage = storeImage || image;
  const finalKeywords = storeName ? `${storeName}, ${keywords}` : keywords;

  return (
    <Helmet>
      {/* Meta tags básicas */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content="Food Delivery" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Food Delivery" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:url" content={url} />

      {/* Meta tags específicas para lojas */}
      {storeName && (
        <>
          <meta property="business:contact_data:locality" content="Brasil" />
          <meta property="business:contact_data:country_name" content="Brasil" />
          <meta name="geo.region" content="BR" />
          <meta name="geo.placename" content={storeName} />
        </>
      )}

      {/* Schema.org para SEO estruturado */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": storeName ? "Restaurant" : "WebSite",
          "name": storeName || "Food Delivery",
          "description": finalDescription,
          "url": url,
          "image": finalImage,
          ...(storeName && {
            "servesCuisine": "Brasileira",
            "priceRange": "$$",
            "acceptsReservations": false,
            "hasDeliveryMethod": {
              "@type": "DeliveryMethod",
              "name": "Delivery"
            }
          })
        })}
      </script>
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string,
  storeName: PropTypes.string,
  storeDescription: PropTypes.string,
  storeImage: PropTypes.string
};

export default SEO;