const test = require("node:test");
const assert = require("node:assert/strict");
const { flattenCategoryTree, normalizeCategoryTree } = require("../src/category-tree");

test("legacy categories normalize into stable root categories", () => {
  const tree = normalizeCategoryTree(null, ["Furniture", "Outdoor Furniture"]);
  assert.deepEqual(tree.map(({ id, name, children }) => ({ id, name, children })), [
    { id: "category-1", name: "Furniture", children: [] },
    { id: "category-2", name: "Outdoor Furniture", children: [] }
  ]);
});

test("category paths include parent, subcategory, and child names", () => {
  const tree = normalizeCategoryTree([{
    id: "furniture",
    name: "Furniture",
    children: [{
      id: "seating",
      name: "Seating",
      children: [{ id: "dining", name: "Dining chairs" }]
    }]
  }]);

  assert.deepEqual(flattenCategoryTree(tree).map(({ id, path, depth }) => ({ id, path, depth })), [
    { id: "furniture", path: "Furniture", depth: 0 },
    { id: "seating", path: "Furniture > Seating", depth: 1 },
    { id: "dining", path: "Furniture > Seating > Dining chairs", depth: 2 }
  ]);
});
