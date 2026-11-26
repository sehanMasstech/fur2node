"use client";

import parse from "html-react-parser";
import { useEffect, useState } from "react";
import i18next from "i18next";
import bengaliTranslations from "../locales/bn.json";
import arabicTranslations from "../locales/ar.json";
import spanishTranslations from "../locales/es.json";
import frenchTranslations from "../locales/fr.json";
import germanTranslations from "../locales/de.json";

const stylesheetFiles = {
  admin: ["/legacy/admin.css", "/legacy/admin-catalog.css", "/legacy/admin-products.css"],
  account: ["/legacy/pages.css", "/legacy/account.css", "/legacy/customer-dashboard.css", "/legacy/storefront-overrides.css"],
  checkout: ["/legacy/pages.css", "/legacy/customer-dashboard.css", "/legacy/checkout.css", "/legacy/storefront-overrides.css"],
  furniture: ["/legacy/furniture.css", "/legacy/pages.css", "/legacy/storefront-overrides.css"],
  home: ["/legacy/pages.css", "/legacy/storefront-overrides.css"],
  pages: ["/legacy/pages.css", "/legacy/contact-page.css", "/legacy/about-design.css", "/legacy/journal-article.css", "/legacy/storefront-overrides.css"],
  product: ["/legacy/product.css", "/legacy/pages.css", "/legacy/storefront-overrides.css"],
  lists: ["/legacy/pages.css", "/legacy/product-lists.css", "/legacy/storefront-overrides.css"]
};

function ensureStylesheet(href) {
  return new Promise((resolve) => {
    const existing = document.querySelector(`link[data-legacy-style="${href}"]`);
    if (existing) {
      resolve(existing);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.legacyStyle = href;
    link.onload = () => resolve(link);
    link.onerror = () => {
      console.error(`Could not load stylesheet: ${href}`);
      resolve(link);
    };
    document.head.append(link);
  });
}

function loadScript(file) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `/legacy/${file}${file === "cms.js" ? "?v=category-icons-8" : ""}`;
    script.dataset.legacyScript = file;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Could not load storefront script: ${file}`));
    document.body.append(script);
  });
}

export default function LegacyDocument({ file, pageType, scripts, bodyClass = "" }) {
  const [html, setHtml] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    const previousBodyClass = document.body.className;
    document.body.className = bodyClass;
    window.STORE_API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");

    async function preparePage() {
      try {
        const [response] = await Promise.all([
          fetch(`/legacy/${file}`, { cache: "no-store" }),
          ...stylesheetFiles[pageType].map(ensureStylesheet)
        ]);
        if (!response.ok) throw new Error(`Could not load page content (${response.status}).`);
        const source = await response.text();
        const parsed = new DOMParser().parseFromString(source, "text/html");
        document.title = parsed.title || "Home Shape";
        if (active) setHtml(parsed.body.innerHTML);
      } catch (error) {
        console.error(error);
        if (active) setLoadError(error.message);
      }
    }

    preparePage();
    return () => {
      active = false;
      document.body.className = previousBodyClass;
      document.querySelectorAll("[data-legacy-script]").forEach((script) => script.remove());
      stylesheetFiles[pageType].forEach((href) => {
        document.querySelector(`link[data-legacy-style="${href}"]`)?.remove();
      });
    };
  }, [bodyClass, file, pageType]);

  useEffect(() => {
    if (html === null) return undefined;
    let active = true;
    const loadedScripts = [];

    async function initializePage() {
      if (!i18next.isInitialized) {
        await i18next.init({
          lng: ["en", "bn", "ar", "es", "fr", "de"].includes(localStorage.getItem("home_shape_language")) ? localStorage.getItem("home_shape_language") : "en",
          fallbackLng: "en",
          supportedLngs: ["en", "bn", "ar", "es", "fr", "de"],
          keySeparator: false,
          returnNull: false,
          interpolation: { escapeValue: false },
          resources: {
            en: { translation: {} },
            bn: { translation: bengaliTranslations },
            ar: { translation: arabicTranslations },
            es: { translation: spanishTranslations },
            fr: { translation: frenchTranslations },
            de: { translation: germanTranslations }
          }
        });
      }
      window.storeI18next = i18next;
      for (const scriptFile of ["customer-nav.js", "product-lists.js", "store-locale.js", ...scripts]) {
        try {
          const script = await loadScript(scriptFile);
          loadedScripts.push(script);
        } catch (error) {
          console.error(error);
          if (active) setLoadError(error.message);
          break;
        }
      }
    }

    initializePage();
    return () => {
      active = false;
      window.storeLocaleObserver?.disconnect();
      loadedScripts.forEach((script) => script.remove());
    };
  }, [html, scripts]);

  if (loadError) return <main className="legacy-load-error" role="alert">{loadError}</main>;
  if (html === null) return <main className="legacy-loading" aria-label="Loading"><span className="legacy-loader-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><b /></span></main>;
  return <div id="legacy-page-content">{parse(html)}</div>;
}
