# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Members and managers of a single Bangladeshi bachelor mess: students and working bachelors who share rooms, cook together, and split the month's costs. Three roles:

- **Members (USER):** log their own daily meals, record bazaar (grocery) spending, read their monthly bill, see notices, file complaints.
- **Managers (MANAGER):** run the shared meal ledger and expenses, generate bills, record payments.
- **Admins (ADMIN):** everything above plus members, rooms/seats, access control and audit logs.

Typical scene: a member on a phone at night adjusting tomorrow's meals, or a manager at month end settling who owes what.

## Product Purpose

Replace the mess khata (paper ledger) and the month-end arithmetic argument. Meals, bazaar, utilities and rent go in through the month; at month end every member gets an itemized bill they can check line by line.

Success: nobody has to recompute the meal rate by hand, and every member can see exactly why they owe what they owe.

## Positioning

The meal rate is computed from the mess's own numbers: total FOOD expense for the month divided by total meals eaten. Each bill = (member's meals × meal rate) + seat rent + equal share of electricity, gas, water, khala (maid), Wi-Fi + other charges, minus bazaar the member paid for and payments made. Bills for the previous month are generated automatically.

## Operating Context

- Month runs on Asia/Dhaka time; currency BDT (৳).
- Meals counted per day as breakfast / lunch / dinner in 0.5 steps.
- Expense categories: Food, Gas, Electricity, Water, Internet, Rent, Maintenance, Cleaning, Staff salary (khala), Other.
- Payment methods: Cash, Bank, bKash, Nagad, Other.
- Rooms have floors, capacity and seats (vacant / occupied / reserved).
- Notices with priority; complaints with category, priority and status (pending → in progress → resolved / rejected).
- Every action is written to an audit log.

## Capabilities and Constraints

- Single-tenant: one mess per deployment. No public sign-up; admins create member accounts. Sign-in with email or phone + password.
- Login at `/login`; app routes are protected by middleware.
- Printable invoices and a full monthly report.
- Local terminology to keep: bazaar, meal rate, khala, mess, seat.

## Brand Commitments

- Name: **Meal Manager** (confirmed; the repo name Mess-Mate is not the public name).
- Landing page primary action: **Sign in** only (confirmed). No sign-up, pricing, or "get it for your mess" pitch.
- Copy in English using local Bangladeshi mess terms.

## Evidence on Hand

- No testimonials, customer counts, usage statistics, logos, or press exist. Do not fabricate any.
- Product facts above are verified from source (`prisma/schema.prisma`, `src/features/billing/services/billing.service.ts`).
- Any illustrative numbers in product previews are sample data and must read as such.

## Product Principles

1. Show the math. Trust comes from every taka being traceable to a meal, a bazaar trip or a bill.
2. Members first: the daily action (log meals) must be fast on a phone.
3. Local, not generic: speak the mess's own vocabulary.
4. No invented claims.
