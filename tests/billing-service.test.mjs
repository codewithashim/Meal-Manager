import { afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";

globalThis.prisma = {
  user: { findMany() {} },
  expense: { findMany() {}, groupBy() {} },
  mealRecord: { aggregate() {}, groupBy() {} },
  payment: { groupBy() {} },
  monthlyBill: { findMany() {}, upsert() {}, deleteMany() {} },
  $transaction() {},
};
const { db } = await import("../src/services/db.service.ts");
const { BillingService } = await import("../src/features/billing/services/billing.service.ts");
const { expensePayerId, sumBazaarByMember } = await import("../src/features/expenses/payer.ts");

afterEach(() => mock.restoreAll());

test("bazaar is credited to the payer, falls back to the logger, and mess-fund bazaar credits nobody", () => {
  assert.equal(expensePayerId({ category: "FOOD", createdBy: "mgr", memberId: "rahim" }), "rahim");
  assert.equal(expensePayerId({ category: "FOOD", createdBy: "rahim" }), "rahim");
  assert.equal(expensePayerId({ category: "FOOD", createdBy: "mgr", paidFromMessFund: true }), null);
  const totals = sumBazaarByMember([
    { category: "FOOD", createdBy: "mgr", memberId: "rahim", amount: 500 },
    { category: "FOOD", createdBy: "rahim", amount: 200 },
    { category: "FOOD", createdBy: "mgr", paidFromMessFund: true, amount: 1000 },
    { category: "GAS", createdBy: "rahim", amount: 900 },
  ]);
  assert.deepEqual([...totals], [["rahim", 700]]);
});

const NOV_END = new Date("2026-11-30T23:59:59Z");

function stubMonth({ members, utilities = [], bills = [] }) {
  // ৳5000 food, 100 mess meals → ৳50/meal. Rahim paid ৳3000 of the bazaar; ৳2000 came from the mess fund.
  mock.method(db.expense, "findMany", async () => [
    { amount: 3000, category: "FOOD", createdBy: "mgr", memberId: "rahim" },
    { amount: 2000, category: "FOOD", createdBy: "mgr", paidFromMessFund: true },
  ]);
  mock.method(db.mealRecord, "aggregate", async () => ({ _sum: { totalMeals: 100 } }));
  mock.method(db.mealRecord, "groupBy", async () => [
    { userId: "rahim", _sum: { totalMeals: 60 } },
    { userId: "karim", _sum: { totalMeals: 40 } },
  ]);
  mock.method(db.payment, "groupBy", async () => [{ userId: "karim", _sum: { amount: 1000 } }]);
  mock.method(db.user, "findMany", async () => members);
  mock.method(db.expense, "groupBy", async () => utilities);
  mock.method(db.monthlyBill, "findMany", async () => bills);
}

const rahim = { id: "rahim", name: "Rahim", email: "r@x", monthlyRent: 2000, status: "ACTIVE", joiningDate: new Date("2026-01-01") };
const karim = { id: "karim", name: "Karim", email: "k@x", monthlyRent: 1500, status: "ACTIVE", joiningDate: new Date("2026-01-01") };

test("bills are computed from meals, payer-credited bazaar, logged utilities, rent and payments", async () => {
  stubMonth({
    members: [rahim, karim],
    utilities: [
      { category: "ELECTRICITY", _sum: { amount: 1000 } },
      { category: "CLEANING", _sum: { amount: 200 } },
    ],
  });

  const [r, k] = await BillingService.computeMonthBills("2026-11");
  assert.equal(r.mealRate, 50);
  assert.equal(r.mealCost, 3000);
  assert.equal(r.electricityShare, 500);
  assert.equal(r.otherCharges, 100);
  assert.equal(r.totalBill, 3000 + 2000 + 500 + 100);
  assert.equal(r.bazarDeposited, 3000);
  assert.equal(r.dueAmount, 5600 - 3000);
  assert.equal(r.status, "PARTIALLY_PAID");
  assert.equal(k.totalBill, 2000 + 1500 + 500 + 100);
  assert.equal(k.dueAmount, 4100 - 1000);
});

test("members who left are billed only if they had activity; future joiners are not billed", async () => {
  const leftWithMeals = { ...karim, status: "INACTIVE" };
  const leftIdle = { id: "gone", name: "Gone", email: "g@x", monthlyRent: 999, status: "INACTIVE", joiningDate: new Date("2025-01-01") };
  const joinsLater = { id: "new", name: "New", email: "n@x", monthlyRent: 999, status: "ACTIVE", joiningDate: new Date(NOV_END.getTime() + 86400000) };
  stubMonth({ members: [rahim, leftWithMeals, leftIdle, joinsLater] });

  const rows = await BillingService.computeMonthBills("2026-11");
  assert.deepEqual(rows.map((r) => r.userId), ["rahim", "karim"]);
});

test("sync writes only changed bills and removes bills for members no longer billed", async () => {
  const [current] = await (async () => {
    stubMonth({ members: [rahim] });
    return BillingService.computeMonthBills("2026-11");
  })();
  mock.restoreAll();

  stubMonth({
    members: [rahim, karim],
    bills: [
      { id: "b-rahim", userId: "rahim", ...current },
      { id: "b-old", userId: "ghost", totalBill: 10 },
    ],
  });
  const upsert = mock.method(db.monthlyBill, "upsert", (args) => args);
  const del = mock.method(db.monthlyBill, "deleteMany", (args) => args);
  const tx = mock.method(db, "$transaction", async (ops) => ops);

  await BillingService.syncMonth("2026-11");

  // Rahim's bill is unchanged so it isn't rewritten; Karim has no bill yet; the ghost bill is removed.
  assert.deepEqual(upsert.mock.calls.map((c) => c.arguments[0].where.userId_month.userId), ["karim"]);
  assert.deepEqual(del.mock.calls[0].arguments[0].where, { id: { in: ["b-old"] } });
  assert.equal(tx.mock.callCount(), 1);
});

test("future, invalid and unchanged months write nothing", async () => {
  const tx = mock.method(db, "$transaction", async () => []);
  await BillingService.syncMonth("2999-01");
  await BillingService.syncMonth("bad");
  assert.equal(tx.mock.callCount(), 0);

  stubMonth({ members: [] });
  await BillingService.syncMonth("2026-11");
  assert.equal(tx.mock.callCount(), 0);
});
