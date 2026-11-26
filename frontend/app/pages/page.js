import LegacyDocument from "../legacy-document";

export default function ContentPage() {
  return <LegacyDocument file="pages.html" pageType="pages" bodyClass="content-page" scripts={["cms.js", "pages.js"]} />;
}
