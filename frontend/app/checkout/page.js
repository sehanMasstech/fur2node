import LegacyDocument from "../legacy-document";

export default function CheckoutPage() {
  return <LegacyDocument file="checkout.html" pageType="checkout" bodyClass="account-page" scripts={["cms.js", "checkout.js"]} />;
}
