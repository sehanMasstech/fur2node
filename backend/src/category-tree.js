function normalizeCategoryTree(tree, categories = []) {
  const source = Array.isArray(tree) && tree.length ? tree : categories;
  return normalizeNodes(source, "category", 0);
}

function normalizeNodes(nodes, parentId, depth) {
  if (!Array.isArray(nodes) || depth > 2) return [];
  return nodes.flatMap((item, index) => {
    const name = typeof item === "string" ? item.trim() : typeof item?.name === "string" ? item.name.trim() : "";
    if (!name) return [];
    const fallbackId = `${parentId}-${index + 1}`;
    const id = typeof item === "object" && typeof item.id === "string" && item.id.trim()
      ? item.id.trim()
      : fallbackId;
    return [{
      id,
      name,
      children: normalizeNodes(typeof item === "object" ? item.children : [], id, depth + 1)
    }];
  });
}

function flattenCategoryTree(tree, ancestors = [], depth = 0) {
  if (!Array.isArray(tree)) return [];
  return tree.flatMap((node) => {
    const path = [...ancestors, node.name].join(" > ");
    return [
      { id: node.id, name: node.name, path, depth },
      ...flattenCategoryTree(node.children, [...ancestors, node.name], depth + 1)
    ];
  });
}

module.exports = { flattenCategoryTree, normalizeCategoryTree };
