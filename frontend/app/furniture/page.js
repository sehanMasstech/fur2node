import LegacyDocument from "../legacy-document";

export default function FurniturePage() {
  return <LegacyDocument file="furniture.html" pageType="furniture" scripts={["cms.js", "furniture.js"]} />;
}
