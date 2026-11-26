import LegacyDocument from "./legacy-document";

export default function HomePage() {
  return <LegacyDocument file="index.html" pageType="home" bodyClass="home-page" scripts={["cms.js", "app.js"]} />;
}
