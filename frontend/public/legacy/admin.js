const API_BASE = String(window.STORE_API_BASE_URL || "").replace(/\/+$/, "");
const API = `${API_BASE}/api`;
const loginView = document.querySelector("#login-view");
const adminView = document.querySelector("#admin-view");
const notice = document.querySelector("#notice");
const form = document.querySelector("#product-form");
const contentForm = document.querySelector("#content-form");
const categoryForm = document.querySelector("#category-form");
const categoryList = document.querySelector("#category-tree");
let products = [];
let inquiries = [];
let site = {};
let categoryTreeData = [];
let editingCategoryPath = "";
let adminEmail = "";
let inquiryFilter = "all";
let noticeTimer;

async function request(path, options = {}) {
  const token = sessionStorage.getItem("homeShapeAdminToken");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "same-origin",
    headers
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function showNotice(message, error = false) {
  notice.textContent = message;
  notice.classList.toggle("error", error);
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 3600);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function addImageUploadControl(target, label, applyUrl, validateSelection = () => {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "image-upload-field";
  const fieldLabel = target.closest("label");
  if (fieldLabel) {
    fieldLabel.parentNode.insertBefore(wrapper, fieldLabel);
    wrapper.append(fieldLabel);
  } else {
    target.parentNode.insertBefore(wrapper, target);
    wrapper.append(target);
  }

  const actions = document.createElement("div");
  actions.className = "image-upload-actions";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "image-upload-button";
  button.textContent = "Upload image";
  button.setAttribute("aria-label", `Upload ${label}`);
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*";
  picker.hidden = true;
  const status = document.createElement("span");
  status.className = "image-upload-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  actions.append(button, picker, status);
  wrapper.append(actions);

  let selection = null;
  button.addEventListener("click", () => {
    try {
      validateSelection();
      selection = target instanceof HTMLTextAreaElement
        ? { start: target.selectionStart, end: target.selectionEnd }
        : null;
      status.textContent = "";
      status.classList.remove("error");
      picker.click();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("error");
    }
  });

  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      status.textContent = "Choose an image file.";
      status.classList.add("error");
      picker.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      status.textContent = "Images must be 10 MB or smaller.";
      status.classList.add("error");
      picker.value = "";
      return;
    }

    button.disabled = true;
    status.textContent = "Uploading…";
    status.classList.remove("error");
    try {
      const signed = await request("/admin/cloudinary-signature", { method: "POST", body: "{}" });
      const upload = new FormData();
      upload.append("file", file);
      upload.append("api_key", signed.apiKey);
      upload.append("timestamp", String(signed.timestamp));
      upload.append("folder", signed.folder);
      upload.append("signature", signed.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`, {
        method: "POST",
        body: upload
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || "Cloudinary could not upload this image.");
      if (typeof result.secure_url !== "string" || !result.secure_url) {
        throw new Error("Cloudinary did not return a secure image URL.");
      }
      const activeSelection = selection || (target instanceof HTMLTextAreaElement
        ? { start: target.selectionStart, end: target.selectionEnd }
        : null);
      applyUrl(result.secure_url, activeSelection);
      status.textContent = "Image uploaded and path added.";
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("error");
    } finally {
      button.disabled = false;
      picker.value = "";
    }
  });
}

function textareaLineAt(textarea, offset) {
  const value = textarea.value;
  const start = value.lastIndexOf("\n", Math.max(offset - 1, 0)) + 1;
  const nextLine = value.indexOf("\n", offset);
  return { start, end: nextLine === -1 ? value.length : nextLine };
}

function renderAboutTeamEditor(members = []) {
  const host = contentForm.querySelector("[data-about-team-list]");
  if (!host) return;
  host.replaceChildren();
  const addMember = (member = {}) => {
    const card = document.createElement("article");
    card.className = "about-team-editor-card";
    const header = document.createElement("header");
    const title = document.createElement("strong");
    title.textContent = `Team member ${host.children.length + 1}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button about-team-remove";
    remove.textContent = "Remove";
    header.append(title, remove);
    const fields = document.createElement("div");
    fields.className = "form-row about-team-fields";
    const makeField = (labelText, className, value, placeholder = "") => {
      const label = document.createElement("label");
      label.textContent = labelText;
      const input = document.createElement("input");
      input.type = "text";
      input.className = className;
      input.value = value || "";
      input.placeholder = placeholder;
      label.append(input);
      return { label, input };
    };
    const name = makeField("Name or team", "about-team-name", member.name, "Studio team");
    const role = makeField("Role", "about-team-role", member.role, "Design & selection");
    const image = makeField("Photo image path", "about-team-image", member.image, "img/team-photo.jpg");
    fields.append(name.label, role.label, image.label);
    card.append(header, fields);
    host.append(card);
    addImageUploadControl(image.input, "an About team member image", (url) => { image.input.value = url; });
  };
  members.forEach((member) => addMember(member));
  host.onclick = (event) => {
    if (!event.target.closest(".about-team-remove")) return;
    event.target.closest(".about-team-editor-card")?.remove();
    [...host.children].forEach((card, index) => { card.querySelector("header strong").textContent = `Team member ${index + 1}`; });
  };
}

document.querySelector("#about-team-add")?.addEventListener("click", () => {
  const host = contentForm.querySelector("[data-about-team-list]");
  const current = [...host.querySelectorAll(".about-team-editor-card")].map((card) => ({
    name: card.querySelector(".about-team-name").value,
    role: card.querySelector(".about-team-role").value,
    image: card.querySelector(".about-team-image").value
  }));
  current.push({});
  renderAboutTeamEditor(current);
});

function readAboutTeamEditor() {
  return [...contentForm.querySelectorAll(".about-team-editor-card")].map((card) => ({
    name: card.querySelector(".about-team-name").value.trim(),
    role: card.querySelector(".about-team-role").value.trim(),
    image: card.querySelector(".about-team-image").value.trim()
  })).filter((member) => member.name || member.role || member.image);
}

function installImageUploaders() {
  [
    [form.elements.image, "the main product image"],
    [form.elements.hoverImage, "the product hover image"],
    [form.elements.detailImageOne, "the first product detail image"],
    [form.elements.detailImageTwo, "the second product detail image"],
    [contentForm.elements.homeAboutImage, "the homepage about image"],
    [contentForm.elements.aboutHeroBackgroundImage, "the About page opening background image"],
    [contentForm.elements.accountHeroBackgroundImage, "the account page hero background image"],
    [contentForm.elements.aboutImage, "the About page store image"],
    [contentForm.elements.aboutHistoryImage, "the About page history image"],
    [contentForm.elements.storyHeroBackgroundImage, "the Our story page background image"],
    [contentForm.elements.blogHeroBackgroundImage, "the blog page background image"],
    [contentForm.elements.contactHeroBackgroundImage, "the contact page hero background image"],
    [contentForm.elements.contactImage, "the contact page image"],
    [contentForm.elements.blogAuthorImage, "the blog author image"]
  ].forEach(([input, label]) => {
    addImageUploadControl(input, label, (url) => { input.value = url; });
  });

  const aboutGallery = contentForm.elements.aboutGallery;
  addImageUploadControl(aboutGallery, "an About page gallery image", (url, selection) => {
    const line = textareaLineAt(aboutGallery, selection.start);
    aboutGallery.setRangeText(url, line.start, line.end, "select");
  });

  const posts = contentForm.elements.posts;
  addImageUploadControl(posts, "a blog article image", (url, selection) => {
    const line = textareaLineAt(posts, selection.start);
    const parts = posts.value.slice(line.start, line.end).split("|");
    parts[2] = url;
    posts.setRangeText(parts.map((part) => part.trim()).join(" | "), line.start, line.end, "select");
  }, () => {
    const line = textareaLineAt(posts, posts.selectionStart);
    if (posts.value.slice(line.start, line.end).split("|").length < 4) {
      throw new Error("Place the cursor on a blog row: title | excerpt | image path | date.");
    }
  });

  const postSections = contentForm.elements.postSections;
  addImageUploadControl(postSections, "an article section image", (url, selection) => {
    const line = textareaLineAt(postSections, selection.start);
    const parts = postSections.value.slice(line.start, line.end).split("|").map((part) => part.trim());
    parts[3] = url;
    postSections.setRangeText(parts.join(" | "), line.start, line.end, "select");
  }, () => {
    const line = textareaLineAt(postSections, postSections.selectionStart);
    if (postSections.value.slice(line.start, line.end).split("|").length < 3) {
      throw new Error("Place the cursor on a section row: post title | section heading | paragraphs | image path.");
    }
  });

  addImageUploadControl(form.elements.colorImages, "a product color image", (url, selection) => {
    const input = form.elements.colorImages;
    const line = textareaLineAt(input, selection.start);
    input.setRangeText(url, line.start, line.end, "select");
  });
}

const homepageListConfig = {
  heroSlides: { title: "Banner", fields: [["eyebrow", "Small heading"], ["title", "Main heading"], ["emphasis", "Highlighted heading"], ["description", "Description", "textarea"], ["price", "Price text"], ["image", "Banner image"]] },
  featuredCategories: { title: "Category", fields: [["name", "Category name"], ["image", "Category image"]] },
  homeLandingSlides: { title: "Featured product", fields: [["title", "Product name"], ["designer", "Designer"], ["materials", "Materials"], ["client", "Client"], ["price", "Price"], ["image", "Product image"]] },
  homeBrands: { title: "Brand", fields: [["name", "Brand name"], ["image", "Logo image"]] }
};

function renderHomepageList(key, items = []) {
  const host = contentForm.querySelector(`[data-home-list="${key}"]`);
  if (!host) return;
  const config = homepageListConfig[key];
  host.replaceChildren();
  items.forEach((item, index) => {
    const card = document.createElement("section");
    card.className = "home-editor-item";
    const heading = document.createElement("h3"); heading.textContent = `${config.title} ${index + 1}`; card.append(heading);
    const grid = document.createElement("div"); grid.className = "home-editor-fields";
    config.fields.forEach(([field, label, type]) => {
      const wrapper = document.createElement("label"); wrapper.textContent = label;
      const input = document.createElement(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") input.type = "text";
      if (type === "textarea") input.rows = 2;
      input.dataset.field = field; input.value = item[field] || "";
      wrapper.append(input); grid.append(wrapper);
      if (field === "image") addImageUploadControl(input, label.toLowerCase(), (url) => { input.value = url; });
    });
    card.append(grid);
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "home-editor-remove"; remove.textContent = `Remove ${config.title.toLowerCase()}`;
    remove.addEventListener("click", () => renderHomepageList(key, readHomepageList(key).filter((_, itemIndex) => itemIndex !== index)));
    card.append(remove); host.append(card);
  });
  const maxItems = key === "heroSlides" || key === "homeLandingSlides" ? 3 : key === "featuredCategories" ? 12 : 24;
  if (items.length < maxItems) {
    const add = document.createElement("button"); add.type = "button"; add.className = "home-editor-add"; add.textContent = `+ Add ${config.title.toLowerCase()}`;
    add.addEventListener("click", () => renderHomepageList(key, [...readHomepageList(key), {}]));
    host.append(add);
  }
}

function readHomepageList(key) {
  return [...contentForm.querySelectorAll(`[data-home-list="${key}"] .home-editor-item`)].map((card) =>
    Object.fromEntries([...card.querySelectorAll("[data-field]")].map((input) => [input.dataset.field, input.value.trim()]))
  );
}

function normalizeCategoryTree(tree, categories = []) {
  const source = Array.isArray(tree) && tree.length ? tree : categories;
  function normalize(nodes, parentId, depth) {
    if (!Array.isArray(nodes) || depth > 2) return [];
    return nodes.flatMap((item, index) => {
      const name = typeof item === "string" ? item.trim() : typeof item?.name === "string" ? item.name.trim() : "";
      if (!name) return [];
      const id = typeof item === "object" && typeof item.id === "string" && item.id
        ? item.id
        : `${parentId}-${index + 1}`;
      return [{ id, name, children: normalize(typeof item === "object" ? item.children : [], id, depth + 1) }];
    });
  }
  return normalize(source, "category", 0);
}

function flattenCategoryTree(nodes = categoryTreeData, ancestors = [], indexPath = []) {
  return nodes.flatMap((node, index) => {
    const path = [...indexPath, index];
    const names = [...ancestors, node.name];
    return [
      { ...node, path: names.join(" > "), depth: ancestors.length, indexPath: path.join(".") },
      ...flattenCategoryTree(node.children || [], names, path)
    ];
  });
}

function getCategoryNode(indexPath) {
  let nodes = categoryTreeData;
  let node = null;
  for (const index of indexPath.split(".").map(Number)) {
    node = nodes[index];
    if (!node) return null;
    nodes = node.children || [];
  }
  return node;
}

function getCategorySiblings(indexPath) {
  const parts = indexPath ? indexPath.split(".").map(Number) : [];
  if (!parts.length) return categoryTreeData;
  let nodes = categoryTreeData;
  for (const index of parts.slice(0, -1)) {
    if (!nodes[index]) return [];
    nodes = nodes[index].children || [];
  }
  return nodes;
}

function categoryPathFor(indexPath) {
  const parts = indexPath.split(".").map(Number);
  let nodes = categoryTreeData;
  const names = [];
  for (const index of parts) {
    const node = nodes[index];
    if (!node) return "";
    names.push(node.name);
    nodes = node.children || [];
  }
  return names.join(" > ");
}

function categoryEntriesForSubtree(node, ancestors = []) {
  const path = [...ancestors, node.name].join(" > ");
  return [
    { id: node.id, path },
    ...(node.children || []).flatMap((child) => categoryEntriesForSubtree(child, [...ancestors, node.name]))
  ];
}

function renderCategoryRows(nodes = categoryTreeData, ancestors = [], indexPath = []) {
  return `<ul class="category-tree-list">${nodes.map((node, index) => {
    const currentPath = [...indexPath, index];
    const pathKey = currentPath.join(".");
    const fullPath = [...ancestors, node.name].join(" > ");
    const subtree = categoryEntriesForSubtree(node, ancestors);
    const productCount = products.filter((product) =>
      subtree.some((entry) => product.categoryId === entry.id || product.category === entry.path || product.category.startsWith(`${entry.path} > `))
    ).length;
    const children = (node.children || []).length
      ? renderCategoryRows(node.children, [...ancestors, node.name], currentPath)
      : "";
    return `<li class="category-tree-item" role="treeitem" aria-level="${ancestors.length + 1}">
      <div class="category-tree-row">
        <span class="category-level-badge">${["Main", "Sub", "Child"][ancestors.length]}</span>
        <strong title="${escapeHtml(fullPath)}">${escapeHtml(node.name)}</strong>
        <small>${productCount} products</small>
        <div class="category-row-actions">
          ${ancestors.length < 2 ? `<button type="button" data-category-add="${pathKey}">＋ Add child</button>` : ""}
          <button type="button" data-category-edit="${pathKey}">Edit</button>
          <button type="button" class="category-remove" data-category-delete="${pathKey}">Remove</button>
        </div>
      </div>
      ${children}
    </li>`;
  }).join("")}</ul>`;
}

function updateCategoryParentOptions(selectedPath = "") {
  const select = categoryForm.elements.categoryParent;
  const options = [{ path: "", label: "Main category" }, ...flattenCategoryTree().filter((entry) => entry.depth < 2).map((entry) => ({
    path: entry.indexPath,
    label: `${"— ".repeat(entry.depth + 1)}${entry.name}`
  }))];
  select.replaceChildren(...options.map(({ path, label }) => {
    const option = document.createElement("option");
    option.value = path;
    option.textContent = label;
    return option;
  }));
  select.value = selectedPath;
  select.disabled = Boolean(editingCategoryPath);
}

function renderCategoryManager() {
  const count = flattenCategoryTree().length;
  document.querySelector("#category-count").textContent = `${count} ${count === 1 ? "category" : "categories"}`;
  categoryList.innerHTML = renderCategoryRows();
  updateCategoryParentOptions(editingCategoryPath ? editingCategoryPath.split(".").slice(0, -1).join(".") : categoryForm.elements.categoryParent.value);
}

function setProductCategoryOptions(currentId = "") {
  const select = form.elements.categoryId;
  const current = select.value;
  const entries = flattenCategoryTree();
  select.replaceChildren(...entries.map((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.path;
    return option;
  }));
  const selected = currentId || current;
  if (selected && entries.some((entry) => entry.id === selected)) select.value = selected;
  else if (entries.length) select.value = entries[0].id;
}

function resetCategoryForm() {
  editingCategoryPath = "";
  categoryForm.reset();
  document.querySelector("#category-form-kicker").textContent = "NEW CATEGORY";
  document.querySelector("#category-form-heading").textContent = "Add a category";
  document.querySelector("#category-save").textContent = "Add category";
  document.querySelector("#category-cancel").hidden = true;
  updateCategoryParentOptions();
}

function createCategoryId() {
  const suffix = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `category-${suffix}`;
}

async function saveCategoryTree(previousTree) {
  try {
    site = await request("/admin/site", {
      method: "PUT",
      body: JSON.stringify({
        ...site,
        categories: categoryTreeData.map((category) => category.name),
        categoryTree: categoryTreeData
      })
    });
    categoryTreeData = normalizeCategoryTree(site.categoryTree, site.categories || []);
    setProductCategoryOptions();
    products = products.map((product) => {
      const category = flattenCategoryTree().find((entry) => entry.id === product.categoryId || entry.path === product.category);
      return category ? { ...product, category: category.path, categoryId: category.id } : product;
    });
    renderProducts();
    renderCategoryManager();
    return true;
  } catch (error) {
    categoryTreeData = previousTree;
    renderCategoryManager();
    throw error;
  }
}

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const isEditing = Boolean(editingCategoryPath);
  const name = categoryForm.elements.categoryName.value.trim();
  const parentPath = categoryForm.elements.categoryParent.value;
  const submitButton = document.querySelector("#category-save");
  if (!name || name.length > 60 || name.includes(">")) {
    showNotice("Enter a category name (1–60 characters) without the > character.", true);
    return;
  }

  const previousTree = JSON.parse(JSON.stringify(categoryTreeData));
  const siblings = editingCategoryPath ? getCategorySiblings(editingCategoryPath) : (() => {
    if (!parentPath) return categoryTreeData;
    const parent = getCategoryNode(parentPath);
    return parent ? (parent.children ||= []) : [];
  })();
  const currentIndex = editingCategoryPath ? Number(editingCategoryPath.split(".").pop()) : -1;
  if (siblings.some((category, index) => index !== currentIndex && category.name.toLowerCase() === name.toLowerCase())) {
    showNotice("Category names must be unique under the same parent.", true);
    return;
  }

  if (editingCategoryPath) {
    const category = getCategoryNode(editingCategoryPath);
    if (!category) {
      showNotice("That category is no longer available. Refresh and try again.", true);
      return;
    }
    category.name = name;
  } else {
    const parent = parentPath ? getCategoryNode(parentPath) : null;
    if (parentPath && !parent) {
      showNotice("Choose a valid parent category.", true);
      return;
    }
    if (parent && flattenCategoryTree().find((entry) => entry.indexPath === parentPath)?.depth >= 2) {
      showNotice("Categories can have up to three levels.", true);
      return;
    }
    siblings.push({ id: createCategoryId(), name, children: [] });
  }

  submitButton.disabled = true;
  try {
    await saveCategoryTree(previousTree);
    resetCategoryForm();
    showNotice(`Category ${isEditing ? "updated" : "added"}.`);
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector("#category-cancel").addEventListener("click", () => {
  resetCategoryForm();
  renderCategoryManager();
});

categoryList.addEventListener("click", async (event) => {
  const addButton = event.target.closest("[data-category-add]");
  const editButton = event.target.closest("[data-category-edit]");
  const deleteButton = event.target.closest("[data-category-delete]");

  if (addButton) {
    resetCategoryForm();
    categoryForm.elements.categoryParent.value = addButton.dataset.categoryAdd;
    document.querySelector("#category-name").focus();
    return;
  }
  if (editButton) {
    const category = getCategoryNode(editButton.dataset.categoryEdit);
    if (!category) return;
    editingCategoryPath = editButton.dataset.categoryEdit;
    categoryForm.elements.categoryName.value = category.name;
    document.querySelector("#category-form-kicker").textContent = "EDIT CATEGORY";
    document.querySelector("#category-form-heading").textContent = "Update category";
    document.querySelector("#category-save").textContent = "Save changes";
    document.querySelector("#category-cancel").hidden = false;
    updateCategoryParentOptions(editingCategoryPath.split(".").slice(0, -1).join("."));
    document.querySelector("#category-name").focus();
    return;
  }
  if (!deleteButton) return;

  const path = deleteButton.dataset.categoryDelete;
  const category = getCategoryNode(path);
  if (!category) return;
  const entries = categoryEntriesForSubtree(category, categoryPathFor(path).split(" > ").slice(0, -1));
  const usedProducts = products.filter((product) => entries.some((entry) =>
    product.categoryId === entry.id || product.category === entry.path || product.category.startsWith(`${entry.path} > `)
  ));
  if (usedProducts.length) {
    showNotice(`Reassign ${usedProducts.length} product${usedProducts.length === 1 ? "" : "s"} before removing this category.`, true);
    return;
  }
  if (!path.includes(".") && categoryTreeData.length === 1) {
    showNotice("Keep at least one main category in the store.", true);
    return;
  }
  const descendantCount = flattenCategoryTree(category.children || []).length;
  const prompt = descendantCount
    ? `Remove "${category.name}" and its ${descendantCount} subcategor${descendantCount === 1 ? "y" : "ies"}?`
    : `Remove "${category.name}"?`;
  if (!window.confirm(prompt)) return;

  const previousTree = JSON.parse(JSON.stringify(categoryTreeData));
  getCategorySiblings(path).splice(Number(path.split(".").pop()), 1);
  try {
    await saveCategoryTree(previousTree);
    resetCategoryForm();
    showNotice("Category removed.");
  } catch (error) {
    showNotice(error.message, true);
  }
});

async function showDashboard(account) {
  if (account?.email) adminEmail = account.email;
  loginView.hidden = true;
  adminView.hidden = false;
  try {
    const [summary, loadedSite, loadedSettings] = await Promise.all([request("/admin/summary"), request("/admin/site"), request("/admin/settings")]);
    site = loadedSite;
    fillSettingsForm(loadedSettings);
    document.querySelector("#stat-products").textContent = summary.products;
    document.querySelector("#stat-inquiries").textContent = summary.inquiries;
    document.querySelector("#stat-new").textContent = summary.newInquiries;
    document.querySelector("#inquiry-badge").textContent = summary.newInquiries;
    document.querySelector("#admin-avatar").textContent = (adminEmail || "A").slice(0, 1).toUpperCase();
    document.querySelector("#admin-avatar").title = adminEmail;
    fillContentForm(site);
    categoryTreeData = normalizeCategoryTree(site.categoryTree, site.categories || []);
    setProductCategoryOptions();
    renderCategoryManager();
    await Promise.all([loadProducts(), loadInquiries(), loadAdminOrders(), loadAdminReviews(), loadReport()]);
  } catch (error) {
    if (error.message.includes("session") || error.message.includes("sign in")) {
      adminView.hidden = true;
      loginView.hidden = false;
    } else showNotice(error.message, true);
  }
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const loginForm = event.currentTarget;
  const button = loginForm.querySelector("button");
  const message = document.querySelector("#login-message");
  button.disabled = true;
  message.textContent = "";
  try {
    const data = Object.fromEntries(new FormData(loginForm));
    const account = await request("/admin/login", { method: "POST", body: JSON.stringify(data) });
    adminEmail = account.email;
    sessionStorage.setItem("homeShapeAdminToken", account.token);
    loginForm.reset();
    await showDashboard();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    await request("/admin/logout", { method: "POST" });
    sessionStorage.removeItem("homeShapeAdminToken");
    adminView.hidden = true;
    loginView.hidden = false;
  } catch (error) { showNotice(error.message, true); }
});

function switchSection(name) {
  document.querySelectorAll(".admin-section").forEach((section) => section.classList.toggle("active", section.id === `section-${name}`));
  document.querySelectorAll(".admin-nav [data-section]").forEach((button) => button.classList.toggle("active", button.dataset.section === name));
  document.querySelector("#page-heading").textContent = { overview: "Overview", products: "Products", orders: "Orders", reviews: "Product reviews", reports: "Reports & ledger", content: "Site content", inquiries: "Enquiries", settings: "Store settings" }[name];
  document.querySelector("#admin-sidebar").classList.remove("open");
}

async function loadAdminOrders() {
  const host = document.querySelector("#admin-orders-list");
  if (!host) return;
  try {
    const orders = await request("/admin/orders");
    host.replaceChildren();
    if (!orders.length) { const empty = document.createElement("article"); empty.className = "panel-card admin-order-empty"; empty.textContent = "No customer orders yet."; host.append(empty); return; }
    orders.forEach((order) => {
      const card = document.createElement("article"); card.className = "panel-card admin-order-card";
      const header = document.createElement("header"); header.className = "admin-order-header";
      const title = document.createElement("div"); const number = document.createElement("strong"); number.textContent = `Order ${order.number}`; const meta = document.createElement("small"); meta.textContent = `${order.customer?.fullName || order.customer?.username || "Customer"} · ${order.customer?.email || ""} · ${new Date(order.createdAt).toLocaleString()}`; title.append(number, meta);
      const status = document.createElement("select"); status.setAttribute("aria-label", `Status for ${order.number}`);
      ["processing", "shipped", "delivered", "cancelled"].forEach((value) => { const option = document.createElement("option"); option.value = value; option.textContent = value[0].toUpperCase() + value.slice(1); status.append(option); }); status.value = order.status;
      status.addEventListener("change", async () => { status.disabled = true; try { await request(`/admin/orders/${encodeURIComponent(order._id)}`, { method: "PATCH", body: JSON.stringify({ status: status.value }) }); showNotice(`Order ${order.number} updated.`); } catch (error) { status.value = order.status; showNotice(error.message, true); } finally { status.disabled = false; } });
      header.append(title, status); card.append(header);
      const address = order.shippingAddress || {}; const addressLine = document.createElement("p"); addressLine.className = "admin-order-address"; addressLine.textContent = `Deliver to: ${address.fullName || ""}, ${address.phone || ""}, ${address.street || ""}, ${address.city || ""}${address.region ? `, ${address.region}` : ""}, ${address.country || ""}`; card.append(addressLine);
      const lines = document.createElement("div"); lines.className = "admin-order-items";
      (order.items || []).forEach((item) => { const line = document.createElement("p"); line.textContent = `${item.name} × ${item.quantity} — د.إ ${(item.price * item.quantity).toFixed(2)}`; lines.append(line); });
      const total = document.createElement("strong"); total.className = "admin-order-total"; total.textContent = `Total: د.إ ${Number(order.total).toFixed(2)} · Cash on delivery`; card.append(lines, total); host.append(card);
    });
  } catch (error) { showNotice(error.message, true); }
}

async function loadAdminReviews() {
  const host = document.querySelector("#admin-reviews-list"); if (!host) return;
  try {
    const reviews = await request("/admin/reviews"); host.replaceChildren();
    if (!reviews.length) { const empty = document.createElement("article"); empty.className = "panel-card admin-review-empty"; empty.textContent = "No reviews have been submitted yet."; host.append(empty); return; }
    reviews.forEach((review) => {
      const card = document.createElement("article"); card.className = "panel-card admin-review-card";
      const header = document.createElement("header"); const info = document.createElement("div"); const product = document.createElement("strong"); product.textContent = review.productName; const customer = document.createElement("small"); customer.textContent = `${review.customerName} · ${review.customerEmail} · ${new Date(review.createdAt).toLocaleString()}`; info.append(product, customer);
      const rating = document.createElement("span"); rating.className = "admin-review-stars"; rating.textContent = `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`; header.append(info, rating); card.append(header);
      const verified = document.createElement("span"); verified.className = "admin-review-verified"; verified.textContent = review.verifiedPurchase ? "Verified purchase" : "Customer review"; card.append(verified);
      const comment = document.createElement("p"); comment.className = "admin-review-comment"; comment.textContent = review.comment; card.append(comment);
      const form = document.createElement("form"); form.className = "admin-review-reply";
      const statusLabel = document.createElement("label"); statusLabel.textContent = "Review status"; const status = document.createElement("select");
      [["pending", "Pending approval"], ["approved", "Approved and visible"], ["rejected", "Rejected"]].forEach(([value, label]) => { const option = document.createElement("option"); option.value = value; option.textContent = label; status.append(option); }); status.value = review.status; statusLabel.append(status);
      const nameLabel = document.createElement("label"); nameLabel.textContent = "Reply display name"; const name = document.createElement("input"); name.maxLength = 80; name.value = review.reply?.displayName || "Home Shape"; nameLabel.append(name);
      const replyLabel = document.createElement("label"); replyLabel.textContent = "Admin reply"; const reply = document.createElement("textarea"); reply.rows = 3; reply.maxLength = 3000; reply.placeholder = "Write a public response (optional)"; reply.value = review.reply?.comment || ""; replyLabel.append(reply);
      const save = document.createElement("button"); save.type = "submit"; save.className = "button button-dark"; save.textContent = "Save status & reply";
      const feedback = document.createElement("p"); feedback.className = "admin-review-feedback";
      form.append(statusLabel, nameLabel, replyLabel, save, feedback);
      form.addEventListener("submit", async (event) => { event.preventDefault(); save.disabled = true; feedback.textContent = ""; try { await request(`/admin/reviews/${encodeURIComponent(review._id)}`, { method: "PATCH", body: JSON.stringify({ status: status.value, displayName: name.value, reply: reply.value }) }); showNotice("Review moderation and reply saved."); await loadAdminReviews(); } catch (error) { feedback.textContent = error.message; } finally { save.disabled = false; } });
      card.append(form); host.append(card);
    });
  } catch (error) { showNotice(error.message, true); }
}

const reportDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
function setReportRange(range) {
  const now = new Date(); const from = new Date(now); const to = new Date(now);
  if (range === "week") from.setDate(from.getDate() - 6);
  if (range === "month") from.setDate(1);
  if (range === "custom") return;
  document.querySelector("#report-from").value = reportDate(from);
  document.querySelector("#report-to").value = reportDate(to);
}
function renderReportChart(ledger, interval) {
  const host = document.querySelector("#report-chart"); host.replaceChildren();
  const buckets = new Map();
  ledger.filter((row) => row.type === "income" || row.type === "expense").forEach((row) => {
    const date = new Date(row.date); let key;
    if (interval === "month") key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    else if (interval === "week") { const monday = new Date(date); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); key = reportDate(monday); }
    else key = reportDate(date);
    if (!buckets.has(key)) buckets.set(key, { income: 0, expense: 0 });
    const bucket = buckets.get(key); bucket[row.type] += Number(row.amount);
  });
  const rows = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-18);
  if (!rows.length) { host.textContent = "No transactions in this date range."; return; }
  const max = Math.max(1, ...rows.flatMap(([, value]) => [value.income, value.expense]));
  const width = Math.max(560, rows.length * 66), height = 250, base = 205, chartHeight = 170, barWidth = Math.min(18, 26 / Math.max(1, rows.length / 8));
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", `0 0 ${width} ${height}`); svg.setAttribute("role", "presentation");
  [0, .5, 1].forEach((fraction) => { const y = base - chartHeight * fraction; const line = document.createElementNS(svg.namespaceURI, "line"); line.setAttribute("x1", "40"); line.setAttribute("x2", String(width - 8)); line.setAttribute("y1", String(y)); line.setAttribute("y2", String(y)); line.setAttribute("class", "chart-grid-line"); svg.append(line); });
  rows.forEach(([key, value], index) => {
    const center = 48 + index * ((width - 60) / rows.length);
    [["income", "chart-income-bar", -barWidth], ["expense", "chart-expense-bar", 2]].forEach(([type, className, offset]) => {
      const bar = document.createElementNS(svg.namespaceURI, "rect"); const barHeight = Math.max(1, (value[type] / max) * chartHeight); bar.setAttribute("x", String(center + offset)); bar.setAttribute("y", String(base - barHeight)); bar.setAttribute("width", String(barWidth)); bar.setAttribute("height", String(barHeight)); bar.setAttribute("rx", "3"); bar.setAttribute("class", className); bar.dataset.value = `${type}: AED ${value[type].toFixed(2)}`; svg.append(bar);
    });
    const label = document.createElementNS(svg.namespaceURI, "text"); label.setAttribute("x", String(center)); label.setAttribute("y", "229"); label.setAttribute("text-anchor", "middle"); label.setAttribute("class", "chart-date-label"); label.textContent = interval === "month" ? key : key.slice(5); svg.append(label);
  });
  host.append(svg);
}
function renderReportLedger(rows) {
  const host = document.querySelector("#report-ledger"); host.replaceChildren();
  if (!rows.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "No orders or expenses in this date range."; host.append(empty); return; }
  rows.forEach((entry) => {
    const row = document.createElement("article"); row.className = `ledger-row ${entry.type}`;
    const detail = document.createElement("div"); detail.className = "ledger-row-detail";
    const title = document.createElement("strong"); title.textContent = entry.description;
    const meta = document.createElement("small"); meta.textContent = `${entry.category} · ${new Date(entry.date).toLocaleDateString()}${entry.address ? ` · ${entry.address.city}, ${entry.address.country}` : ""}`;
    detail.append(title, meta);
    if (entry.items?.length) { const items = document.createElement("small"); items.textContent = entry.items.map((item) => `${item.name} × ${item.quantity}`).join(" · "); detail.append(items); }
    const amount = document.createElement("strong"); amount.className = "ledger-amount"; amount.textContent = `${entry.type === "expense" ? "−" : entry.type === "income" ? "+" : "Pending · "}AED ${Number(entry.amount).toFixed(2)}`;
    row.append(detail, amount);
    if (entry.type === "expense") { const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Delete"; remove.setAttribute("aria-label", `Delete expense ${entry.description}`); remove.addEventListener("click", async () => { try { await request(`/admin/expenses/${encodeURIComponent(entry.id)}`, { method: "DELETE" }); await loadReport(); } catch (error) { showReportMessage(error.message, true); } }); row.append(remove); }
    host.append(row);
  });
}
function showReportMessage(message, error = false) { const node = document.querySelector("#report-message"); node.textContent = message; node.classList.toggle("error", error); }
async function loadReport() {
  const fromField = document.querySelector("#report-from"), toField = document.querySelector("#report-to");
  if (!fromField || !toField) return;
  if (!fromField.value || !toField.value) setReportRange("month");
  try {
    const query = new URLSearchParams({ from: fromField.value, to: toField.value });
    const report = await request(`/admin/reports?${query}`);
    [["income", report.income], ["expenses", report.expenses], ["profit", report.profit], ["pending", report.pendingSales]].forEach(([key, value]) => { document.querySelector(`#report-${key}`).textContent = `AED ${Number(value).toFixed(2)}`; });
    renderReportChart(report.ledger, document.querySelector("#report-group").value); renderReportLedger(report.ledger);
    document.querySelector("#report-print-area").dataset.range = `${fromField.value} to ${toField.value}`;
    document.querySelector("#report-print-range").textContent = `${fromField.value} through ${toField.value} · Prepared ${new Date().toLocaleDateString()}`;
  } catch (error) { showReportMessage(error.message, true); }
}
document.querySelectorAll("[data-report-range]").forEach((button) => button.addEventListener("click", () => { setReportRange(button.dataset.reportRange); if (button.dataset.reportRange !== "custom") loadReport(); }));
document.querySelector("#report-refresh").addEventListener("click", loadReport);
document.querySelector("#report-group").addEventListener("change", loadReport);
document.querySelector("#report-pdf").addEventListener("click", () => window.print());
document.querySelector("#expense-form").elements.date.value = reportDate(new Date());
document.querySelector("#expense-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button[type=submit]"); button.disabled = true;
  try { await request("/admin/expenses", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) }); form.reset(); form.elements.date.value = reportDate(new Date()); showReportMessage("Expense recorded."); await loadReport(); }
  catch (error) { showReportMessage(error.message, true); }
  finally { button.disabled = false; }
});

const paymentProviderNames = { stripe: "Stripe", paypal: "PayPal", sslcommerz: "SSLCommerz", razorpay: "Razorpay", googlePay: "Google Pay", uddoktaPay: "UddoktaPay", shurjoPay: "shurjoPay" };
const courierProviderNames = { pathao: "Pathao", steadfast: "Steadfast", redx: "RedX", amazonShipping: "Amazon Shipping" };
const courierProviderConfigs = {
  pathao: { description: "Pathao uses Client ID/Secret and your merchant login to get an OAuth token. Parcel creation also needs a pickup Store ID.", docs: "https://merchant.pathao.com/", required: ["clientId", "clientSecret", "username", "password", "storeId"], fields: [{ key: "clientId", label: "Client ID", secret: false }, { key: "clientSecret", label: "Client secret", secret: true }, { key: "username", label: "Merchant login email", secret: false }, { key: "password", label: "Merchant login password", secret: true }, { key: "storeId", label: "Pickup store ID", secret: false }, { key: "mode", label: "Environment", type: "select", options: [["sandbox", "Sandbox"], ["live", "Live"]] }] },
  steadfast: { description: "Steadfast authenticates API requests with an API key and Secret key from your merchant dashboard. Confirm sandbox access with Steadfast.", docs: "https://portal.packzy.com/", required: ["apiKey", "secretKey"], fields: [{ key: "apiKey", label: "API key", secret: false }, { key: "secretKey", label: "Secret key", secret: true }] },
  redx: { description: "REDX uses a merchant access token. Parcel booking needs the pickup store ID (not the shop ID). A sandbox API is available.", docs: "https://redx.com.bd/developer-api/", required: ["accessToken", "pickupStoreId"], fields: [{ key: "accessToken", label: "API access token", secret: true }, { key: "pickupStoreId", label: "Pickup store ID", secret: false }, { key: "mode", label: "Environment", type: "select", options: [["sandbox", "Sandbox"], ["live", "Live"]] }] },
  amazonShipping: { description: "Amazon Shipping requires approved API access and seller authorization through Login with Amazon. Direct integration availability is limited to supported regions including the US, EU, and India.", docs: "https://developer-docs.shipping.amazon.com/apis/docs/off-amazon-guide", required: ["lwaClientId", "lwaClientSecret", "refreshToken", "applicationId"], fields: [{ key: "lwaClientId", label: "LWA client ID", secret: false }, { key: "lwaClientSecret", label: "LWA client secret", secret: true }, { key: "refreshToken", label: "Seller authorization refresh token", secret: true }, { key: "applicationId", label: "Shipping API application ID", secret: false }, { key: "region", label: "Region", type: "select", options: [["na", "North America"], ["eu", "Europe"], ["in", "India"]] }, { key: "mode", label: "Environment", type: "select", options: [["sandbox", "Sandbox"], ["live", "Live"]] }] }
};
const paymentProviderConfigs = {
  stripe: { description: "Server-side Checkout Sessions; the webhook secret verifies payment events.", docs: "https://docs.stripe.com/checkout/quickstart", required: ["secretKey", "webhookSecret"], fields: [{ key: "secretKey", label: "Secret API key", secret: true }, { key: "publishableKey", label: "Publishable key", secret: false }, { key: "webhookSecret", label: "Webhook signing secret", secret: true }, { key: "mode", label: "Environment", type: "select", options: [["test", "Test mode"], ["live", "Live mode"]] }] },
  paypal: { description: "PayPal uses an app client ID and secret for OAuth, plus server-created and captured Orders.", docs: "https://developer.paypal.com/studio/checkout/standard/integrate", required: ["clientId", "clientSecret"], fields: [{ key: "clientId", label: "Client ID", secret: false }, { key: "clientSecret", label: "Client secret", secret: true }, { key: "webhookId", label: "Webhook ID", secret: false }, { key: "mode", label: "Environment", type: "select", options: [["sandbox", "Sandbox"], ["live", "Live"]] }] },
  sslcommerz: { description: "Hosted checkout needs your Store ID and Store Password; callbacks must be validated server-side.", docs: "https://developer.sslcommerz.com/doc/v4/", required: ["storeId", "storePassword"], fields: [{ key: "storeId", label: "Store ID", secret: false }, { key: "storePassword", label: "Store Password", secret: true }, { key: "mode", label: "Environment", type: "select", options: [["sandbox", "Sandbox"], ["live", "Live"]] }] },
  razorpay: { description: "Create the Razorpay order on the server, verify checkout signatures, and validate signed webhooks.", docs: "https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/", required: ["keyId", "keySecret", "webhookSecret"], fields: [{ key: "keyId", label: "Key ID", secret: false }, { key: "keySecret", label: "Key Secret", secret: true }, { key: "webhookSecret", label: "Webhook secret", secret: true }, { key: "mode", label: "Environment", type: "select", options: [["test", "Test mode"], ["live", "Live mode"]] }] },
  googlePay: { description: "Google Pay is a wallet tokenization option through a supported processor; it cannot process payments by itself.", docs: "https://developers.google.com/pay/api/web/guides/paymentrequest/tutorial", required: ["merchantId", "gateway", "gatewayMerchantId"], fields: [{ key: "merchantId", label: "Google merchant ID", secret: false }, { key: "gateway", label: "Payment gateway name", secret: false }, { key: "gatewayMerchantId", label: "Gateway merchant ID", secret: false }, { key: "mode", label: "Environment", type: "select", options: [["test", "Test mode"], ["production", "Production"]] }] },
  uddoktaPay: { description: "UddoktaPay needs an API key and your UddoktaPay installation URL; checkout and verification are separate API steps.", docs: "https://docs.uddoktapay.com/brand-settings/api", required: ["baseUrl", "apiKey"], fields: [{ key: "baseUrl", label: "UddoktaPay base URL", secret: false, placeholder: "https://pay.your-domain.com" }, { key: "apiKey", label: "API key", secret: true }] },
  shurjoPay: { description: "shurjoPay authenticates with store username and password, then requires payment initiation and transaction verification.", docs: "https://web2.shurjopay.com.bd/frontend-developers/direct-integration-with-api", required: ["username", "password", "prefix"], fields: [{ key: "username", label: "Store username", secret: false }, { key: "password", label: "Store password", secret: true }, { key: "prefix", label: "Store prefix", secret: false }, { key: "mode", label: "Environment", type: "select", options: [["sandbox", "Sandbox"], ["live", "Live"]] }] }
};
function renderProviderSettings(listId, providerNames, providers) {
  const host = document.querySelector(`#${listId}`);
  host.replaceChildren();
  Object.entries(providerNames).forEach(([key, label]) => {
    const card = document.createElement("div"); card.className = "integration-row"; card.dataset.provider = key;
    card.dataset.credentialsConfigured = String(Boolean(providers[key]?.credentialsConfigured));
    const top = document.createElement("div"); top.className = "integration-row-top";
    const title = document.createElement("strong"); title.textContent = label;
    const status = document.createElement("span"); status.className = `integration-status${providers[key]?.credentialsConfigured ? " configured" : ""}`; status.textContent = providers[key]?.credentialsConfigured ? "Credentials saved" : "Needs credentials";
    const toggleLabel = document.createElement("label"); toggleLabel.className = "settings-switch";
    const toggle = document.createElement("input"); toggle.type = "checkbox"; toggle.dataset.settingEnabled = ""; toggle.checked = Boolean(providers[key]?.enabled);
    const toggleText = document.createElement("span"); toggleText.textContent = "Enabled"; toggleLabel.append(toggle, toggleText);
    top.append(title, status, toggleLabel);
    const config = listId === "payment-settings-list" ? paymentProviderConfigs[key] : listId === "courier-settings-list" ? courierProviderConfigs[key] : null;
    if (config) {
      const details = document.createElement("p"); details.className = "integration-description"; details.textContent = config.description;
      const docs = document.createElement("a"); docs.className = "integration-docs"; docs.href = config.docs; docs.target = "_blank"; docs.rel = "noopener noreferrer"; docs.textContent = `Open ${label} integration docs ↗`;
      const fields = document.createElement("div"); fields.className = "integration-provider-fields";
      config.fields.forEach((field) => {
        const fieldLabel = document.createElement("label"); fieldLabel.className = "integration-credential"; fieldLabel.textContent = field.label;
        const input = field.type === "select" ? document.createElement("select") : document.createElement("input");
        if (field.type === "select") field.options.forEach(([value, text]) => { const option = document.createElement("option"); option.value = value; option.textContent = text; input.append(option); });
        else { input.type = field.secret ? "password" : "text"; input.autocomplete = "off"; input.placeholder = field.placeholder || (providers[key]?.credentialsConfigured ? "Saved securely; enter a new value to replace." : "Enter provider value"); }
        input.dataset.providerField = field.key;
        fieldLabel.append(input); fields.append(fieldLabel);
      });
      card.append(top, details, fields, docs);
    } else {
      const secretLabel = document.createElement("label"); secretLabel.className = "integration-credential"; secretLabel.textContent = "API credentials";
      const secret = document.createElement("input"); secret.type = "password"; secret.autocomplete = "new-password"; secret.dataset.settingCredentials = "";
      secret.placeholder = providers[key]?.credentialsConfigured ? "Saved securely. Enter a new value to replace." : "Paste provider credentials";
      secretLabel.append(secret); card.append(top, secretLabel);
    }
    host.append(card);
  });
}

function fillSettingsForm(settings) {
  const form = document.querySelector("#settings-form");
  if (!form || !settings) return;
  const fields = form.elements;
  Object.entries({
    brandText: settings.branding?.brandText, logoMode: settings.branding?.logoMode,
    logoImage: settings.branding?.logoImage, faviconImage: settings.branding?.faviconImage,
    seoTitle: settings.seo?.title, seoDescription: settings.seo?.description, seoKeywords: settings.seo?.keywords,
    canonicalUrl: settings.seo?.canonicalUrl, seoRobots: settings.seo?.robots, seoOgImage: settings.seo?.ogImage, googleSiteVerification: settings.seo?.googleSiteVerification,
    googleAnalyticsId: settings.seo?.googleAnalyticsId, metaPixelId: settings.seo?.metaPixelId,
    smtpHost: settings.smtp?.host, smtpPort: settings.smtp?.port, smtpUser: settings.smtp?.user,
    smtpFromName: settings.smtp?.fromName, smtpFromEmail: settings.smtp?.fromEmail
  }).forEach(([key, value]) => { if (fields[key]) fields[key].value = value ?? ""; });
  fields.smtpEnabled.checked = Boolean(settings.smtp?.enabled);
  fields.smtpSecure.checked = Boolean(settings.smtp?.secure);
  fields.activationEnabled.checked = Boolean(settings.smtp?.activationEnabled);
  fields.cashOnDelivery.checked = settings.payments?.cashOnDelivery !== false;
  fields.onlineEnabled.checked = Boolean(settings.payments?.onlineEnabled);
  fields.manualShipping.checked = settings.shipping?.manual !== false;
  document.querySelector("#smtp-status").textContent = settings.smtp?.passwordConfigured ? "SMTP password is saved securely." : "SMTP password has not been saved.";
  renderProviderSettings("payment-settings-list", paymentProviderNames, settings.payments?.providers || {});
  renderProviderSettings("courier-settings-list", courierProviderNames, settings.shipping?.providers || {});
  renderBrandingPreview();
}

function renderBrandingPreview() {
  const fields = document.querySelector("#settings-form")?.elements;
  const preview = document.querySelector("#branding-preview");
  if (!fields || !preview) return;
  preview.replaceChildren();
  const mode = fields.logoMode.value;
  const imageUrl = fields.logoImage.value.trim();
  if ((mode === "icon" || mode === "icon-text") && imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "";
    preview.append(image);
  }
  if (mode !== "icon" || !imageUrl) {
    const text = document.createElement("strong");
    text.textContent = fields.brandText.value.trim() || "Home Shape";
    preview.append(text);
  }
  const label = document.createElement("span");
  label.textContent = "Storefront logo preview";
  preview.append(label);
}

const brandingFields = document.querySelector("#settings-form").elements;
addImageUploadControl(brandingFields.logoImage, "the storefront logo", (url) => {
  brandingFields.logoImage.value = url;
  renderBrandingPreview();
});
addImageUploadControl(brandingFields.faviconImage, "the storefront favicon", (url) => {
  brandingFields.faviconImage.value = url;
});
[brandingFields.brandText, brandingFields.logoMode, brandingFields.logoImage].forEach((field) => field.addEventListener("input", renderBrandingPreview));
brandingFields.logoMode.addEventListener("change", renderBrandingPreview);

function readProviderSettings(listId) {
  return Object.fromEntries([...document.querySelectorAll(`#${listId} .integration-row`)].map((row) => [row.dataset.provider, {
    enabled: row.querySelector("[data-setting-enabled]").checked,
    credentials: row.querySelector("[data-setting-credentials]")?.value.trim() || (() => {
      const fields = [...row.querySelectorAll("[data-provider-field]")];
      const values = Object.fromEntries(fields.map((field) => [field.dataset.providerField, field.value.trim()]));
      const config = listId === "payment-settings-list" ? paymentProviderConfigs[row.dataset.provider] : courierProviderConfigs[row.dataset.provider];
      const hasAnyValue = config?.fields.some((field) => field.type !== "select" && values[field.key]);
      const providerName = (listId === "payment-settings-list" ? paymentProviderNames : courierProviderNames)[row.dataset.provider];
      if (config && row.querySelector("[data-setting-enabled]").checked && row.dataset.credentialsConfigured !== "true" && !config.required.every((field) => values[field])) {
        throw new Error(`Enter the required ${providerName} setup fields before enabling it.`);
      }
      if (config && hasAnyValue && !config.required.every((field) => values[field])) throw new Error(`Complete all required ${providerName} fields before replacing its saved credentials.`);
      return hasAnyValue ? JSON.stringify(values) : "";
    })()
  }]));
}

document.querySelector("#settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const fields = event.currentTarget.elements;
  const button = event.currentTarget.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const settings = await request("/admin/settings", { method: "PUT", body: JSON.stringify({
      branding: { logoMode: fields.logoMode.value, logoImage: fields.logoImage.value, faviconImage: fields.faviconImage.value, brandText: fields.brandText.value },
      seo: { title: fields.seoTitle.value, description: fields.seoDescription.value, keywords: fields.seoKeywords.value, canonicalUrl: fields.canonicalUrl.value, robots: fields.seoRobots.value, ogImage: fields.seoOgImage.value, googleSiteVerification: fields.googleSiteVerification.value, googleAnalyticsId: fields.googleAnalyticsId.value, metaPixelId: fields.metaPixelId.value },
      smtp: { enabled: fields.smtpEnabled.checked, host: fields.smtpHost.value, port: Number(fields.smtpPort.value), secure: fields.smtpSecure.checked, user: fields.smtpUser.value, password: fields.smtpPassword.value, fromName: fields.smtpFromName.value, fromEmail: fields.smtpFromEmail.value, activationEnabled: fields.activationEnabled.checked },
      payments: { cashOnDelivery: fields.cashOnDelivery.checked, onlineEnabled: fields.onlineEnabled.checked, providers: readProviderSettings("payment-settings-list") },
      shipping: { manual: fields.manualShipping.checked, providers: readProviderSettings("courier-settings-list") }
    }) });
    fields.smtpPassword.value = "";
    fillSettingsForm(settings);
    showNotice("Store settings saved securely.");
  } catch (error) { showNotice(error.message, true); }
  finally { button.disabled = false; }
});

document.querySelector("#smtp-test").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const status = document.querySelector("#smtp-status");
  button.disabled = true; status.textContent = "Sending test email…";
  try {
    const result = await request("/admin/settings/test-email", { method: "POST", body: "{}" });
    status.textContent = result.message;
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});

document.querySelectorAll("[data-home-editor]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-home-editor]").forEach((item) => item.classList.toggle("active", item === button));
  document.querySelectorAll("[data-home-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.homePanel === button.dataset.homeEditor));
}));

document.querySelectorAll(".admin-nav [data-section], [data-go]").forEach((button) => button.addEventListener("click", () => switchSection(button.dataset.section || button.dataset.go)));
document.querySelector("#sidebar-toggle").addEventListener("click", () => document.querySelector("#admin-sidebar").classList.toggle("open"));

let productPage = 1;
function renderProducts(resetPage = false) {
  if (resetPage) productPage = 1;
  const query = document.querySelector("#product-search").value.trim().toLowerCase();
  const filter = document.querySelector("#product-filter").value;
  const shown = products.filter((product) => (filter === "all" || product.active === (filter === "active")) &&
    `${product.name} ${product.category} ${product.brand}`.toLowerCase().includes(query));
  const list = document.querySelector("#product-list");
  const pageSize = Number(document.querySelector("#product-page-size").value) || 8;
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  productPage = Math.min(productPage, pageCount);
  const start = (productPage - 1) * pageSize;
  const pageProducts = shown.slice(start, start + pageSize);
  if (!shown.length) {
    list.innerHTML = '<div class="empty-state">No matching products yet. Add a product to get started.</div>';
    renderProductPagination(shown.length, start, pageSize, pageCount);
    return;
  }
  list.innerHTML = pageProducts.map((product) => `<button type="button" class="product-row${String(form.elements.id.value) === String(product.id) ? " selected" : ""}" data-product-id="${product.id}">
    <img src="${escapeHtml(product.image)}" alt="" /><span class="product-row-info"><strong>${escapeHtml(product.name)}</strong><small title="${escapeHtml(product.category)}">${escapeHtml(String(product.category || "").split(" > ").pop())} · ${escapeHtml(product.brand || "No brand")} · <span class="status-pill${product.active ? "" : " draft"}">${product.active ? "Live" : "Draft"}</span></small></span><strong class="product-price">د.إ ${Number(product.price).toFixed(2)}</strong>
  </button>`).join("");
  renderProductPagination(shown.length, start, pageSize, pageCount);
}

function renderProductPagination(total, start, pageSize, pageCount) {
  const pagination = document.querySelector("#product-pagination");
  const first = total ? start + 1 : 0;
  const last = Math.min(start + pageSize, total);
  let pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  if (pageCount > 5) {
    const firstPage = Math.max(1, Math.min(productPage - 2, pageCount - 4));
    pages = Array.from({ length: 5 }, (_, index) => firstPage + index);
  }
  const pageButtons = pages.map((page) => `<button type="button" class="product-page-button${page === productPage ? " active" : ""}" data-product-page="${page}" aria-label="Page ${page}" aria-current="${page === productPage ? "page" : "false"}">${page}</button>`).join("");
  pagination.innerHTML = `<span class="product-page-summary">Showing <strong>${first}–${last}</strong> of <strong>${total}</strong> products</span><div class="product-page-controls"><button type="button" class="product-page-arrow" data-product-page="${productPage - 1}" ${productPage <= 1 ? "disabled" : ""} aria-label="Previous page">‹ <span>Previous</span></button><div class="product-page-numbers">${productPage > 3 && pageCount > 5 ? '<span class="product-page-ellipsis">…</span>' : ""}${pageButtons}${productPage < pageCount - 2 && pageCount > 5 ? '<span class="product-page-ellipsis">…</span>' : ""}</div><button type="button" class="product-page-arrow" data-product-page="${productPage + 1}" ${productPage >= pageCount ? "disabled" : ""} aria-label="Next page"><span>Next</span> ›</button></div>`;
}

async function loadProducts() {
  products = await request("/admin/products");
  renderProducts();
  renderCategoryManager();
}

function resetProductForm() {
  form.reset();
  form.elements.id.value = "";
  form.elements.active.checked = true;
  document.querySelector("#product-form-title").textContent = "Add a product";
  document.querySelector("#product-form-kicker").textContent = "PRODUCT DETAILS";
  document.querySelector("#delete-product").hidden = true;
  document.querySelector("#cancel-product").hidden = true;
  renderProducts();
}

document.querySelector("#new-product").addEventListener("click", () => {
  resetProductForm();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.name.focus();
});
document.querySelector("#cancel-product").addEventListener("click", resetProductForm);
document.querySelector("#product-list").addEventListener("click", (event) => {
  const row = event.target.closest("[data-product-id]");
  if (!row) return;
  const product = products.find((item) => String(item.id) === row.dataset.productId);
  if (!product) return;
  form.elements.id.value = product.id;
  form.elements.name.value = product.name;
  const productCategory = flattenCategoryTree().find((category) =>
    category.id === product.categoryId || category.path === product.category
  );
  form.elements.categoryId.value = productCategory?.id || "";
  form.elements.brand.value = product.brand || "";
  form.elements.price.value = product.price;
  form.elements.oldPrice.value = product.oldPrice ?? "";
  form.elements.image.value = product.image;
  form.elements.hoverImage.value = product.hoverImage || "";
  form.elements.description.value = product.description || "";
  form.elements.detailHeading.value = product.detailHeading || "";
  form.elements.features.value = (product.features || []).join("\n");
  form.elements.detailDescription.value = product.detailDescription || "";
  form.elements.detailImageOne.value = product.detailImages?.[0] || "";
  form.elements.detailImageTwo.value = product.detailImages?.[1] || "";
  form.elements.colors.value = (product.colors || []).join(", ");
  form.elements.colorImages.value = (product.colorVariants || []).map((variant) => variant.image || "").join("\n");
  form.elements.collections.value = (product.collections || []).join(", ");
  form.elements.badge.value = product.badge || "";
  form.elements.active.checked = product.active;
  document.querySelector("#product-form-title").textContent = "Edit product";
  document.querySelector("#product-form-kicker").textContent = `PRODUCT #${product.id}`;
  document.querySelector("#delete-product").hidden = false;
  document.querySelector("#cancel-product").hidden = false;
  renderProducts();
});
document.querySelector("#product-search").addEventListener("input", () => renderProducts(true));
document.querySelector("#product-filter").addEventListener("change", () => renderProducts(true));
document.querySelector("#product-page-size").addEventListener("change", () => renderProducts(true));
document.querySelector("#product-pagination").addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-page]");
  if (!button || button.disabled) return;
  productPage = Number(button.dataset.productPage);
  renderProducts();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const id = data.id;
  const selectedCategory = flattenCategoryTree().find((category) => category.id === data.categoryId);
  if (!selectedCategory) {
    showNotice("Choose a valid product category.", true);
    return;
  }
  data.category = selectedCategory.path;
  data.price = Number(data.price);
  data.oldPrice = data.oldPrice === "" ? null : Number(data.oldPrice);
  data.active = form.elements.active.checked;
  const colorImages = data.colorImages.split("\n").map((value) => value.trim());
  data.colors = data.colors.split(",").map((value) => value.trim()).filter(Boolean);
  data.colorVariants = data.colors.map((color, index) => ({ color, image: colorImages[index] || "" }));
  delete data.colorImages;
  data.collections = data.collections.split(",").map((value) => value.trim()).filter(Boolean);
  data.features = data.features.split("\n").map((value) => value.trim()).filter(Boolean);
  data.detailImages = [data.detailImageOne, data.detailImageTwo].map((value) => value.trim());
  delete data.detailImageOne;
  delete data.detailImageTwo;
  delete data.id;
  try {
    const saved = await request(id ? `/admin/products/${id}` : "/admin/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(data)
    });
    showNotice(`${saved.name} ${id ? "updated" : "added"} successfully.`);
    await loadProducts();
    window.localStorage.setItem("home_shape_catalog_updated", String(Date.now()));
    resetProductForm();
  } catch (error) { showNotice(error.message, true); }
});

document.querySelector("#delete-product").addEventListener("click", async () => {
  const id = form.elements.id.value;
  if (!id || !window.confirm("Delete this product from the catalog?")) return;
  try {
    await request(`/admin/products/${id}`, { method: "DELETE" });
    showNotice("Product deleted.");
    await loadProducts();
    window.localStorage.setItem("home_shape_catalog_updated", String(Date.now()));
    resetProductForm();
  } catch (error) { showNotice(error.message, true); }
});

function fillContentForm(value) {
  const fields = contentForm.elements;
  fields.siteName.value = value.siteName || "";
  fields.announcement.value = value.announcement || "";
  fields.heroEyebrow.value = value.heroEyebrow || "";
  fields.heroPrice.value = value.heroPrice || "";
  fields.heroTitle.value = value.heroTitle || "";
  fields.heroEmphasis.value = value.heroEmphasis || "";
  fields.heroDescription.value = value.heroDescription || "";
  fields.heroImage.value = value.heroImage || "";
  renderHomepageList("heroSlides", value.heroSlides || []);
  renderHomepageList("featuredCategories", value.featuredCategories || []);
  renderHomepageList("homeLandingSlides", value.homeLandingSlides || []);
  renderHomepageList("homeBrands", value.homeBrands || []);
  fields.homeAboutImageAlt.value = value.homeAboutImageAlt || "Thoughtfully selected furniture for the home";
  fields.homeAboutReadUrl.value = value.homeAboutReadUrl || "index.html#story";
  fields.homeAboutContactUrl.value = value.homeAboutContactUrl || "pages.html?page=contact";
  ["homeCollectionKicker", "homeCollectionTitle", "homeCollectionDescription", "homeProductKicker", "homeProductsTitle", "homeProductsDescription", "homeAboutKicker", "homeAboutTitle", "homeAboutDescription", "homeAboutImage", "homeNewsletterTitle", "homeJournalKicker", "homeJournalTitle", "homeJournalDescription"].forEach((key) => {
    if (fields[key]) fields[key].value = value[key] || "";
  });
  const aboutDefaults = {
    title: "Well-coordinated teamwork speaks about us",
    introEyebrow: "SOME WORDS ABOUT US",
    intro: "We love what we do. Thoughtful design and a well-made home start with people who care.",
    heroBackgroundImage: "img/furniture-title-bg-opt.jpg.webp",
    body: "Home Shape brings together furniture with honest materials, enduring forms, and room for real life. We work with makers who care about the details, so the pieces you choose can stay with you for a long time.",
    features: [{ title: "We love what we do", description: "A small, thoughtful team brings care to every piece we select." }, { title: "Our working process", description: "We look closely at the materials, details, and everyday use behind each design." }],
    sectionEyebrow: "SEEMINGLY ELEGANT DESIGN", sectionTitle: "About our online store", sectionIntro: "We bring considered furniture and useful home pieces together in one welcoming place.",
    image: "img/furniture-title-bg-opt.jpg.webp", imageAlt: "A thoughtfully furnished living space",
    values: [{ title: "Thoughtful by nature", description: "We look for honest materials and forms that feel good to live with." }, { title: "Made with care", description: "We value skilled makers and the small details that make a piece last." }, { title: "Room for everyone", description: "Good design belongs in the everyday, wherever you call home." }],
    teamEyebrow: "WORDS ABOUT US", teamTitle: "Our team", teamIntro: "A small team, brought together by a shared love of thoughtful spaces.",
    team: [{ name: "Studio team", role: "Design & selection", image: "img/ref-furniture-04.webp" }, { name: "Product team", role: "Materials & makers", image: "img/ref-furniture-06.jpg" }, { name: "Store team", role: "Customer experience", image: "img/ref-furniture-09.jpg" }, { name: "Home Shape team", role: "A little bit of everything", image: "img/ref-furniture-11.jpg" }],
    stats: [{ value: "01", label: "Thoughtful collection" }, { value: "100%", label: "Selected with care" }, { value: "Everyday", label: "Made for real life" }],
    historyEyebrow: "A HOME SHAPE STORY", historyTitle: "Our company history and facts", historyBody: "Home Shape began with a simple idea: bring together useful, beautiful furniture made with care. We continue to seek out thoughtful materials, skilled makers, and timeless shapes that feel at home wherever life happens.",
    historyImage: "img/main-egg-chair.jpg.webp", galleryTitle: "Designed for the way you live", gallery: ["img/ref-furniture-01.webp", "img/ref-furniture-03.webp", "img/ref-furniture-05.jpg", "img/ref-furniture-08.webp", "img/ref-furniture-10.webp", "img/ref-furniture-12.jpg"]
  };
  const contactDefaults = {
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
    faqTitle: "Good to know before you reach out"
  };
  ["about", "story", "contact"].forEach((key) => {
    const page = key === "contact"
      ? { ...contactDefaults, ...(value.pages?.contact || {}) }
      : key === "about" ? { ...aboutDefaults, ...(value.pages?.about || {}) } : value.pages?.[key] || {};
    Object.entries(page).forEach(([field, content]) => {
      const input = fields[`${key}${field[0].toUpperCase()}${field.slice(1)}`];
      if (input) input.value = content;
    });
    if (key === "contact") fields.contactShowMap.checked = page.showMap !== false;
    if (key === "about") {
      fields.aboutFeatures.value = (page.features || []).map((item) => `${item.title} | ${item.description}`).join("\n");
      fields.aboutValues.value = (page.values || []).map((item) => `${item.title} | ${item.description}`).join("\n");
      renderAboutTeamEditor(page.team || []);
      fields.aboutStats.value = (page.stats || []).map((item) => `${item.value} | ${item.label}`).join("\n");
      fields.aboutGallery.value = (page.gallery || []).join("\n");
    }
  });
  fields.navigation.value = (value.navigation || []).map((item) => `${item.label} | ${item.url}`).join("\n");
  fields.faqs.value = (value.faqs || []).map((faq) => `${faq.question} | ${faq.answer}`).join("\n");
  const posts = value.posts || [];
  fields.posts.value = posts.map((post) => `${post.title} | ${post.excerpt} | ${post.image} | ${post.date}`).join("\n");
  const titleBySlug = new Map(posts.map((post) => [slugifyTitle(post.title), post.title]));
  fields.postSections.value = (value.postSections || []).map((section) => `${titleBySlug.get(section.slug) || section.slug} | ${section.heading} | ${section.body} | ${section.image || ""}`).join("\n");
  fields.blogAuthorName.value = value.blogAuthor?.name || "Home Shape Studio";
  fields.blogAuthorImage.value = value.blogAuthor?.image || "/legacy/blog-author.svg";
  fields.blogAuthorBio.value = value.blogAuthor?.bio || "Ideas and inspiration for a more considered home.";
  fields.blogHeroBackgroundImage.value = value.blogHeroBackgroundImage || "img/blog-grid-7.jpg.webp";
  fields.accountHeroBackgroundImage.value = value.accountHeroBackgroundImage || "img/furniture-title-bg-opt.jpg.webp";
  fields.popupEnabled.checked = value.popup?.enabled !== false;
  fields.popupTitle.value = value.popup?.title || "";
  fields.popupDescription.value = value.popup?.description || "";
  fields.popupButton.value = value.popup?.button || "";
  Object.entries(value.footer || {}).forEach(([key, content]) => {
    if (fields[`footer${key[0].toUpperCase()}${key.slice(1)}`]) fields[`footer${key[0].toUpperCase()}${key.slice(1)}`].value = content;
  });
  fields.footerColumns.value = (value.footer?.columns || []).flatMap((column) => (column.links || []).map((link) => `${column.title} | ${link.label} | ${link.url}`)).join("\n");
  fields.footerMenu.value = (value.footer?.menu || []).map((link) => `${link.label} | ${link.url}`).join("\n");
  fields.footerSocial.value = (value.footer?.social || []).map((link) => `${link.label} | ${link.url}`).join("\n");
}

function parseLines(value, separator, keys) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split(separator).map((part) => part.trim());
    if (parts.length < keys.length || parts.slice(0, keys.length).some((part) => !part)) {
      throw new Error(`Please use the format: ${keys.join(" | ")}`);
    }
    return Object.fromEntries(keys.map((key, index) => [key, parts[index]]));
  });
}

function slugifyTitle(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

contentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fields = contentForm.elements;
  try {
    const heroSlides = readHomepageList("heroSlides").filter((item) => item.title).slice(0, 3);
    if (heroSlides[0]) {
      fields.heroEyebrow.value = heroSlides[0].eyebrow; fields.heroTitle.value = heroSlides[0].title; fields.heroEmphasis.value = heroSlides[0].emphasis;
      fields.heroDescription.value = heroSlides[0].description; fields.heroPrice.value = heroSlides[0].price; fields.heroImage.value = heroSlides[0].image;
    }
    const next = {
    ...site,
    siteName: fields.siteName.value.trim(),
    announcement: fields.announcement.value.trim(),
    heroEyebrow: fields.heroEyebrow.value.trim(),
    heroPrice: fields.heroPrice.value.trim(),
    heroTitle: fields.heroTitle.value.trim(),
    heroEmphasis: fields.heroEmphasis.value.trim(),
    heroDescription: fields.heroDescription.value.trim(),
    heroImage: fields.heroImage.value.trim(),
    heroSlides,
    homeCollectionKicker: fields.homeCollectionKicker.value.trim(),
    homeCollectionTitle: fields.homeCollectionTitle.value.trim(),
    homeCollectionDescription: fields.homeCollectionDescription.value.trim(),
    categoryImages: readHomepageList("featuredCategories").filter((item) => item.name).slice(0, 12).map((item) => item.image),
    featuredCategories: readHomepageList("featuredCategories").filter((item) => item.name).slice(0, 12),
    homeLandingSlides: readHomepageList("homeLandingSlides").filter((item) => item.title).slice(0, 3),
    homeBrands: readHomepageList("homeBrands").filter((item) => item.name).slice(0, 24),
    homeProductKicker: fields.homeProductKicker.value.trim(),
    homeProductsTitle: fields.homeProductsTitle.value.trim(),
    homeProductsDescription: fields.homeProductsDescription.value.trim(),
    homeAboutKicker: fields.homeAboutKicker.value.trim(),
    homeAboutTitle: fields.homeAboutTitle.value.trim(),
    homeAboutDescription: fields.homeAboutDescription.value.trim(),
    homeAboutImage: fields.homeAboutImage.value.trim(),
    homeAboutImageAlt: fields.homeAboutImageAlt.value.trim(),
    homeAboutReadUrl: fields.homeAboutReadUrl.value.trim(),
    homeAboutContactUrl: fields.homeAboutContactUrl.value.trim(),
    homeNewsletterTitle: fields.homeNewsletterTitle.value.trim(),
    homeJournalKicker: fields.homeJournalKicker.value.trim(),
    homeJournalTitle: fields.homeJournalTitle.value.trim(),
    homeJournalDescription: fields.homeJournalDescription.value.trim(),
    pages: {
      about: {
        title: fields.aboutTitle.value.trim(), introEyebrow: fields.aboutIntroEyebrow.value.trim(), intro: fields.aboutIntro.value.trim(), body: fields.aboutBody.value.trim(), heroBackgroundImage: fields.aboutHeroBackgroundImage.value.trim(),
        features: parseLines(fields.aboutFeatures.value, "|", ["title", "description"]),
        sectionEyebrow: fields.aboutSectionEyebrow.value.trim(), sectionTitle: fields.aboutSectionTitle.value.trim(), sectionIntro: fields.aboutSectionIntro.value.trim(),
        image: fields.aboutImage.value.trim(), imageAlt: fields.aboutImageAlt.value.trim(), values: parseLines(fields.aboutValues.value, "|", ["title", "description"]),
        teamEyebrow: fields.aboutTeamEyebrow.value.trim(), teamTitle: fields.aboutTeamTitle.value.trim(), teamIntro: fields.aboutTeamIntro.value.trim(), team: readAboutTeamEditor(),
        stats: parseLines(fields.aboutStats.value, "|", ["value", "label"]), historyEyebrow: fields.aboutHistoryEyebrow.value.trim(), historyTitle: fields.aboutHistoryTitle.value.trim(), historyBody: fields.aboutHistoryBody.value.trim(),
        historyImage: fields.aboutHistoryImage.value.trim(), galleryTitle: fields.aboutGalleryTitle.value.trim(), gallery: fields.aboutGallery.value.split("\n").map((line) => line.trim()).filter(Boolean)
      },
      story: { title: fields.storyTitle.value.trim(), intro: fields.storyIntro.value.trim(), body: fields.storyBody.value.trim(), heroBackgroundImage: fields.storyHeroBackgroundImage.value.trim() },
      contact: {
        ...Object.fromEntries([
        "title", "intro", "eyebrow", "heroBackgroundImage", "infoEyebrow", "infoTitle", "infoDescription", "image", "imageAlt",
        "visitLabel", "callLabel", "emailLabel", "hoursLabel", "address", "phone", "email", "hours",
        "locationTitle", "locationDescription", "mapEmbedUrl", "mapLinkUrl", "mapLinkLabel",
        "formEyebrow", "formTitle", "formDescription", "formNameLabel", "formEmailLabel",
        "formSubjectLabel", "formMessageLabel", "formSubmitLabel", "successMessage", "responseNote",
        "faqEyebrow", "faqTitle"
        ].map((key) => [
          key,
          fields[`contact${key[0].toUpperCase()}${key.slice(1)}`].value.trim()
        ])),
        showMap: fields.contactShowMap.checked
      }
    },
    categories: categoryTreeData.map((category) => category.name),
    categoryTree: categoryTreeData,
    navigation: parseLines(fields.navigation.value, "|", ["label", "url"]),
    faqs: parseLines(fields.faqs.value, "|", ["question", "answer"]),
    posts: parseLines(fields.posts.value, "|", ["title", "excerpt", "image", "date"]).map((post) => ({ ...post, slug: slugifyTitle(post.title) })),
    blogHeroBackgroundImage: fields.blogHeroBackgroundImage.value.trim(),
    accountHeroBackgroundImage: fields.accountHeroBackgroundImage.value.trim(),
    postSections: fields.postSections.value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [postTitle, heading, body, image = ""] = line.split("|").map((part) => part.trim());
      if (!postTitle || !heading || !body) throw new Error("Use the article section format: post title | section heading | paragraphs | optional image path.");
      return { slug: slugifyTitle(postTitle), heading, body, image };
    }),
    blogAuthor: { name: fields.blogAuthorName.value.trim(), image: fields.blogAuthorImage.value.trim(), bio: fields.blogAuthorBio.value.trim() },
    popup: { enabled: fields.popupEnabled.checked, title: fields.popupTitle.value.trim(), description: fields.popupDescription.value.trim(), button: fields.popupButton.value.trim() },
    footer: {
      description: fields.footerDescription.value.trim(),
      address: fields.footerAddress.value.trim(),
      phone: fields.footerPhone.value.trim(),
      email: fields.footerEmail.value.trim(),
      copyright: fields.footerCopyright.value.trim(),
      columns: (() => {
        const grouped = new Map();
        parseLines(fields.footerColumns.value, "|", ["title", "label", "url"]).forEach(({ title, label, url }) => {
          if (!grouped.has(title)) grouped.set(title, []);
          grouped.get(title).push({ label, url });
        });
        return [...grouped].map(([title, links]) => ({ title, links }));
      })(),
      menu: parseLines(fields.footerMenu.value, "|", ["label", "url"]),
      social: parseLines(fields.footerSocial.value, "|", ["label", "url"])
    }
    };
    site = await request("/admin/site", { method: "PUT", body: JSON.stringify(next) });
    categoryTreeData = normalizeCategoryTree(site.categoryTree, site.categories || []);
    setProductCategoryOptions();
    renderCategoryManager();
    showNotice("Your site content is saved and published.");
  } catch (error) { showNotice(error.message, true); }
});

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderInquiries() {
  const shown = inquiries.filter((item) => inquiryFilter === "all" || item.type === inquiryFilter || item.status === inquiryFilter);
  const list = document.querySelector("#inquiry-list");
  if (!shown.length) {
    list.innerHTML = '<div class="empty-state">You’re all caught up. New messages and signups will appear here.</div>';
    return;
  }
  list.innerHTML = shown.map((item) => `<article class="inquiry-row">
    <span><strong>${escapeHtml(item.name || "Email signup")}</strong><small>${escapeHtml(item.type === "newsletter" ? "Email signup" : item.subject || "Contact request")} · ${formatDate(item.createdAt)}</small></span>
    <a href="mailto:${encodeURIComponent(item.email)}">${escapeHtml(item.email)}</a>
    <span class="inquiry-message" title="${escapeHtml(item.message)}">${escapeHtml(item.message || "—")}</span>
    <span class="inquiry-actions"><select aria-label="Enquiry status" data-status="${item._id}"><option value="new"${item.status === "new" ? " selected" : ""}>New</option><option value="read"${item.status === "read" ? " selected" : ""}>Read</option><option value="replied"${item.status === "replied" ? " selected" : ""}>Replied</option></select><button type="button" data-delete-inquiry="${item._id}" aria-label="Delete enquiry">×</button></span>
  </article>`).join("");
}

async function loadInquiries() {
  inquiries = await request("/admin/inquiries");
  renderInquiries();
}

document.querySelectorAll("[data-inquiry-filter]").forEach((button) => button.addEventListener("click", () => {
  inquiryFilter = button.dataset.inquiryFilter;
  document.querySelectorAll("[data-inquiry-filter]").forEach((tab) => tab.classList.toggle("active", tab === button));
  renderInquiries();
}));
document.querySelector("#refresh-inquiries").addEventListener("click", () => loadInquiries().catch((error) => showNotice(error.message, true)));
document.querySelector("#inquiry-list").addEventListener("change", async (event) => {
  const select = event.target.closest("[data-status]");
  if (!select) return;
  try {
    await request(`/admin/inquiries/${select.dataset.status}`, { method: "PATCH", body: JSON.stringify({ status: select.value }) });
    await loadInquiries();
    showNotice("Enquiry status updated.");
  } catch (error) { showNotice(error.message, true); }
});
document.querySelector("#inquiry-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-inquiry]");
  if (!button || !window.confirm("Delete this enquiry?")) return;
  try {
    await request(`/admin/inquiries/${button.dataset.deleteInquiry}`, { method: "DELETE" });
    await loadInquiries();
    showNotice("Enquiry deleted.");
  } catch (error) { showNotice(error.message, true); }
});

installImageUploaders();

request("/admin/me").then(showDashboard).catch(() => {
  loginView.hidden = false;
  adminView.hidden = true;
});
