import { afterEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";

globalThis.prisma = {
  user: { findMany() {}, findUnique() {} },
  expense: { findMany() {}, create() {}, findUnique() {}, deleteMany() {}, updateMany() {} },
};
const { db } = await import("../src/services/db.service.ts");
const { AuditService } = await import("../src/services/audit.service.ts");
const { ExpenseService } = await import("../src/features/expenses/services/expense.service.ts");

const actor = "actor";
const other = "other";
const id = "0123456789abcdef01234567";
const entry = { title: "  Groceries  ", category: "FOOD", amount: 0.5, date: "2026-11-07" };
afterEach(() => mock.restoreAll());

test("shared ledger is available to each role and validates filters", async () => {
  const date = new Date("2026-11-05T00:00:00Z");
  const expenses = mock.method(db.expense, "findMany", async () => [
    { id, title: "Milk", amount: 0.5, category: "FOOD", createdBy: other, date },
    { id: "x", title: "Power", amount: 900, category: "ELECTRICITY", createdBy: other, date, paidFromMessFund: true },
  ]);
  mock.method(db.user, "findMany", async () => [{ id: other, name: "Member" }]);
  for (const role of [Role.USER, Role.MANAGER, Role.ADMIN]) {
    const result = await ExpenseService.getExpenses(role, [], "2026-11", "FOOD", actor);
    const where = expenses.mock.calls.at(-1).arguments[0].where;
    assert.equal(where.createdBy, undefined);
    assert.equal(where.date.gte.toISOString(), "2026-11-01T00:00:00.000Z");
    assert.equal(where.date.lt.toISOString(), "2026-12-01T00:00:00.000Z");
    assert.equal(result.expenses.length, 1);
    assert.equal(result.totalAmount, 0.5);
    assert.equal(result.expenses[0].creatorName, "Member");
    assert.equal(result.expenses[0].payerName, "Member");
    // The summary covers the whole month regardless of the category filter.
    assert.equal(result.summary.messTotal, 900.5);
    assert.equal(result.summary.bazaarTotal, 0.5);
  }
  await assert.rejects(ExpenseService.getExpenses(Role.USER, [], "2026-13", "ALL"));
  await assert.rejects(ExpenseService.getExpenses(Role.USER, [], "2026-11", "INVALID"));
  assert.equal(expenses.mock.callCount(), 3);
});

test("'paid by me' shows only what the member paid and totals their bazaar", async () => {
  const date = new Date("2026-11-05T00:00:00Z");
  mock.method(db.expense, "findMany", async () => [
    { id: "a", title: "Fish", amount: 300, category: "FOOD", createdBy: actor, memberId: actor, date },
    { id: "b", title: "Rice", amount: 500, category: "FOOD", createdBy: other, memberId: actor, date },
    { id: "c", title: "Oil", amount: 200, category: "FOOD", createdBy: actor, memberId: other, date },
  ]);
  mock.method(db.user, "findMany", async () => []);
  const mine = await ExpenseService.getExpenses(Role.USER, [], "2026-11", "ALL", actor, "MINE");
  assert.deepEqual(mine.expenses.map((e) => e.id), ["a", "b"]);
  assert.equal(mine.summary.myBazaar, 800);
});

test("creation associates the authenticated user and validates input", async () => {
  const create = mock.method(db.expense, "create", async ({ data }) => ({ id, ...data }));
  mock.method(AuditService, "logActivity", async () => {});
  const result = await ExpenseService.createExpense(actor, Role.USER, [], { ...entry, createdBy: other });
  assert.equal(result.success, true);
  assert.equal(create.mock.calls[0].arguments[0].data.createdBy, actor);
  assert.equal(create.mock.calls[0].arguments[0].data.title, "Groceries");
  for (const invalid of [
    { ...entry, date: "2026-02-30" },
    { ...entry, title: "  " },
    { ...entry, amount: 0 },
    { ...entry, amount: Infinity },
    { ...entry, category: "INVALID" },
  ]) {
    assert.ok((await ExpenseService.createExpense(actor, Role.USER, [], invalid)).error);
  }
  assert.equal(create.mock.callCount(), 1);
});

test("users cannot delete other entries even with custom permissions", async () => {
  const find = mock.method(db.expense, "findUnique", async () => ({ id, title: "Milk", amount: 5, createdBy: other }));
  const remove = mock.method(db.expense, "deleteMany", async () => ({ count: 1 }));
  assert.match((await ExpenseService.deleteExpense(actor, Role.USER, ["ALL"], id)).error, /only delete your own/);
  assert.equal(remove.mock.callCount(), 0);
  assert.ok((await ExpenseService.deleteExpense(actor, Role.USER, [], "invalid")).error);
  assert.equal(find.mock.callCount(), 1);
});

test("owners and managers can delete, and concurrent deletion is reported", async () => {
  mock.method(db.expense, "findUnique", async () => ({ id, title: "Milk", amount: 5, createdBy: actor, date: new Date("2026-11-07") }));
  const remove = mock.method(db.expense, "deleteMany", async () => ({ count: 1 }));
  mock.method(AuditService, "logActivity", async () => {});
  assert.equal((await ExpenseService.deleteExpense(actor, Role.USER, [], id)).success, true);
  assert.deepEqual(remove.mock.calls[0].arguments[0].where, { id, createdBy: actor });
  assert.equal((await ExpenseService.deleteExpense(other, Role.MANAGER, [], id)).success, true);
  assert.deepEqual(remove.mock.calls[1].arguments[0].where, { id });
  assert.equal((await ExpenseService.deleteExpense(other, Role.ADMIN, [], id)).success, true);
  remove.mock.mockImplementation(async () => ({ count: 0 }));
  assert.match((await ExpenseService.deleteExpense(actor, Role.USER, [], id)).error, /no longer exists/);
});

test("deleting an already missing expense returns an error", async () => {
  mock.method(db.expense, "findUnique", async () => null);
  const remove = mock.method(db.expense, "deleteMany", async () => ({ count: 0 }));
  assert.equal((await ExpenseService.deleteExpense(actor, Role.USER, [], id)).error, "Expense not found.");
  assert.equal(remove.mock.callCount(), 0);
});

test("members log only their own bazaar; managers choose who paid", async () => {
  const create = mock.method(db.expense, "create", async ({ data }) => ({ id, ...data }));
  mock.method(AuditService, "logActivity", async () => {});
  const memberId = "0123456789abcdef01234568";

  const utility = await ExpenseService.createExpense(actor, Role.USER, [], { ...entry, category: "ELECTRICITY" });
  assert.match(utility.error, /only log bazaar/);

  await ExpenseService.createExpense(actor, Role.USER, [], { ...entry, memberId, paidFromMessFund: true });
  assert.equal(create.mock.calls[0].arguments[0].data.memberId, actor);
  assert.equal(create.mock.calls[0].arguments[0].data.paidFromMessFund, false);

  mock.method(db.user, "findUnique", async () => ({ id: memberId }));
  await ExpenseService.createExpense(actor, Role.MANAGER, [], { ...entry, memberId });
  assert.equal(create.mock.calls[1].arguments[0].data.memberId, memberId);
  assert.equal(create.mock.calls[1].arguments[0].data.createdBy, actor);

  await ExpenseService.createExpense(actor, Role.MANAGER, [], { ...entry, paidFromMessFund: true });
  assert.equal(create.mock.calls[2].arguments[0].data.memberId, null);
  assert.equal(create.mock.calls[2].arguments[0].data.paidFromMessFund, true);

  await ExpenseService.createExpense(actor, Role.MANAGER, [], { ...entry, category: "GAS", memberId });
  assert.equal(create.mock.calls[3].arguments[0].data.memberId, null);
  assert.equal(create.mock.callCount(), 4);
});

test("members edit only their own entries; managers keep the original payer by default", async () => {
  const date = new Date("2026-11-03T00:00:00Z");
  mock.method(AuditService, "logActivity", async () => {});
  const update = mock.method(db.expense, "updateMany", async () => ({ count: 1 }));

  mock.method(db.expense, "findUnique", async () => ({ id, title: "Milk", amount: 5, category: "FOOD", createdBy: other, memberId: other, date }));
  assert.match((await ExpenseService.updateExpense(actor, Role.USER, [], id, entry)).error, /only edit your own/);
  assert.equal(update.mock.callCount(), 0);

  const result = await ExpenseService.updateExpense(actor, Role.MANAGER, [], id, { ...entry, amount: 9 });
  assert.equal(result.success, true);
  assert.equal(result.previousDate, "2026-11-03");
  assert.equal(update.mock.calls[0].arguments[0].data.memberId, other);
  assert.deepEqual(update.mock.calls[0].arguments[0].where, { id });

  mock.method(db.expense, "findUnique", async () => ({ id, title: "Milk", amount: 5, category: "FOOD", createdBy: actor, date }));
  await ExpenseService.updateExpense(actor, Role.USER, [], id, entry);
  assert.deepEqual(update.mock.calls[1].arguments[0].where, { id, createdBy: actor });
  assert.equal(update.mock.calls[1].arguments[0].data.memberId, actor);
});
