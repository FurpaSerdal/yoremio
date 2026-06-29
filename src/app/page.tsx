import { YoremioMarketplace } from "@/components/yoremio/marketplace";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Yöremio",
    url: "https://yoremio.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://yoremio.com/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <YoremioMarketplace />
    </>
  );
}
