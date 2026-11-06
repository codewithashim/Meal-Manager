import { test } from "node:test";
import assert from "node:assert/strict";
import editorModule from "../src/features/meals/components/MealDayEditor.tsx";

const MealDayEditor = editorModule.default;

const record = {
  userId: "member-1",
  userName: "Test Member",
  userEmail: "member@example.test",
  userMealStatus: true,
  recordId: null,
  date: "2026-11-03",
  breakfast: 0,
  lunch: 1,
  dinner: 1,
  totalMeals: 2,
  note: "Keep this note",
};

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !node.props) return [];
  return [node, ...elements(node.props.children)];
}

function render(records, onChange, disabled = false) {
  return elements(MealDayEditor({ records, onChange, disabled, isManagerOrAdmin: false }));
}

test("meal controls adjust only the selected entry and preserve its note", () => {
  const other = { ...record, userId: "member-2", userName: "Another Member" };
  let updated;
  const tree = render([record, other], (value) => { updated = value; });
  const increase = tree.find((node) => node.props["aria-label"] === "Increase lunch for Test Member by 0.5");
  increase.props.onClick();
  assert.equal(updated[0].lunch, 1.5);
  assert.equal(updated[0].note, record.note);
  assert.equal(updated[1], other);
  const zeroButton = tree.find((node) => node.props["aria-label"] === "Decrease breakfast for Test Member by 0.5");
  assert.equal(zeroButton.props.disabled, true);
});

test("quick actions update all three meals and controls are disabled while saving", () => {
  let updated;
  const tree = render([record], (value) => { updated = value; });
  tree.find((node) => node.type === "button" && node.props.children === "Clear meals").props.onClick();
  assert.deepEqual([updated[0].breakfast, updated[0].lunch, updated[0].dinner], [0, 0, 0]);
  tree.find((node) => node.type === "button" && node.props.children === "1 of each").props.onClick();
  assert.deepEqual([updated[0].breakfast, updated[0].lunch, updated[0].dinner], [1, 1, 1]);
  assert.ok(render([record], () => {}, true).filter((node) => node.type === "button").every((button) => button.props.disabled));
});
