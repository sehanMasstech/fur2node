const pageRoot = document.querySelector("#page-content");
const params = new URLSearchParams(window.location.search);
const pageKey = params.get("page") || "about";

function escapeText(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function pageHero(title, intro, eyebrow, backgroundImage = "") {
  const background = backgroundImage ? `<img class="page-hero-background" src="${safeImageSource(backgroundImage, "")}" alt="" aria-hidden="true" />` : "";
  return `<header class="page-hero${background ? " page-hero--image" : ""}">${background}<p class="eyebrow">${escapeText(eyebrow)}</p><h1>${escapeText(title)}</h1><p>${escapeText(intro)}</p></header>`;
}

function contactPageHero(page) {
  const background = safeImageSource(page.heroBackgroundImage, "");
  return `<header class="page-hero contact-page-hero">
    ${background ? `<img class="contact-page-hero-image" src="${background}" alt="" aria-hidden="true" />` : ""}
    <p class="eyebrow">${escapeText(page.eyebrow || "HERE TO HELP")}</p>
    <h1>${escapeText(page.title || "We’d love to hear from you")}</h1>
    <p>${escapeText(page.intro || "")}</p>
  </header>`;
}

function safeImageSource(value, fallback) {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source || source.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(source) && !/^https:\/\//i.test(source)) {
    return escapeText(fallback);
  }
  return escapeText(source);
}

function safeMapEmbedSource(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    const googleMapsEmbed = url.hostname === "www.google.com" && url.pathname === "/maps/embed";
    const googleAddressMap = url.hostname === "www.google.com" &&
      url.pathname === "/maps" &&
      url.searchParams.get("output") === "embed" &&
      Boolean(url.searchParams.get("q"));
    return url.protocol === "https:" && (googleMapsEmbed || googleAddressMap) ? escapeText(url.toString()) : "";
  } catch {
    return "";
  }
}

function safeHttpsLink(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function aboutPage(site) {
  const page = site.pages?.about || {};
  const features = Array.isArray(page.features) ? page.features : [
    { title: "We love what we do", description: "A small, thoughtful team brings care to every piece we select." },
    { title: "Our working process", description: "We look closely at the materials, details, and everyday use behind each design." }
  ];
  const values = Array.isArray(page.values) ? page.values : [
    { title: "Thoughtful by nature", description: "We look for honest materials and forms that feel good to live with." },
    { title: "Made with care", description: "We value skilled makers and the small details that make a piece last." },
    { title: "Room for everyone", description: "Good design belongs in the everyday, wherever you call home." }
  ];
  const team = Array.isArray(page.team) ? page.team : [
    { name: "Studio team", role: "Design & selection", image: "img/ref-furniture-04.webp" },
    { name: "Product team", role: "Materials & makers", image: "img/ref-furniture-06.jpg" },
    { name: "Store team", role: "Customer experience", image: "img/ref-furniture-09.jpg" },
    { name: "Home Shape team", role: "A little bit of everything", image: "img/ref-furniture-11.jpg" }
  ];
  const stats = Array.isArray(page.stats) ? page.stats : [
    { value: "01", label: "Thoughtful collection" }, { value: "100%", label: "Selected with care" }, { value: "Everyday", label: "Made for real life" }
  ];
  const gallery = Array.isArray(page.gallery) ? page.gallery : ["img/ref-furniture-01.webp", "img/ref-furniture-03.webp", "img/ref-furniture-05.jpg", "img/ref-furniture-08.webp", "img/ref-furniture-10.webp", "img/ref-furniture-12.jpg"];
  const storeImage = safeImageSource(page.image, "img/furniture-title-bg-opt.jpg.webp");
  const historyImage = safeImageSource(page.historyImage, "img/main-egg-chair.jpg.webp");
  return `<div class="about-design">
    <section class="about-intro"><img class="about-intro-background" src="${safeImageSource(page.heroBackgroundImage, "img/furniture-title-bg-opt.jpg.webp")}" alt="" aria-hidden="true" /><p class="eyebrow">${escapeText(page.introEyebrow || "SOME WORDS ABOUT US")}</p><h1>${escapeText(page.title || "Well-coordinated teamwork speaks about us")}</h1><p class="about-intro-copy">${escapeText(page.intro || "")}</p><div class="about-feature-grid">${features.map((feature, index) => `<article><span>0${index + 1}</span><div><h2>${escapeText(feature.title)}</h2><p>${escapeText(feature.description)}</p></div></article>`).join("")}</div></section>
    <section class="about-store-section"><div class="about-store-copy"><p class="eyebrow">${escapeText(page.sectionEyebrow || "SEEMINGLY ELEGANT DESIGN")}</p><h2>${escapeText(page.sectionTitle || "About our online store")}</h2><p class="about-store-lead">${escapeText(page.sectionIntro || "")}</p><p>${escapeText(page.body || "")}</p><a class="page-cta" href="/furniture">Explore the collection <span>↗</span></a></div><figure><img src="${storeImage}" alt="${escapeText(page.imageAlt || "Home Shape furniture collection")}" loading="lazy" /></figure></section>
    ${values.length ? `<section class="about-values">${values.map((item, index) => `<article><span>0${index + 1}</span><h3>${escapeText(item.title)}</h3><p>${escapeText(item.description)}</p></article>`).join("")}</section>` : ""}
    ${team.length ? `<section class="about-team"><div class="about-section-heading"><p class="eyebrow">${escapeText(page.teamEyebrow || "WORDS ABOUT US")}</p><h2>${escapeText(page.teamTitle || "Our team")}</h2><p>${escapeText(page.teamIntro || "")}</p></div><div class="about-team-grid">${team.map((member) => `<article><img src="${safeImageSource(member.image, "img/ref-furniture-04.webp")}" alt="${escapeText(member.name)}" loading="lazy" /><h3>${escapeText(member.name)}</h3><p>${escapeText(member.role)}</p></article>`).join("")}</div></section>` : ""}
    ${stats.length ? `<section class="about-facts"><div><p class="eyebrow">HOME SHAPE, BY THE NUMBERS</p><h2>We work through every detail with care.</h2><a class="page-cta" href="/furniture">Find your next favourite <span>↗</span></a></div><div class="about-stat-grid">${stats.map((stat) => `<article><strong>${escapeText(stat.value)}</strong><span>${escapeText(stat.label)}</span></article>`).join("")}</div></section>` : ""}
    <section class="about-history"><figure><img src="${historyImage}" alt="Home Shape furniture in a considered living space" loading="lazy" /></figure><div><p class="eyebrow">${escapeText(page.historyEyebrow || "A HOME SHAPE STORY")}</p><h2>${escapeText(page.historyTitle || "Our company history and facts")}</h2><p>${escapeText(page.historyBody || "")}</p></div></section>
    ${gallery.length ? `<section class="about-gallery"><div class="about-section-heading"><p class="eyebrow">MADE FOR THE EVERYDAY</p><h2>${escapeText(page.galleryTitle || "Designed for the way you live")}</h2></div><div class="about-gallery-grid">${gallery.map((image, index) => `<figure><img src="${safeImageSource(image, "img/ref-furniture-01.webp")}" alt="Home Shape furniture inspiration ${index + 1}" loading="lazy" /></figure>`).join("")}</div></section>` : ""}
  </div>`;
}

function storyPage(site) {
  const page = site.pages?.story || {};
  return `${pageHero(page.title || "Our story", page.intro || "", "A HOME SHAPE STORY", page.heroBackgroundImage || "")}
    <section class="page-body"><div class="about-layout"><figure class="about-photo"><img src="img/outdoor.jpeg" alt="Furniture in a relaxed outdoor setting" loading="lazy" /><figcaption>A LITTLE MORE ROOM TO BREATHE</figcaption></figure><div class="about-copy"><p class="eyebrow">IT STARTED WITH A SIMPLE IDEA</p><h2>Furniture should make everyday life feel better.</h2><p>${escapeText(page.body || "")}</p><p>We keep our collection focused on useful pieces with a sense of warmth: designs that welcome a slow morning, a long meal, and all the moments in between.</p><a class="page-cta" href="pages.html?page=about">Get to know us <span>↗</span></a></div></div><div class="story-callout"><p>“A home is made in the little moments. We’re here to help make them comfortable.”</p></div></section>`;
}

function contactPage(site) {
  const page = {
    eyebrow: "HERE TO HELP",
    heroBackgroundImage: "img/furniture-title-bg-opt.jpg.webp",
    infoEyebrow: "A REAL PERSON, READY TO HELP",
    infoTitle: "Furniture decisions feel easier with a little guidance.",
    infoDescription: "Tell us what you are planning. Our team can help with products, delivery, and ideas for your space.",
    image: "img/furniture.jpg",
    imageAlt: "A warm, considered furniture showroom",
    visitLabel: "VISIT THE STUDIO",
    callLabel: "CALL OUR TEAM",
    emailLabel: "WRITE TO US",
    hoursLabel: "WHEN WE’RE HERE",
    address: "",
    phone: "",
    email: "",
    hours: "Monday – Friday | 9:00 AM – 5:00 PM\nSaturday | 10:00 AM – 2:00 PM",
    locationTitle: "Come by and say hello",
    locationDescription: "A visit gives you time to see the materials and find the right fit for your home.",
    showMap: true,
    mapEmbedUrl: "",
    mapLinkUrl: "",
    mapLinkLabel: "Get directions",
    formEyebrow: "A NOTE TO OUR TEAM",
    formTitle: "What can we help with?",
    formDescription: "Send us a few details and we’ll get back to you as soon as we can.",
    formNameLabel: "Your name",
    formEmailLabel: "Email address",
    formSubjectLabel: "What is this about?",
    formMessageLabel: "Tell us a little more",
    formSubmitLabel: "Send your message",
    successMessage: "Thanks for reaching out. Our team will be in touch soon.",
    responseNote: "We usually reply within one business day.",
    faqEyebrow: "A FEW HELPFUL DETAILS",
    faqTitle: "Good to know before you reach out",
    ...(site.pages?.contact || {})
  };
  const image = safeImageSource(page.image, "img/furniture.jpg");
  const generatedMapUrl = page.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(page.address)}&output=embed`
    : "";
  const mapEmbedUrl = safeMapEmbedSource(page.mapEmbedUrl) || safeMapEmbedSource(generatedMapUrl);
  const showMap = page.showMap !== false && Boolean(mapEmbedUrl);
  const directionsUrl = safeHttpsLink(page.mapLinkUrl) ||
    (page.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.address)}` : "");
  const hours = String(page.hours || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const contactMethods = [
    { label: page.callLabel, value: page.phone, href: `tel:${String(page.phone || "").replace(/[^\d+]/g, "")}`, icon: "↗" },
    { label: page.emailLabel, value: page.email, href: `mailto:${page.email || ""}`, icon: "@" },
    { label: page.visitLabel, value: page.address, href: directionsUrl, icon: "⌖" }
  ].filter((item) => item.value);
  const faqItems = Array.isArray(site.faqs) ? site.faqs.slice(0, 4) : [];
  return `${contactPageHero(page)}
    <section class="page-body contact-page-body">
      <div class="contact-page-intro">
        <div class="contact-page-intro-copy">
          <p class="eyebrow">${escapeText(page.infoEyebrow)}</p>
          <h2>${escapeText(page.infoTitle)}</h2>
          <p>${escapeText(page.infoDescription)}</p>
        </div>
        <figure class="contact-page-image">
          <img src="${image}" alt="${escapeText(page.imageAlt)}" loading="lazy" />
          <figcaption>HOME SHAPE / HERE TO HELP</figcaption>
        </figure>
      </div>
      ${contactMethods.length ? `<div class="contact-method-grid">
        ${contactMethods.map((item) => `<article class="contact-method-card"><span aria-hidden="true">${escapeText(item.icon)}</span><p class="eyebrow">${escapeText(item.label)}</p><a href="${escapeText(item.href)}">${escapeText(item.value)}</a></article>`).join("")}
      </div>` : ""}
      ${showMap ? `<section class="contact-map-section">
        <div class="contact-map-info">
          <p class="eyebrow">${escapeText(page.hoursLabel)}</p>
          <h2>${escapeText(page.locationTitle)}</h2>
          <p class="contact-location-description">${escapeText(page.locationDescription)}</p>
          <div class="contact-address-block">
            <strong>${escapeText(page.visitLabel)}</strong>
            <span>${escapeText(page.address)}</span>
          </div>
          ${hours.length ? `<ul class="contact-hours-list">${hours.map((line) => `<li>${escapeText(line)}</li>`).join("")}</ul>` : ""}
          ${directionsUrl ? `<a class="contact-directions-link" href="${escapeText(directionsUrl)}" target="_blank" rel="noopener noreferrer">${escapeText(page.mapLinkLabel || "Get directions")} <span aria-hidden="true">↗</span></a>` : ""}
        </div>
        <div class="contact-map-frame"><iframe src="${mapEmbedUrl}" title="${escapeText(page.locationTitle)} map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
      </section>` : ""}
      <div class="contact-page-lower${showMap ? " contact-page-lower--form-only" : ""}">
        ${showMap ? "" : `<section class="contact-location-card">
          <p class="eyebrow">${escapeText(page.hoursLabel)}</p>
          <h2>${escapeText(page.locationTitle)}</h2>
          <p class="contact-location-description">${escapeText(page.locationDescription)}</p>
          <div class="contact-address-block">
            <strong>${escapeText(page.visitLabel)}</strong>
            <span>${escapeText(page.address)}</span>
          </div>
          ${hours.length ? `<ul class="contact-hours-list">${hours.map((line) => `<li>${escapeText(line)}</li>`).join("")}</ul>` : ""}
          ${directionsUrl ? `<a class="contact-directions-link" href="${escapeText(directionsUrl)}" target="_blank" rel="noopener noreferrer">${escapeText(page.mapLinkLabel || "Get directions")} <span aria-hidden="true">↗</span></a>` : ""}
        </section>`}
        <section class="contact-form-wrap">
          <p class="eyebrow">${escapeText(page.formEyebrow)}</p>
          <h2>${escapeText(page.formTitle)}</h2>
          <p class="contact-form-description">${escapeText(page.formDescription)}</p>
          <form class="contact-form" id="contact-form">
            <label>${escapeText(page.formNameLabel)}<input name="name" autocomplete="name" required maxlength="120" /></label>
            <label>${escapeText(page.formEmailLabel)}<input name="email" type="email" autocomplete="email" required maxlength="254" /></label>
            <label class="full">${escapeText(page.formSubjectLabel)}<input name="subject" required maxlength="160" /></label>
            <label class="full">${escapeText(page.formMessageLabel)}<textarea name="message" required minlength="5" maxlength="10000"></textarea></label>
            <button class="button button-dark" type="submit">${escapeText(page.formSubmitLabel)} <span>↗</span></button>
            <p class="form-feedback" id="contact-feedback" role="status"></p>
          </form>
          <p class="contact-response-note">${escapeText(page.responseNote)}</p>
        </section>
      </div>
      ${faqItems.length ? `<section class="contact-faq-section">
        <div class="contact-faq-heading">
          <div><p class="eyebrow">${escapeText(page.faqEyebrow)}</p><h2>${escapeText(page.faqTitle)}</h2></div>
          <a href="pages.html?page=faqs">Browse all FAQs <span aria-hidden="true">↗</span></a>
        </div>
        <div class="contact-faq-grid">${faqItems.map((faq, index) => `<article class="contact-faq-item">
          <button class="faq-question" type="button" aria-expanded="${index === 0}" aria-controls="contact-faq-answer-${index}">
            <span>${escapeText(faq.question)}</span><span aria-hidden="true">+</span>
          </button>
          <div class="faq-answer" id="contact-faq-answer-${index}"${index ? " hidden" : ""}><p>${escapeText(faq.answer)}</p></div>
        </article>`).join("")}</div>
      </section>` : ""}
    </section>`;
}

function faqPage(site) {
  const page = site.pages?.faqs || {};
  const faqs = Array.isArray(site.faqs) ? site.faqs : [];
  return `${pageHero(page.title || "Frequently asked questions", page.intro || "Helpful answers about orders, delivery, payments and caring for your furniture.", page.eyebrow || "A FEW HELPFUL DETAILS")}
    <section class="page-body faq-wrap"><div class="faq-heading"><p class="eyebrow">${escapeText(page.sectionEyebrow || "HOW CAN WE HELP?")}</p><h2>${escapeText(page.sectionTitle || "Good to know")}</h2></div><div class="faq-list">${faqs.map((faq, index) => `<article class="faq-item"><button class="faq-question" type="button" aria-expanded="${index === 0}" aria-controls="faq-answer-${index}"><span>${escapeText(faq.question)}</span><span aria-hidden="true">+</span></button><div class="faq-answer" id="faq-answer-${index}"${index ? " hidden" : ""}><p>${escapeText(faq.answer)}</p></div></article>`).join("")}</div><div class="story-callout"><p>${escapeText(page.closingMessage || "Still have a question? We’re always happy to help.")}</p><a class="page-cta" href="pages.html?page=contact">${escapeText(page.contactLinkLabel || "Contact our team")} <span>↗</span></a></div></section>`;
}

function policyPage(site, key) {
  const page = site.pages?.[key] || {};
  const title = page.title || (key === "privacy" ? "Privacy Policy" : "Returns");
  const paragraphs = String(page.body || "").split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return `${pageHero(title, page.intro || "", page.eyebrow || "")}
    <section class="page-body"><article class="page-prose policy-copy">${paragraphs.map((paragraph) => `<p>${escapeText(paragraph).replace(/\n/g, "<br />")}</p>`).join("")}<a class="page-cta" href="pages.html?page=contact">Contact us <span>↗</span></a></article></section>`;
}

function blogPage(site) {
  const page = site.pages?.blog || {};
  const posts = Array.isArray(site.posts) ? site.posts : [];
  return `${pageHero(page.title || "Notes for a more considered home", page.intro || "Ideas, inspiration, and a closer look at the pieces that make a room yours.", page.eyebrow || "THE HOME SHAPE JOURNAL", site.blogHeroBackgroundImage || "")}
    <section class="page-body"><div class="journal-grid">${posts.map((post) => {
      const url = `pages.html?page=post&slug=${encodeURIComponent(post.slug || slugifyArticleTitle(post.title))}`;
      return `<article class="journal-card"><a class="journal-image" href="${url}" aria-label="Read ${escapeText(post.title)}"><img src="${safeImageSource(post.image, "img/blog-grid-9.jpg.webp")}" alt="${escapeText(post.title)}" loading="lazy" /></a><div class="journal-copy"><time>${escapeText(post.date)}</time><h2><a href="${url}">${escapeText(post.title)}</a></h2><p>${escapeText(post.excerpt)}</p><a class="journal-read-more" href="${url}">Continue reading <span aria-hidden="true">↗</span></a></div></article>`;
    }).join("")}</div></section>`;
}

function slugifyArticleTitle(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function articleUrl(post) {
  return `pages.html?page=post&slug=${encodeURIComponent(post.slug || slugifyArticleTitle(post.title))}`;
}

function articlePage(site) {
  const posts = Array.isArray(site.posts) ? site.posts : [];
  const requestedSlug = params.get("slug") || "";
  const post = posts.find((item) => (item.slug || slugifyArticleTitle(item.title)) === requestedSlug);
  if (!post) {
    return `${pageHero("Article not found", "This journal article may have moved. Browse the latest notes from Home Shape.", "THE HOME SHAPE JOURNAL")}<section class="page-body"><a class="page-cta" href="pages.html?page=blog">Back to the journal <span>↗</span></a></section>`;
  }
  const author = site.blogAuthor || {};
  const authorName = author.name || "Home Shape Studio";
  const authorImage = safeImageSource(author.image, "/legacy/blog-author.svg");
  const sections = (Array.isArray(site.postSections) ? site.postSections : []).filter((section) => section.slug === (post.slug || slugifyArticleTitle(post.title)));
  const sectionMarkup = sections.length ? sections.map((section) => `<section class="journal-article-section">${section.heading ? `<h2>${escapeText(section.heading)}</h2>` : ""}${String(section.body || "").split("~").map((paragraph) => paragraph.trim()).filter(Boolean).map((paragraph) => `<p>${escapeText(paragraph)}</p>`).join("")}${section.image ? `<figure><img src="${safeImageSource(section.image, post.image)}" alt="${escapeText(section.heading || post.title)}" loading="lazy" /></figure>` : ""}</section>`).join("") : `<section class="journal-article-section"><p>${escapeText(post.excerpt || "")}</p></section>`;
  const index = posts.indexOf(post);
  const newer = index > 0 ? posts[index - 1] : null;
  const older = index < posts.length - 1 ? posts[index + 1] : null;
  const related = posts.filter((item) => item !== post).slice(0, 3);
  return `<section class="journal-article page-body">
    <div class="journal-article-heading"><div class="journal-article-categories"><a href="pages.html?page=blog">Journal</a><span>·</span><span>Furniture &amp; living</span></div><h1>${escapeText(post.title)}</h1><div class="journal-article-byline"><img src="${authorImage}" alt="" /><span>By <strong>${escapeText(authorName)}</strong></span><i aria-hidden="true">·</i><time>${escapeText(post.date)}</time></div></div>
    <figure class="journal-article-hero"><img src="${safeImageSource(post.image, "img/blog-grid-9.jpg.webp")}" alt="${escapeText(post.title)}" /><figcaption>${escapeText(post.title)}</figcaption></figure>
    <div class="journal-article-layout"><article class="journal-article-copy"><p class="journal-article-lead">${escapeText(post.excerpt || "")}</p>${sectionMarkup}
      <div class="journal-article-tags"><span>Filed under</span><a href="pages.html?page=blog">Furniture</a><a href="pages.html?page=blog">Inspiration</a></div>
      <div class="journal-author-card"><img src="${authorImage}" alt="" /><div><p class="eyebrow">ABOUT THE AUTHOR</p><h2>${escapeText(authorName)}</h2><p>${escapeText(author.bio || "Ideas and inspiration for a more considered home.")}</p></div></div>
      <nav class="journal-post-navigation" aria-label="More journal articles">${newer ? `<a href="${articleUrl(newer)}"><small>NEWER POST</small><strong>← ${escapeText(newer.title)}</strong></a>` : "<span></span>"}<a class="journal-post-back" href="pages.html?page=blog">Back to list</a>${older ? `<a href="${articleUrl(older)}"><small>OLDER POST</small><strong>${escapeText(older.title)} →</strong></a>` : "<span></span>"}</nav>
    </article><aside class="journal-article-sidebar"><p class="eyebrow">THE JOURNAL</p><h2>More ideas for home</h2><p>Thoughtful notes on furniture, materials, and living well every day.</p><a class="page-cta" href="pages.html?page=blog">All journal posts <span>↗</span></a><div class="journal-recent-posts"><h3>Recent posts</h3>${posts.filter((item) => item !== post).slice(0, 3).map((item) => `<a href="${articleUrl(item)}"><img src="${safeImageSource(item.image, "img/blog-grid-9.jpg.webp")}" alt="" /><span><strong>${escapeText(item.title)}</strong><small>${escapeText(item.date)}</small></span></a>`).join("")}</div></aside></div>
    ${related.length ? `<section class="journal-related"><div class="about-section-heading"><p class="eyebrow">KEEP EXPLORING</p><h2>Related posts</h2></div><div class="journal-grid">${related.map((item) => `<article class="journal-card"><a class="journal-image" href="${articleUrl(item)}"><img src="${safeImageSource(item.image, "img/blog-grid-9.jpg.webp")}" alt="${escapeText(item.title)}" loading="lazy" /></a><div class="journal-copy"><time>${escapeText(item.date)}</time><h3><a href="${articleUrl(item)}">${escapeText(item.title)}</a></h3><p>${escapeText(item.excerpt)}</p><a class="journal-read-more" href="${articleUrl(item)}">Continue reading <span>↗</span></a></div></article>`).join("")}</div></section>` : ""}
  </section>`;
}

const pageRenderers = {
  about: aboutPage,
  story: storyPage,
  contact: contactPage,
  privacy: (site) => policyPage(site, "privacy"),
  returns: (site) => policyPage(site, "returns"),
  faqs: faqPage,
  blog: blogPage,
  post: articlePage
};
const pageTitles = { about: "About us", story: "Our story", contact: "Contact us", privacy: "Privacy Policy", returns: "Returns", faqs: "FAQs", blog: "Latest News", post: "Journal article" };

window.siteContentReady.then((site) => {
  if (!site) {
    pageRoot.innerHTML = `${pageHero("A little more thoughtful.", "Start the Node.js server and connect MongoDB to load the latest store pages.", "HOME SHAPE")}<section class="page-body"><a class="page-cta" href="index.html">Back to home <span>↗</span></a></section>`;
    return;
  }
  const render = pageRenderers[pageKey] || aboutPage;
  pageRoot.innerHTML = render(site);
  window.storeLocaleRefresh?.(pageRoot);
  const currentPage = site.pages?.[pageKey] || {};
  const articleTitle = pageKey === "post" ? site.posts?.find((post) => (post.slug || slugifyArticleTitle(post.title)) === params.get("slug"))?.title : "";
  const pageTitle = articleTitle || currentPage.title || pageTitles[pageKey] || "About us";
  document.title = `${pageTitle} | ${site.siteName || "Home Shape"}`;
  if (currentPage.intro) {
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = currentPage.intro;
  }
  document.querySelectorAll(".footer-description").forEach((node) => { node.textContent = site.footer?.description || ""; });
  document.querySelectorAll(".footer-contact-list li").forEach((row) => {
    if (row.textContent.includes("451 Wall")) row.lastElementChild.textContent = site.footer?.address || "";
    if (row.textContent.includes("Phone:")) row.lastElementChild.textContent = `Phone: ${site.footer?.phone || ""}`;
    if (row.textContent.includes("@")) row.lastElementChild.textContent = site.footer?.email || "";
  });
  document.querySelectorAll(".footer-bottom span:first-child").forEach((node) => { node.textContent = site.footer?.copyright || ""; });
  document.querySelectorAll(".faq-question").forEach((button) => button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    document.querySelector(`#${button.getAttribute("aria-controls")}`).hidden = !open;
  }));
  const form = document.querySelector("#contact-form");
  const contactSuccessMessage = site.pages?.contact?.successMessage || "Thanks for reaching out. Our team will be in touch soon.";
  if (form) form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const feedback = document.querySelector("#contact-feedback");
    button.disabled = true;
    feedback.textContent = "Sending…";
    try {
      const values = Object.fromEntries(new FormData(form));
      await window.submitStoreInquiry({ ...values, type: "contact" });
      feedback.textContent = contactSuccessMessage;
      form.reset();
    } catch (error) {
      feedback.textContent = error.message;
    } finally { button.disabled = false; }
  });
});

document.querySelector(".mobile-menu-button").addEventListener("click", (event) => {
  const nav = document.querySelector(".main-nav");
  const open = nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});
const categoryMenu = document.querySelector(".category-menu");
const categoryToggle = categoryMenu.querySelector(".category-menu-toggle");
categoryToggle.addEventListener("click", () => {
  const open = categoryMenu.classList.toggle("is-open");
  categoryToggle.setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (event) => {
  if (!categoryMenu.contains(event.target)) {
    categoryMenu.classList.remove("is-open");
    categoryToggle.setAttribute("aria-expanded", "false");
  }
});
document.querySelector(".header-search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const query = event.currentTarget.querySelector('input[type="search"]').value.trim();
  window.location.href = `furniture.html?search=${encodeURIComponent(query)}`;
});
