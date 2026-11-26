(() => {
  const currencyKey = "home_shape_currency";
  const languageKey = "home_shape_language";
  const fallbackRates = { AED: 1, BDT: 33.2, USD: 0.2723, EUR: 0.251, GBP: 0.214 };
  const currencies = ["AED", "BDT", "USD", "EUR", "GBP"];
  const languages = ["en", "bn", "ar", "es", "fr", "de"];
  const localeTags = { en: "en", bn: "bn-BD", ar: "ar-AE", es: "es-ES", fr: "fr-FR", de: "de-DE" };
  const languageNames = { en: "English", bn: "বাংলা", ar: "العربية", es: "Español", fr: "Français", de: "Deutsch" };
  const currencyNames = { AED: "د.إ AED", BDT: "৳ BDT", USD: "$ USD", EUR: "€ EUR", GBP: "£ GBP" };
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  let rates = { ...fallbackRates };
  let currency = currencies.includes(localStorage.getItem(currencyKey)) ? localStorage.getItem(currencyKey) : "AED";
  let language = languages.includes(localStorage.getItem(languageKey)) ? localStorage.getItem(languageKey) : "en";
  let updating = false;

  function translate(value) {
    if (language === "en" || !window.storeI18next) return value;
    const translated = window.storeI18next.t(value.trim(), { lng: language, defaultValue: value.trim() });
    if (translated !== value.trim()) return value.replace(value.trim(), translated);
    const resources = window.storeI18next.getResourceBundle(language, "translation") || {};
    const prefix = Object.keys(resources).sort((a, b) => b.length - a.length)
      .find((phrase) => value.toLowerCase().startsWith(phrase.toLowerCase()));
    return prefix ? value.replace(value.slice(0, prefix.length), window.storeI18next.t(prefix, { lng: language })) : value;
  }

  function formatCurrency(aed) {
    const locale = localeTags[language] || "en-US";
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(aed * (rates[currency] || 1));
  }

  function formatNode(node) {
    if (updating || !node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,textarea,input")) return;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const baseText = originalText.get(node);
    let text = baseText.replace(/(?:د\.إ|Ø¯\.Ø¥|AED|Ã˜Â¯\.Ã˜Â¥)\s*([\d,]+(?:\.\d{1,2})?)/g, (_, amount) => formatCurrency(Number(amount.replace(/,/g, ""))));
    if (language !== "en" && parent.closest("time") && /\b(?:19|20)\d{2}\b/.test(baseText)) {
      const date = new Date(baseText);
      if (Number.isFinite(date.getTime())) text = new Intl.DateTimeFormat(localeTags[language], { year: "numeric", month: "long", day: "numeric" }).format(date);
    }
    text = translate(text);
    if (text !== node.nodeValue) { updating = true; node.nodeValue = text; updating = false; }
  }

  function formatAttributes(element) {
    if (!(element instanceof Element) || element.closest("script,style")) return;
    ["placeholder", "aria-label", "title", "alt"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      let saved = originalAttributes.get(element);
      if (!saved) { saved = {}; originalAttributes.set(element, saved); }
      if (!(attribute in saved)) saved[attribute] = element.getAttribute(attribute);
      const value = translate(saved[attribute]);
      if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value);
    });
  }

  function refreshText(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) formatNode(walker.currentNode);
    if (root instanceof Element) formatAttributes(root);
    root.querySelectorAll?.("[placeholder], [aria-label], [title], [alt]").forEach(formatAttributes);
  }
  window.storeLocaleRefresh = refreshText;

  function mountSelectors() {
    const topbar = document.querySelector(".topbar-inner");
    if (topbar && !topbar.querySelector(".topbar-locale")) {
      const localeHost = document.createElement("div");
      localeHost.className = "topbar-locale";
      topbar.prepend(localeHost);
    }
    document.querySelectorAll(".topbar-locale").forEach((host) => {
      host.setAttribute("aria-label", "Store preferences");
      host.innerHTML = `<label class="locale-control"><svg class="locale-language-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg><select class="store-language" aria-label="Choose language">${languages.map((key) => `<option value="${key}">${languageNames[key]}</option>`).join("")}</select></label><label class="locale-control"><svg class="locale-currency-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5c-.6-.8-1.6-1.2-3.1-1.2-1.8 0-3 .8-3 2s1 1.8 3 2.1 3 .9 3 2.2-1.2 2.1-3.2 2.1c-1.4 0-2.5-.5-3.3-1.4M12 5.8v12.4"/></svg><select class="store-currency" aria-label="Choose currency">${currencies.map((code) => `<option value="${code}">${currencyNames[code]}</option>`).join("")}</select></label>`;
      const languageSelect = host.querySelector(".store-language");
      const currencySelect = host.querySelector(".store-currency");
      languageSelect.value = language;
      currencySelect.value = currency;
      languageSelect.addEventListener("change", () => {
        language = languageSelect.value;
        localStorage.setItem(languageKey, language);
        document.documentElement.lang = localeTags[language] || "en";
        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
        document.querySelectorAll(".store-language").forEach((select) => { select.value = language; });
        if (window.storeI18next) window.storeI18next.changeLanguage(language).then(() => refreshText(document.documentElement));
        else refreshText(document.documentElement);
      });
      currencySelect.addEventListener("change", () => {
        currency = currencySelect.value;
        localStorage.setItem(currencyKey, currency);
        document.querySelectorAll(".store-currency").forEach((select) => { select.value = currency; });
        refreshText();
      });
    });
  }

  document.documentElement.lang = localeTags[language] || "en";
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  mountSelectors();
  refreshText(document.documentElement);
  window.storeLocaleObserver?.disconnect();
  window.storeLocaleObserver = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") formatNode(record.target);
      record.addedNodes?.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) formatNode(node);
        else if (node.nodeType === Node.ELEMENT_NODE) refreshText(node);
      });
    }
  });
  window.storeLocaleObserver.observe(document.documentElement, { subtree: true, childList: true, characterData: true });

  fetch("https://open.er-api.com/v6/latest/AED", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => {
    if (!data?.rates) return;
    currencies.forEach((code) => { if (Number.isFinite(data.rates[code])) rates[code] = data.rates[code]; });
    refreshText();
  }).catch(() => {});
})();




