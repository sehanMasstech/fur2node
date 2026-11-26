import LegacyDocument from "../legacy-document";

export default function ProductPage() {
  return <LegacyDocument file="product.html" pageType="product" bodyClass="product-detail-page" scripts={["cms.js", "product.js"]} />;
}
