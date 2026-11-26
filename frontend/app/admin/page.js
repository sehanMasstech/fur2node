import LegacyDocument from "../legacy-document";

export default function AdminPage() {
  return <LegacyDocument file="admin.html" pageType="admin" scripts={["admin.js"]} />;
}
