import { afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";

globalThis.prisma = {
  user: { findMany() {} },
  mealRecord: { findMany() {}, upsert() {} },
  $transaction() {},
};
const { db } = await import("../src/services/db.service.ts");
const { AuditService } = await import("../src/services/audit.service.ts");
const { MealService } = await import("../src/features/meals/services/meal.service.ts");

const actor = "actor";
const other = "other";
const date = "2026-11-07";
const entry = (userId) => ({ userId, breakfast: 1, lunch: 0.5, dinner: 0 });

afterEach(() => mock.restoreAll());

test("daily and calendar queries scope regular users to their own records", async () => {
  const users = mock.method(db.user, "findMany", async () => []);
  const records = mock.method(db.mealRecord, "findMany", async () => []);

  await MealService.getDailyMeals(actor, Role.USER, ["ALL"], date);
  assert.equal(users.mock.calls[0].arguments[0].where.id, actor);
  assert.equal(records.mock.calls[0].arguments[0].where.userId, actor);

  await MealService.getMessMonthDailyRecords(actor, Role.USER, ["ALL"], "2026-11");
  assert.equal(records.mock.calls[1].arguments[0].where.userId, actor);

  await MealService.getDailyMeals(actor, Role.MANAGER, [], date);
  assert.equal(users.mock.calls[1].arguments[0].where.id, undefined);
  assert.equal(records.mock.calls[2].arguments[0].where.userId, undefined);

  await MealService.getMessMonthDailyRecords(actor, Role.ADMIN, [], "2026-11");
  assert.equal(records.mock.calls[3].arguments[0].where.userId, undefined);
});

test("regular users cannot access another history or the mess-wide summary", async () => {
  await assert.rejects(MealService.getUserMealHistory(actor, Role.USER, other, "2026-11"), /own meal history/);
  await assert.rejects(MealService.getMonthlyMealSummary(Role.USER, ["ALL"], "2026-11"), /managers only/);
});

test("own meal history returns the selected month's records", async () => {
  const records = mock.method(db.mealRecord, "findMany", async () => [{
    id: "record", date: new Date("2026-11-07T00:00:00Z"),
    breakfast: 1, lunch: 0.5, dinner: 0, totalMeals: 1.5, note: null,
  }]);
  const result = await MealService.getUserMealHistory(actor, Role.USER, actor, "2026-11");
  assert.equal(records.mock.calls[0].arguments[0].where.userId, actor);
  assert.equal(records.mock.calls[0].arguments[0].where.date.lt.toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(result[0].totalMeals, 1.5);
  assert.equal(result[0].date, date);
});

test("single and mixed bulk writes reject other users before any database operation", async () => {
  const upsert = mock.method(db.mealRecord, "upsert", async () => ({}));
  await assert.rejects(MealService.saveSingleMealRecord(actor, Role.USER, ["ALL"], { ...entry(other), date }), /own meals/);
  await assert.rejects(MealService.bulkSaveDailyMeals(actor, Role.USER, ["ALL"], {
    date, records: [entry(actor), entry(other)],
  }), /own meals/);
  assert.equal(upsert.mock.callCount(), 0);
});

test("users can save their own meals and managers can save other members", async () => {
  const upsert = mock.method(db.mealRecord, "upsert", async () => ({}));
  mock.method(db, "$transaction", async (operations) => Promise.all(operations));
  mock.method(AuditService, "logActivity", async () => {});

  assert.equal((await MealService.saveSingleMealRecord(actor, Role.USER, [], { ...entry(actor), date })).success, true);
  assert.equal((await MealService.bulkSaveDailyMeals(actor, Role.USER, [], { date, records: [entry(actor)] })).success, true);
  assert.equal((await MealService.bulkSaveDailyMeals(actor, Role.MANAGER, [], { date, records: [entry(other)] })).success, true);
  assert.deepEqual(upsert.mock.calls.map((call) => call.arguments[0].where.userId_date.userId), [actor, actor, other]);
});

test("invalid dates, empty batches and duplicate members are rejected", async () => {
  const upsert = mock.method(db.mealRecord, "upsert", async () => ({}));
  await assert.rejects(MealService.getDailyMeals(actor, Role.USER, [], "2026-02-30"));
  await assert.rejects(MealService.getMessMonthDailyRecords(actor, Role.USER, [], "2026-13"));
  assert.ok((await MealService.bulkSaveDailyMeals(actor, Role.USER, [], { date, records: [] })).error);
  assert.ok((await MealService.bulkSaveDailyMeals(actor, Role.USER, [], { date, records: [entry(actor), entry(actor)] })).error);
  assert.ok((await MealService.saveSingleMealRecord(actor, Role.USER, [], { ...entry(actor), date: "2026-02-30" })).error);
  assert.equal(upsert.mock.callCount(), 0);
});
