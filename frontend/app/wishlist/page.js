import LegacyDocument from "../legacy-document";

export default function WishlistPage() {
  return <LegacyDocument file="wishlist.html" pageType="lists" bodyClass="content-page product-lists-page wishlist-page" scripts={["cms.js", "product-list-page.js"]} />;
}
