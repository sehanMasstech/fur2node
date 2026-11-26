(() => {
  const apiBase = String(window.STORE_API_BASE_URL || "").replace(/\/+$/, "");
  const apiUrl = (path) => apiBase
    ? new URL(`/api/${path}`, apiBase)
    : new URL(`./api/${path}`, window.location.href);

  async function sendInquiry(data) {
    const response = await fetch(apiUrl("inquiries"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your message could not be sent. Please try again.");
    return result;
  }

  window.storeApiUrl = apiUrl;
  window.submitStoreInquiry = sendInquiry;
  window.siteContentReady = fetch(apiUrl("site"))
    .then((response) => {
      if (!response.ok) throw new Error("Site content is not available.");
      return response.json();
    })
    .catch((error) => {
      console.warn("The CMS is offline; using the static storefront content.", error);
      return {
        siteName: "Home Shape",
        announcement: "FREE SHIPPING FOR ALL ORDERS OVER د.إ 150",
        heroEyebrow: "Designed for everyday living",
        heroTitle: "Take a seat.",
        heroEmphasis: "stay a while.",
        heroDescription: "Considered furniture and home pieces that bring a little more comfort to the everyday.",
        heroImage: "img/slider-main-demo-1.jpg.webp",
        heroPrice: "د.إ 199.00",
        categories: ["Furniture", "Outdoor Furniture", "Hotel Bar Furniture", "Coffee Shop Furniture", "Cafe Furniture", "Restaurant Furniture", "Hotel Dining Furniture", "Banquet & Event Chairs"],
        navigation: [
          { label: "Home", url: "index.html" },
          { label: "About us", url: "pages.html?page=about" },
          { label: "Contact Us", url: "pages.html?page=contact" },
          { label: "Our Story", url: "pages.html?page=story" },
          { label: "Our Blogs", url: "pages.html?page=blog" }
        ],
        pages: {
          about: { title: "A more thoughtful kind of home", intro: "We believe the things we live with should feel as good as the way they are made.", body: "Home Shape brings together furniture with honest materials, enduring forms, and room for real life." },
          story: { title: "Our story", intro: "Good design makes everyday life feel a little more considered.", body: "Home Shape began with a simple idea: bring together useful, beautiful furniture made with care." },
          contact: {
            title: "We’d love to hear from you",
            intro: "Questions about a piece, an order, or a project? Our team is here to help.",
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
            address: "451 Wall Street, London",
            phone: "+44 (064) 332-1233",
            email: "hello@homeshape.example",
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
            faqTitle: "Good to know before you reach out"
          }
        },
        faqs: [
          { question: "How long will delivery take?", answer: "In-stock pieces are usually dispatched within 2–5 business days." },
          { question: "How much does delivery cost?", answer: "Delivery costs are shown at checkout before you place your order." }
        ],
        posts: [{ title: "Seating that makes room for conversation", image: "img/blog-grid-9.jpg.webp", excerpt: "Thoughtful details make a room feel like home.", date: "July 23, 2025" }],
        footer: { description: "Thoughtful things for the everyday.", address: "451 Wall Street, London", phone: "+44 (064) 332-1233", email: "hello@homeshape.example", copyright: "© 2025 Home Shape Studio" },
        popup: { enabled: true, title: "A little good news for your inbox", description: "Get considered furniture stories and a welcome offer on your first order.", button: "Count me in" }
      };
    });

  function setText(selector, value) {
    if (typeof value !== "string" || !value) return;
    document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  }

  function setPageLinks(site) {
    const selectors = [".topbar-right > a"];
    if (!Array.isArray(site.navigation)) selectors.push(".nav-links a");
    if (!Array.isArray(site.footer?.columns)) selectors.push(".footer-links a", ".footer-menu a");
    document.querySelectorAll(selectors.join(", ")).forEach((link) => {
      const label = link.textContent.trim().toLowerCase();
      if (label.includes("about us")) link.href = "pages.html?page=about";
      else if (label.includes("our story")) link.href = "pages.html?page=story";
      else if (label.includes("contact")) link.href = "pages.html?page=contact";
      else if (label.includes("faq")) link.href = "pages.html?page=faqs";
      else if (label.includes("blog") || label.includes("latest news")) link.href = "pages.html?page=blog";
    });
  }

  function socialIcon(label) {
    const name = String(label || "").trim().toLowerCase();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const networkClass = name === "facebook" || name === "fb" || name === "f" ? "social-icon-facebook"
      : name === "x" || name === "twitter" ? "social-icon-x"
        : name === "instagram" || name === "ig" || name === "i" ? "social-icon-instagram"
          : name === "youtube" || name === "yt" || name === "y" ? "social-icon-youtube" : "social-icon-link";
    svg.classList.add(networkClass);
    const add = (tag, attributes, className = "") => {
      const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
      if (className) node.setAttribute("class", className);
      svg.append(node);
    };
    if (name === "facebook" || name === "fb" || name === "f") {
      add("path", { d: "M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.8v8h3.4Z" });
    } else if (name === "x" || name === "twitter") {
      add("path", { d: "m5 4 14 16M19 4 5 20" });
    } else if (name === "instagram" || name === "ig" || name === "i") {
      add("rect", { x: "3", y: "3", width: "18", height: "18", rx: "5" });
      add("circle", { cx: "12", cy: "12", r: "4" });
      add("circle", { cx: "17.5", cy: "6.5", r: ".7" }, "social-icon-dot");
    } else if (name === "youtube" || name === "yt" || name === "y") {
      add("path", { d: "M22 8.2a2.8 2.8 0 0 0-2-2c-1.8-.5-8-.5-8-.5s-6.2 0-8 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1.5 12 29 29 0 0 0 2 15.8a2.8 2.8 0 0 0 2 2c1.8.5 8 .5 8 .5s6.2 0 8-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-3.8 29 29 0 0 0-.5-3.8Z" });
      add("path", { d: "m10 15 5-3-5-3v6Z" }, "social-icon-play");
    } else {
      add("path", { d: "M10 13a5 5 0 0 0 7.1 0l2-2A5 5 0 0 0 12 3.9l-1.1 1.1M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" });
    }
    return svg;
  }

  function safeHref(value) {
    try {
      const url = new URL(value || "#", window.location.href);
      return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? value : "#";
    } catch (error) {
      return "#";
    }
  }

  function safeSocialHref(value) {
    let href = String(value || "").trim();
    if (!href || href === "#") return "#";
    if (href.startsWith("#")) href = href.slice(1);
    if (!/^https?:\/\//i.test(href)) href = `https://${href.replace(/^\/\//, "")}`;
    return safeHref(href);
  }

  function renderNavigation(links) {
    if (!Array.isArray(links)) return;
    const navigation = links.some((item) => String(item.label || "").trim().toLowerCase() === "home")
      ? links
      : [{ label: "Home", url: "index.html" }, ...links];
    document.querySelectorAll(".nav-links").forEach((nav) => {
      nav.replaceChildren(...navigation.map((item) => {
        const anchor = document.createElement("a");
        anchor.textContent = item.label || "";
        anchor.href = safeHref(item.url);
        return anchor;
      }));
    });
    window.storeLocaleRefresh?.(document.querySelector(".nav-links") || document.body);
  }

  function renderFooter(footer) {
    if (!footer) return;
    const footerMain = document.querySelector(".footer-main");
    if (footerMain && Array.isArray(footer.columns)) {
      const contact = footerMain.querySelector(".footer-contact");
      footerMain.replaceChildren(...[contact, ...footer.columns.map((column) => {
        const section = document.createElement("section");
        section.className = "footer-widget";
        const heading = document.createElement("h3");
        heading.textContent = column.title || "";
        section.append(heading);
        const list = document.createElement("ul");
        list.className = "footer-links";
        (column.links || []).forEach((link) => {
          const item = document.createElement("li");
          const anchor = document.createElement("a");
          anchor.textContent = link.label || "";
          anchor.href = safeHref(link.url);
          item.append(anchor);
          list.append(item);
        });
        section.append(list);
        return section;
      })]);
    }
    const menu = document.querySelector(".footer-menu");
    if (menu && Array.isArray(footer.menu)) {
      [...menu.querySelectorAll("a")].forEach((link) => link.remove());
      footer.menu.forEach((item) => {
        const anchor = document.createElement("a");
        anchor.textContent = item.label || "";
        anchor.href = safeHref(item.url);
        menu.append(anchor);
      });
    }
    const socials = document.querySelector(".footer-social");
    if (socials && Array.isArray(footer.social)) {
      socials.replaceChildren(...footer.social.map((item) => {
        const anchor = document.createElement("a");
        const href = safeSocialHref(item.url);
        anchor.href = href;
        if (/^https?:\/\//i.test(href)) {
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
        }
        const networkName = { f: "Facebook", fb: "Facebook", x: "X", twitter: "X", i: "Instagram", ig: "Instagram", y: "YouTube", yt: "YouTube" }[String(item.label || "").trim().toLowerCase()];
        anchor.setAttribute("aria-label", networkName || item.label || "Social media");
        anchor.append(socialIcon(item.label));
        return anchor;
      }));
    }
  }

  function categoryHref(path) {
    return path === "Furniture" ? "furniture.html" : `furniture.html?category=${encodeURIComponent(path)}`;
  }

  function createCategoryAnchor(name, path, className, hint) {
    const anchor = document.createElement("a");
    anchor.className = className;
    anchor.href = categoryHref(path);
    const label = document.createElement("span");
    label.textContent = name;
    anchor.append(label);
    if (hint) {
      const description = document.createElement("small");
      const shopAllMatch = /^Shop all (.+)$/i.exec(hint);
      if (shopAllMatch) {
        description.append(document.createTextNode("Shop all "));
        const categoryName = document.createElement("span");
        categoryName.textContent = shopAllMatch[1];
        description.append(categoryName);
      } else description.textContent = hint;
      anchor.append(description);
    }
    return anchor;
  }

  function categoryMenuIcon(name) {
    const value = String(name || "").toLowerCase();
    if (value === "hotel bar furniture") return "ref-cat-bar.svg";
    if (value === "coffee shop furniture") return "ref-cat-coffee.svg";
    if (value === "cafe furniture") return "ref-cat-cafe.svg";
    if (value === "restaurant furniture") return "ref-cat-knives.svg";
    if (value === "hotel dining furniture") return "ref-cat-dining.svg";
    if (value === "banquet & event chairs") return "ref-cat-event.svg";
    if (/cook|kitchen/.test(value)) return "ref-cat-knives.svg";
    if (/accessor|flower|decor/.test(value)) return "ref-cat-flower.svg";
    if (/clock|watch/.test(value)) return "ref-cat-clock.svg";
    if (/light|lamp/.test(value)) return "ref-cat-light-bulb.svg";
    if (/toy|kids|child/.test(value)) return "ref-cat-rocking-horse.svg";
    if (/hand|garden|outdoor/.test(value)) return "ref-cat-tree.svg";
    if (/fashion|clothing/.test(value)) return "ref-cat-flower.svg";
    if (/electronic|tech/.test(value)) return "ref-cat-light-bulb.svg";
    return "ref-cat-chair.svg";
  }

  function renderCategoryMenuPanel(category) {
    const panel = document.createElement("section");
    panel.className = "category-menu-panel";
    panel.setAttribute("aria-label", `${category.name} subcategories`);
    if (!Array.isArray(category.children) || !category.children.length) {
      const empty = document.createElement("div");
      empty.className = "category-menu-empty-state";
      const eyebrow = document.createElement("span");
      eyebrow.className = "category-menu-empty-eyebrow";
      eyebrow.textContent = "THE COLLECTION";
      const heading = document.createElement("h3");
      heading.textContent = category.name;
      const description = document.createElement("p");
      description.textContent = "Explore the complete collection and find the right pieces for your space.";
      const shopLink = createCategoryAnchor(category.name, category.name, "category-menu-panel-empty", `Shop all ${category.name}`);
      empty.append(eyebrow, heading, description, shopLink);
      panel.append(empty);
      return panel;
    }

    const subcategories = document.createElement("div");
    subcategories.className = "category-menu-subcategories";
    category.children.forEach((subcategory) => {
      const group = document.createElement("div");
      group.className = "category-menu-subgroup";
      const subcategoryPath = `${category.name} > ${subcategory.name}`;
      group.append(createCategoryAnchor(subcategory.name, subcategoryPath, "category-menu-subcategory"));
      if (Array.isArray(subcategory.children) && subcategory.children.length) {
        const children = document.createElement("div");
        children.className = "category-menu-child-links";
        subcategory.children.forEach((child) => {
          children.append(createCategoryAnchor(child.name, `${subcategoryPath} > ${child.name}`, "category-menu-child"));
        });
        group.append(children);
      }
      subcategories.append(group);
    });
    panel.append(subcategories);
    return panel;
  }

  function renderCategoryMegaMenu(categoryTree) {
    const rootList = document.createElement("div");
    rootList.className = "category-menu-root-list";
    const panels = document.createElement("div");
    panels.className = "category-menu-panels";
    const rootItems = [];
    const categoryPanels = [];

    function activate(index) {
      rootItems.forEach((item, itemIndex) => {
        const isActive = itemIndex === index;
        item.classList.toggle("is-active", isActive);
        item.querySelector(".category-menu-root-expand").setAttribute("aria-expanded", String(isActive));
      });
      categoryPanels.forEach((panel, panelIndex) => { panel.hidden = panelIndex !== index; });
    }

    categoryTree.forEach((category, index) => {
      const item = document.createElement("div");
      item.className = "category-menu-root-item";
      item.dataset.categoryRootIndex = String(index);

      const link = createCategoryAnchor(category.name, category.name, "category-menu-root-link", "");
      const icon = document.createElement("img");
      icon.className = "category-menu-root-icon";
      icon.src = `/img/${categoryMenuIcon(category.name)}?v=category-icons-7`;
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      link.prepend(icon);
      link.addEventListener("pointerenter", () => activate(index));
      link.addEventListener("focus", () => activate(index));

      const expand = document.createElement("button");
      expand.type = "button";
      expand.className = "category-menu-root-expand";
      expand.textContent = "›";
      expand.setAttribute("aria-label", `Show ${category.name} subcategories`);
      expand.setAttribute("aria-controls", `category-menu-panel-${index}`);
      expand.setAttribute("aria-expanded", "false");

      const panel = renderCategoryMenuPanel(category);
      panel.id = `category-menu-panel-${index}`;
      item.append(link, expand);
      rootList.append(item);
      panels.append(panel);
      rootItems.push(item);
      categoryPanels.push(panel);
    });

    const menu = document.createElement("div");
    menu.className = "category-menu-mega-menu";
    menu.append(rootList, panels);
    menu.addEventListener("pointerover", (event) => {
      const item = event.target.closest("[data-category-root-index]");
      if (item && menu.contains(item)) activate(Number(item.dataset.categoryRootIndex));
    });
    menu.addEventListener("focusin", (event) => {
      const item = event.target.closest("[data-category-root-index]");
      if (item && menu.contains(item)) activate(Number(item.dataset.categoryRootIndex));
    });
    menu.addEventListener("click", (event) => {
      const expand = event.target.closest(".category-menu-root-expand");
      if (!expand) return;
      event.preventDefault();
      const item = expand.closest("[data-category-root-index]");
      activate(Number(item.dataset.categoryRootIndex));
    });

    if (categoryTree.length) activate(0);
    return menu;
  }

  function flattenCategories(tree, ancestors = []) {
    return tree.flatMap((category) => {
      const pathParts = [...ancestors, category.name];
      return [
        { name: category.name, path: pathParts.join(" > "), depth: ancestors.length },
        ...flattenCategories(category.children || [], pathParts)
      ];
    });
  }

  function renderFilterCategory(category, ancestors = []) {
    const path = [...ancestors, category.name];
    const fullPath = path.join(" > ");
    const item = document.createElement("li");
    const link = createCategoryAnchor(category.name, fullPath, "", "");
    link.dataset.categoryPath = fullPath;
    const arrow = document.createElement("span");
    arrow.textContent = "›";
    link.append(" ", arrow);
    item.append(link);
    if (Array.isArray(category.children) && category.children.length) {
      const children = document.createElement("ul");
      children.className = "filter-category-sublist";
      category.children.forEach((child) => children.append(renderFilterCategory(child, path)));
      item.append(children);
    }
    return item;
  }

  function updateCategoryNames(categories, categoryTree) {
    if (!Array.isArray(categories) || !categories.length) return;
    document.querySelectorAll(".category-nav a").forEach((link) => {
      const name = link.querySelector("strong")?.textContent?.trim() || "";
      const icon = link.querySelector("img");
      if (icon && name) icon.src = `/img/${categoryMenuIcon(name)}?v=category-icons-7`;
    });
    document.querySelectorAll(".category-menu-dropdown").forEach((menu) => {
      menu.classList.add("hierarchical-category-menu");
      menu.replaceChildren(renderCategoryMegaMenu(categoryTree));
    });
    window.storeLocaleRefresh?.(document.querySelector(".main-nav") || document.body);
    document.querySelectorAll(".search-category").forEach((select) => {
      const current = select.value;
      select.replaceChildren();
      const all = document.createElement("option");
      all.value = "All";
      all.textContent = "Select category";
      select.append(all);
      flattenCategories(categoryTree).forEach(({ path, depth, name }) => {
        const option = document.createElement("option");
        option.value = path;
        option.textContent = `${"— ".repeat(depth)}${path}`;
        select.append(option);
      });
      if (current && [...select.options].some((option) => option.value === current)) select.value = current;
    });
    document.querySelectorAll(".hero-categories, .category-nav").forEach((list) => {
      let links = [...list.querySelectorAll(":scope > a")];
      while (links.length > categories.length) links.pop().remove();
      while (links.length < categories.length && links.length) {
        const clone = links[0].cloneNode(true);
        list.append(clone);
        links.push(clone);
      }
      links.forEach((link, index) => {
      if (!categories[index]) return;
      const label = link.querySelector("span");
      if (label) {
        const strong = label.querySelector("strong");
        if (strong) strong.textContent = categories[index];
        else label.textContent = categories[index];
      }
      link.dataset.category = categories[index];
      link.href = categories[index] === "Furniture" ? "furniture.html" : `furniture.html?category=${encodeURIComponent(categories[index])}`;
      });
    });
    const activeCategory = new URLSearchParams(window.location.search).get("category");
    document.querySelectorAll(".category-nav > a").forEach((link) => {
      const category = link.dataset.category || "";
      const isActive = activeCategory
        ? activeCategory === category || activeCategory.startsWith(`${category} > `)
        : category === "Furniture";
      link.classList.toggle("active", isActive);
    });
    document.querySelectorAll(".filter-category-list").forEach((list) => {
      list.replaceChildren(...categoryTree.map((category) => renderFilterCategory(category)));
      const activeCategory = new URLSearchParams(window.location.search).get("category");
      list.querySelectorAll("a").forEach((link) => {
        const path = link.dataset.categoryPath;
        if (activeCategory === path || (!activeCategory && path === "Furniture")) link.parentElement.classList.add("current");
      });
    });
    document.querySelectorAll(".featured-category-card").forEach((card, index) => {
      if (!categories[index]) return;
      const title = card.querySelector(".featured-category-title");
      if (title) {
        const count = title.querySelector(".featured-category-product-count");
        title.textContent = categories[index];
        if (count) title.append(count);
      }
      card.dataset.category = categories[index];
      card.href = categories[index] === "Furniture" ? "furniture.html" : `furniture.html?category=${encodeURIComponent(categories[index])}`;
    });
    document.querySelectorAll(".featured-category-card img").forEach((image, index) => {
      if (categories[index] && categories[index] !== "Furniture") {
        image.alt = `${categories[index]} furniture collection`;
      }
    });
  }

  function renderHomePosts(posts) {
    const track = document.querySelector(".news-track");
    if (!track || !Array.isArray(posts)) return;
    const escape = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
    track.innerHTML = posts.map((post) => `<article class="news-card"><div class="news-image"><img src="${escape(post.image)}" alt="" loading="lazy" /><time>${escape(post.date)}</time></div><div class="news-card-content"><div class="news-categories"><a href="pages.html?page=blog">Furniture</a><a href="pages.html?page=blog">Inspiration</a></div><h3><a href="pages.html?page=blog">${escape(post.title)}</a></h3><div class="news-meta"><span>Home Shape Journal</span><time>${escape(post.date)}</time></div><p>${escape(post.excerpt)}</p><a class="news-read-more" href="pages.html?page=blog">Continue reading</a></div></article>`).join("");
  }

  function applySiteContent(site) {
    if (!site || typeof site !== "object") return;
    setText(".shipping-message", site.announcement);
    document.querySelectorAll(".wordmark").forEach((mark) => {
      if (mark.querySelector(".site-brand-image, .site-brand-text")) return;
      const span = mark.querySelector("span");
      if (span && site.siteName) {
        const [first, ...rest] = site.siteName.trim().split(/\s+/);
        mark.firstChild.textContent = first || "";
        span.textContent = rest.join(" ");
      }
    });
    const hero = document.querySelector(".hero");
    if (hero) {
      setText(".hero-eyebrow-text", site.heroEyebrow);
      setText(".hero-title-line", site.heroTitle);
      setText(".hero-title-emphasis", site.heroEmphasis);
      setText(".hero-description", site.heroDescription);
      setText(".hero-price", site.heroPrice);
      const image = hero.querySelector(".hero-visual > img");
      if (image && site.heroImage) image.src = site.heroImage;
    }
    setText(".featured-categories-heading > p", site.homeCollectionKicker);
    setText("#collections-title", site.homeCollectionTitle);
    setText(".featured-categories-heading > span", site.homeCollectionDescription);
    document.querySelectorAll(".featured-category-card img").forEach((image, index) => {
      if (site.categoryImages?.[index]) image.src = site.categoryImages[index];
    });
    setText(".product-section-kicker", site.homeProductKicker);
    setText("#products-title", site.homeProductsTitle);
    setText(".product-section-description", site.homeProductsDescription);
    setText(".all-in-one-kicker", site.homeAboutKicker);
    setText("#all-in-one-title", site.homeAboutTitle);
    setText(".all-in-one-description", site.homeAboutDescription);
    setText("#join-newsletter-title", site.homeNewsletterTitle);
    setText(".latest-news-kicker", site.homeJournalKicker);
    setText("#latest-news-title", site.homeJournalTitle);
    setText(".latest-news-heading > p:last-child", site.homeJournalDescription);
    const aboutImage = document.querySelector(".all-in-one-image");
    if (aboutImage && site.homeAboutImage) aboutImage.src = site.homeAboutImage;
    const category = new URLSearchParams(window.location.search).get("category");
    const categoryHeading = document.querySelector("#category-title");
    if (category && categoryHeading) {
      categoryHeading.textContent = category;
      const breadcrumb = document.querySelector(".archive-breadcrumbs > span:last-child");
      if (breadcrumb) breadcrumb.textContent = category;
      document.title = `${category} | ${site.siteName || "Home Shape"}`;
    }
    setText(".footer-description", site.footer?.description);
    setText(".footer-contact-list li:nth-child(1) span:last-child", site.footer?.address);
    setText(".footer-contact-list li:nth-child(2) span:last-child", `Phone: ${site.footer?.phone || ""}`);
    setText(".footer-bottom span:first-child", site.footer?.copyright);
    const footerEmail = document.querySelector(".footer-contact-list li:nth-child(3) span:last-child");
    if (footerEmail && site.footer?.email) {
      footerEmail.textContent = site.footer.email;
      const icon = footerEmail.parentElement.querySelector(".footer-icon");
      if (icon) icon.textContent = "E";
    }
    const categories = site.categories || [];
    const categoryTree = Array.isArray(site.categoryTree) && site.categoryTree.length
      ? site.categoryTree
      : categories.map((name) => ({ name, children: [] }));
    updateCategoryNames(categories, categoryTree);
    renderHomePosts(site.posts);
    renderNavigation(site.navigation);
    renderFooter(site.footer);
    setPageLinks(site);
    window.dispatchEvent(new CustomEvent("cms:loaded", { detail: site }));
  }

  function mountPopup(site) {
    if (!site?.popup?.enabled || document.querySelector(".email-popup")) return;
    const dismissedAt = Number(localStorage.getItem("homeShapePopupDismissedAt") || 0);
    if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    const overlay = document.createElement("div");
    overlay.className = "email-popup";
    overlay.hidden = true;
    overlay.innerHTML = `<section class="email-popup-card" role="dialog" aria-modal="true" aria-labelledby="email-popup-title">
      <button class="email-popup-close" type="button" aria-label="Close email enquiry">&times;</button>
      <div class="email-popup-art"><img src="/img/furniture.jpg" alt="A considered wood-framed armchair" /><div class="email-popup-art-caption"><span>THE HOME SHAPE EDIT</span><strong>Comfort,<br />considered.</strong></div></div>
      <div class="email-popup-copy"><p class="email-popup-kicker">A NOTE FROM HOME SHAPE</p><h2 id="email-popup-title"></h2><p class="email-popup-description"></p>
        <form class="email-popup-form"><label>Your name<input name="name" autocomplete="name" maxlength="120" placeholder="Your name" /></label><label>Email address<input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com" /></label><label>What can we help with? <span class="email-popup-optional">Optional</span><textarea name="message" rows="2" maxlength="2000" placeholder="Share a question or just leave this blank"></textarea></label><button type="submit"></button><p class="email-popup-feedback" role="status"></p></form>
        <small>We’ll only send thoughtful notes. Unsubscribe whenever you like.</small>
      </div>
    </section>`;
    document.body.append(overlay);
    overlay.querySelector("#email-popup-title").textContent = site.popup.title || "A little good news for your inbox";
    overlay.querySelector(".email-popup-description").textContent = site.popup.description || "";
    overlay.querySelector("form button").textContent = site.popup.button || "Count me in";
    let returnFocus = null;
    const open = () => {
      returnFocus = document.activeElement;
      overlay.hidden = false;
      overlay.querySelector('input[type="email"]').focus();
    };
    const close = () => {
      overlay.hidden = true;
      localStorage.setItem("homeShapePopupDismissedAt", String(Date.now()));
      if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
    };
    overlay.querySelector(".email-popup-close").addEventListener("click", close);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !overlay.hidden) close(); });
    document.querySelectorAll(".topbar-newsletter, .join-newsletter-content h2, [data-email-popup]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        if (trigger.matches("a")) event.preventDefault();
        open();
      });
      if (!trigger.matches("a")) {
        trigger.tabIndex = 0;
        trigger.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        });
      }
    });
    overlay.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const popupForm = event.currentTarget;
      const data = Object.fromEntries(new FormData(popupForm));
      const feedback = overlay.querySelector(".email-popup-feedback");
      const button = popupForm.querySelector("button[type=submit]");
      button.disabled = true;
      try {
        await sendInquiry({ ...data, type: "newsletter", subject: "Email newsletter signup" });
        feedback.textContent = "Thank you — you’re on the list.";
        popupForm.reset();
        localStorage.setItem("homeShapePopupDismissedAt", String(Date.now()));
        setTimeout(() => { overlay.hidden = true; }, 1600);
      } catch (error) {
        feedback.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
    if (!sessionStorage.getItem("homeShapePopupSeen")) {
      sessionStorage.setItem("homeShapePopupSeen", "1");
      window.setTimeout(() => { if (!document.hidden) open(); }, 10000);
    }
  }

  function bindNewsletterForms() {
    document.querySelectorAll(".newsletter-form, .join-newsletter-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const input = form.querySelector('input[type="email"]');
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
          await sendInquiry({ email: input.value, type: "newsletter", subject: "Email newsletter signup" });
          const toast = document.querySelector(".toast");
          if (toast) {
            toast.textContent = "Thanks — you’re on the list.";
            toast.classList.add("visible");
            setTimeout(() => toast.classList.remove("visible"), 2600);
          }
          form.reset();
        } catch (error) {
          const toast = document.querySelector(".toast");
          if (toast) {
            toast.textContent = error.message;
            toast.classList.add("visible");
            setTimeout(() => toast.classList.remove("visible"), 3600);
          } else window.alert(error.message);
        } finally {
          button.disabled = false;
        }
      }, true);
    });
  }

  window.siteContentReady.then((site) => {
    if (site) {
      applySiteContent(site);
      mountPopup(site);
    }
  });
  window.integrationSettingsReady = fetch(apiUrl("settings"))
    .then((response) => response.ok ? response.json() : null)
    .then((settings) => {
      if (!settings) return;
      const branding = settings.branding || {};
      const brandText = String(branding.brandText || "Home Shape").trim() || "Home Shape";
      document.querySelectorAll(".wordmark").forEach((wordmark) => {
        const showIcon = ["icon", "icon-text"].includes(branding.logoMode) && branding.logoImage;
        wordmark.replaceChildren();
        if (showIcon) {
          const image = document.createElement("img");
          image.className = "site-brand-image";
          image.src = branding.logoImage;
          image.alt = branding.logoMode === "icon" ? brandText : "";
          wordmark.append(image);
        }
        if (!showIcon || branding.logoMode === "icon-text") {
          const text = document.createElement("span");
          text.className = "site-brand-text";
          text.textContent = brandText;
          wordmark.append(text);
        }
        wordmark.setAttribute("aria-label", `${brandText} home`);
      });
      if (branding.faviconImage) {
        try {
          const favicon = new URL(branding.faviconImage, window.location.origin);
          if (["http:", "https:"].includes(favicon.protocol)) {
            let iconLink = document.head.querySelector('link[rel="icon"]');
            if (!iconLink) { iconLink = document.createElement("link"); iconLink.rel = "icon"; document.head.append(iconLink); }
            iconLink.href = favicon.href;
          }
        } catch { /* Ignore an invalid favicon URL. */ }
      }
      const seo = settings.seo || {};
      const setMeta = (attribute, key, content) => {
        if (!content) return;
        let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
        if (!node) { node = document.createElement("meta"); node.setAttribute(attribute, key); document.head.append(node); }
        node.content = content;
      };
      if (seo.description) setMeta("name", "description", seo.description);
      if (seo.keywords) setMeta("name", "keywords", seo.keywords);
      if (seo.robots) setMeta("name", "robots", seo.robots);
      if (seo.googleSiteVerification) setMeta("name", "google-site-verification", seo.googleSiteVerification);
      if (seo.title) {
        setMeta("property", "og:title", seo.title);
        setMeta("name", "twitter:title", seo.title);
        if (["/", "/index", "/index.html"].includes(window.location.pathname)) document.title = seo.title;
      }
      if (seo.description) { setMeta("property", "og:description", seo.description); setMeta("name", "twitter:description", seo.description); }
      if (seo.ogImage) { try { setMeta("property", "og:image", new URL(seo.ogImage, window.location.origin).href); setMeta("name", "twitter:card", "summary_large_image"); } catch { /* Ignore an invalid social sharing image URL. */ } }
      if (seo.canonicalUrl) {
        let canonical = document.head.querySelector('link[rel="canonical"]');
        if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical); }
        try { canonical.href = new URL(window.location.pathname, seo.canonicalUrl).href; } catch {}
      }
      const analyticsId = String(seo.googleAnalyticsId || "").trim();
      if (/^G-[A-Z0-9]+$/i.test(analyticsId) && !document.querySelector(`[data-home-shape-analytics="${analyticsId}"]`)) {
        const script = document.createElement("script"); script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`; script.dataset.homeShapeAnalytics = analyticsId; document.head.append(script);
        const config = document.createElement("script"); config.dataset.homeShapeAnalytics = `${analyticsId}-config`; config.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${analyticsId}');`; document.head.append(config);
      }
      const pixelId = String(seo.metaPixelId || "").trim();
      if (/^\d{5,24}$/.test(pixelId) && !window.fbq) {
        const pixel = document.createElement("script"); pixel.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`;
        document.head.append(pixel);
      }
    })
    .catch(() => {});
  bindNewsletterForms();
})();
