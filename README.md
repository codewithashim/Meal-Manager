# 🍱 Meal Manager

**Meal Manager** is a comprehensive, modern, full-stack residential boarding & meal management web application. Designed for hostels, boarding houses, and mess communities, it streamlines daily meal tracking, bazaar expenses, utility cost distribution, room/seat allocations, and itemized monthly billing statements.

---

## ✨ Features

- **🍲 Meal Ledger & Live Rate Calculation**:
  - Track daily member meal counts (Breakfast, Lunch, Dinner).
  - Calculate real-time monthly meal rates based on total food bazaar expenditure divided by total consumed meals.

- **💸 Expense & Bazaar Tracking**:
  - Log daily expenses categorized by Food, Utilities (Electricity, Water, Gas, Internet), Rent, Staff Salaries, and Maintenance.
  - Attach notes and track deposited bazaar money per member.

- **📊 Itemized Monthly Invoices & Billing**:
  - Automatically generate itemized monthly bills for each member.
  - Includes seat/room rent, individual utility share breakdown (Electricity, Gas, Water, Internet, Maid/Khala), and meal costs minus bazaar deposits.
  - Printable invoice slips and monthly summary reports.

- **🏠 Room & Seat Allocation**:
  - Manage rooms, floors, capacities, and seat assignments (e.g., Room 101, Seat A/B).
  - Real-time room occupancy and seat availability status.

- **👥 Member & Access Control (RBAC)**:
  - Multi-tier role permissions (`ADMIN`, `MANAGER`, `USER`).
  - Active/Inactive status management, NID, emergency contacts, and joining dates.

- **📢 Notices, Complaints & Audit Trail**:
  - Centralized Notice Board for announcements and rule updates.
  - Member service complaint ticketing system with priority levels.
  - System activity audit logging for security and accountability.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Library**: [React 19](https://react.dev/)
- **Database & ORM**: [MongoDB](https://www.mongodb.com/) & [Prisma ORM v6](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5 (Auth.js)](https://authjs.dev/) & `bcryptjs`
- **Styling & UI**: Tailwind CSS v4, Lucide React Icons, Sonner Toasts
- **Language**: TypeScript 5

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 20+** installed on your system and access to a **MongoDB** database URI.

### 2. Environment Setup
Create a `.env` file in the root directory and specify your configuration:

```env
DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/mealmanager?retryWrites=true&w=majority"
AUTH_SECRET="your-super-secret-auth-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Installation
Install project dependencies:

```bash
npm install
```

### 4. Database Setup & Seeding
Generate the Prisma Client and seed initial data:

```bash
# Generate Prisma Client
npm run db:generate

# Push database schema (if using MongoDB/SQL)
npm run db:push

# Seed database with sample data & admin account
npm run db:seed
```

### 5. Run Development Server
Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the Next.js development server. |
| `npm run build` | Compiles the production build. |
| `npm run start` | Starts the production server after building. |
| `npm run db:generate` | Generates the Prisma Client. |
| `npm run db:push` | Pushes the Prisma schema state to MongoDB. |
| `npm run db:seed` | Seeds the database using `prisma/seed.ts`. |
| `npm run db:studio` | Opens Prisma Studio GUI in browser. |
| `npm run lint` | Runs ESLint checks. |

---

## 🛡️ License

Private & Proprietary — Developed for **Meal Manager**.
