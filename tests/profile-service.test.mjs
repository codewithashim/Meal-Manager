import { afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

globalThis.prisma = {
  user: { findUnique() {}, findFirst() {}, update() {} },
  roomAssignment: { findFirst() {} },
  mealRecord: { findMany() {}, aggregate() {} },
  expense: { findMany() {}, aggregate() {} },
  payment: { findMany() {} },
  monthlyBill: { findUnique() {}, findMany() {} },
  complaint: { count() {} },
};
const { db } = await import("../src/services/db.service.ts");
const { AuditService } = await import("../src/services/audit.service.ts");
const { ProfileService } = await import("../src/features/profile/services/profile.service.ts");
const { BillingService } = await import("../src/features/billing/services/billing.service.ts");

const me = "aaaaaaaaaaaaaaaaaaaaaaaa";
const other = "bbbbbbbbbbbbbbbbbbbbbbbb";
const member = { id: me, role: Role.USER, permissions: [] };
const manager = { id: other, role: Role.MANAGER, permissions: [] };

afterEach(() => mock.restoreAll());

function stubOverviewQueries({ bill = null, meals = [], expenses = [], payments = [] } = {}) {
  mock.method(db.user, "findUnique", async () => ({ id: me, name: "Rahim", email: "r@x.com", monthlyRent: 3000 }));
  mock.method(db.roomAssignment, "findFirst", async () => null);
  mock.method(db.mealRecord, "findMany", async () => meals);
  mock.method(db.mealRecord, "aggregate", async () => ({ _sum: { totalMeals: 100 } }));
  mock.method(db.expense, "aggregate", async () => ({ _sum: { amount: 5000 } }));
  mock.method(db.expense, "findMany", async () => expenses);
  mock.method(db.payment, "findMany", async () => payments);
  mock.method(db.monthlyBill, "findUnique", async () => bill);
  mock.method(db.monthlyBill, "findMany", async () => []);
  mock.method(db.complaint, "count", async () => 0);
  mock.method(BillingService, "syncMonths", async () => {});
}

test("members can only open their own profile; managers can open anyone's", async () => {
  assert.equal(ProfileService.canView(member, me), true);
  assert.equal(ProfileService.canView(member, other), false);
  assert.equal(ProfileService.canView(manager, me), true);
  await assert.rejects(ProfileService.getOverview(member, other, "2026-10"), /Forbidden/);
});

test("invalid ids and months are rejected before querying", async () => {
  const find = mock.method(db.user, "findUnique", async () => null);
  await assert.rejects(ProfileService.getOverview(member, "not-an-id", "2026-10"));
  await assert.rejects(ProfileService.getOverview(member, me, "2026-13"));
  assert.equal(find.mock.callCount(), 0);
});

test("overview is scoped to the selected month and estimates the bill before it is generated", async () => {
  const date = new Date("2026-10-05T00:00:00Z");
  stubOverviewQueries({
    meals: [{ id: "m1", date, breakfast: 1, lunch: 1, dinner: 1, totalMeals: 3, note: null }],
    expenses: [
      { id: "e1", title: "Rice", category: "FOOD", amount: 400, date, description: null, createdBy: me },
      { id: "e2", title: "Bulb", category: "MAINTENANCE", amount: 100, date, description: null, createdBy: me },
      // Logged by this member but paid by someone else: not theirs.
      { id: "e3", title: "Fish", category: "FOOD", amount: 700, date, description: null, createdBy: me, memberId: other },
    ],
    payments: [{ id: "p1", amount: 1000, date, paymentMethod: "CASH", transactionId: null, note: null }],
  });

  const o = await ProfileService.getOverview(member, me, "2026-10");

  const paymentWhere = db.payment.findMany.mock.calls[0].arguments[0].where;
  assert.deepEqual(paymentWhere, { userId: me, month: "2026-10" });
  const expenseWhere = db.expense.findMany.mock.calls[0].arguments[0].where;
  assert.deepEqual(expenseWhere.OR, [{ memberId: me }, { createdBy: me }]);
  assert.equal(expenseWhere.date.gte.toISOString(), "2026-10-01T00:00:00.000Z");

  assert.equal(o.meals.total, 3);
  assert.equal(o.mealRate, 50); // 5000 food / 100 mess meals
  assert.equal(o.isMonthClosed, true);
  assert.equal(o.expenses.bazaarDeposited, 400); // only FOOD the member paid for counts
  assert.deepEqual(o.expenses.items.map((e) => e.id), ["e1", "e2"]);
  assert.equal(BillingService.syncMonths.mock.calls[0].arguments[0], "2026-10");
  assert.equal(o.estimate.total, 3 * 50 + 3000);
  assert.equal(o.estimate.balance, 3150 - 400 - 1000);
});

test("the stored bill's meal rate is used when the member has a bill", async () => {
  stubOverviewQueries({ bill: { mealRate: 42, dueAmount: 0 } });
  const o = await ProfileService.getOverview(member, me, "2026-09");
  assert.equal(o.mealRate, 42);
});

test("password change requires the current password", async () => {
  const passwordHash = await bcrypt.hash("old-secret", 4);
  mock.method(db.user, "findUnique", async () => ({ passwordHash }));
  const update = mock.method(db.user, "update", async () => ({}));
  mock.method(AuditService, "logActivity", async () => {});

  const wrong = await ProfileService.changePassword(me, {
    currentPassword: "nope",
    newPassword: "new-secret",
    confirmPassword: "new-secret",
  });
  assert.match(wrong.error, /incorrect/);
  assert.equal(update.mock.callCount(), 0);

  const mismatch = await ProfileService.changePassword(me, {
    currentPassword: "old-secret",
    newPassword: "new-secret",
    confirmPassword: "different",
  });
  assert.match(mismatch.error, /do not match/);

  const ok = await ProfileService.changePassword(me, {
    currentPassword: "old-secret",
    newPassword: "new-secret",
    confirmPassword: "new-secret",
  });
  assert.equal(ok.success, true);
  assert.equal(update.mock.calls[0].arguments[0].where.id, me);
});

test("profile edits only touch allowed fields and keep phone numbers unique", async () => {
  mock.method(AuditService, "logActivity", async () => {});
  mock.method(db.user, "findFirst", async () => ({ id: other }));
  const update = mock.method(db.user, "update", async () => ({ email: "r@x.com" }));

  const taken = await ProfileService.updateOwnProfile(me, { name: "Rahim", phone: "017" });
  assert.match(taken.error, /already used/);
  assert.equal(update.mock.callCount(), 0);

  mock.method(db.user, "findFirst", async () => null);
  const ok = await ProfileService.updateOwnProfile(me, {
    name: "Rahim Uddin",
    phone: "",
    role: "ADMIN",
    monthlyRent: 0,
  });
  assert.equal(ok.success, true);
  const data = update.mock.calls[0].arguments[0].data;
  assert.equal(data.phone, null);
  assert.equal("role" in data, false);
  assert.equal("monthlyRent" in data, false);
});
