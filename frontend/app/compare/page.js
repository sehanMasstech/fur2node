import LegacyDocument from "../legacy-document";

export default function ComparePage() {
  return <LegacyDocument file="compare.html" pageType="lists" bodyClass="content-page product-lists-page compare-page" scripts={["cms.js", "product-list-page.js"]} />;
}
