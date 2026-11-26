import LegacyDocument from "../legacy-document";

export default function AccountPage() {
  return <LegacyDocument file="account.html" pageType="account" bodyClass="account-page" scripts={["cms.js", "account.js"]} />;
}
