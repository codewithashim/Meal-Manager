import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Check,
  FileSpreadsheet,
  History,
  Megaphone,
  MessageSquareWarning,
  Printer,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { AppPreview } from "./AppPreview";
import { LandingNav } from "./LandingNav";
import { RateCalculator } from "./RateCalculator";
import { Reveal, SpotlightCard } from "./motion";

const container = "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8";

const LOCAL_FACTS: { icon: LucideIcon; label: string }[] = [
  { icon: BadgeCheck, label: "Taka (৳) billing" },
  { icon: Wallet, label: "bKash & Nagad payments" },
  { icon: UtensilsCrossed, label: "Half-meal counting" },
  { icon: Smartphone, label: "Sign in with phone or email" },
  { icon: Printer, label: "Printable invoices" },
  { icon: ShieldCheck, label: "Role-based access" },
  { icon: History, label: "Full audit trail" },
  { icon: BedDouble, label: "Room & seat chart" },
];

const STEPS = [
  {
    title: "Members log their meals",
    text: "Everyone sets their own breakfast, lunch and dinner each day, in half-meal steps. Managers can correct the whole ledger.",
  },
  {
    title: "Bazaar and bills are recorded",
    text: "Whoever does the bazaar records it. Electricity, gas, water, Wi-Fi and the khala's salary go in as they're paid.",
  },
  {
    title: "Bills are generated at month end",
    text: "The meal rate is worked out from the food bazaar and total meals, and every member gets an itemized bill.",
  },
];

const ROLES = [
  {
    name: "Member",
    summary: "For everyone living in the mess.",
    items: ["Log your own daily meals", "Record bazaar and expenses", "See your monthly bill and payments", "Read notices, file complaints"],
  },
  {
    name: "Manager",
    summary: "For whoever runs the month.",
    items: ["Edit the whole mess's meal ledger", "Generate monthly bills", "Record cash, bank, bKash and Nagad payments", "Post notices, manage rooms and members"],
    featured: true,
  },
  {
    name: "Admin",
    summary: "For the mess owner or lead.",
    items: ["Everything a manager can do", "Grant members extra access", "Read the full audit log", "Activate or deactivate accounts"],
  },
];

const MEAL_GRID = [3, 3, 2.5, 3, 2, 3, 1.5, 3, 3, 2, 3, 3, 2.5, 3, 3, 0, 3, 2, 3, 3, 2.5];

const AUDIT_LINES = [
  { who: "Rakib", what: "added bazaar", amount: "৳3,500" },
  { who: "Manager", what: "generated October bills", amount: "6 members" },
  { who: "Tanvir", what: "paid by bKash", amount: "৳3,000" },
  { who: "Admin", what: "assigned seat 103A", amount: "Imran" },
  { who: "Sabbir", what: "set dinner to 0", amount: "Nov 16" },
];

function FeatureCard({
  icon: Icon,
  title,
  text,
  className = "",
  delay = 0,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  className?: string;
  delay?: number;
  children?: React.ReactNode;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <SpotlightCard className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/40 p-6 transition-colors duration-300 hover:border-emerald-400/20">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/15 to-emerald-400/5 text-emerald-400 shadow-[0_0_20px_-6px_rgba(16,185,129,0.5)]">
          <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
        {children ? <div className="mt-6 flex-1">{children}</div> : null}
      </SpotlightCard>
    </Reveal>
  );
}

export function LandingPage() {
  return (
    <div className="relative min-h-dvh w-full overflow-x-clip bg-[#0b0f19] font-[family-name:var(--font-geist-sans)] text-slate-300 antialiased selection:bg-emerald-400/30 selection:text-white">
      <noscript>
        <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* Hero backdrop: moving aurora and a fading grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[1100px] overflow-hidden">
        <div className="motion-loop absolute left-[8%] top-[-200px] h-[520px] w-[620px] rounded-full bg-emerald-500/[0.16] blur-[110px] motion-safe:animate-[aurora_18s_ease-in-out_infinite]" />
        <div
          className="motion-loop absolute right-[6%] top-[-120px] h-[460px] w-[560px] rounded-full bg-teal-400/[0.10] blur-[110px] motion-safe:animate-[aurora_22s_ease-in-out_infinite]"
          style={{ animationDelay: "-7s" }}
        />
        <div
          className="motion-loop absolute left-1/2 top-[260px] h-[380px] w-[700px] -translate-x-1/2 rounded-full bg-sky-500/[0.06] blur-[120px] motion-safe:animate-[aurora_26s_ease-in-out_infinite]"
          style={{ animationDelay: "-12s" }}
        />
        <div
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <LandingNav />

      <main id="main" className="relative">
        {/* Hero */}
        <section aria-labelledby="hero-title" className={`${container} pb-20 pt-14 sm:pt-20 lg:pb-28`}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] py-1.5 pl-2 pr-3.5 text-xs font-medium text-emerald-300 motion-safe:animate-[heroIn_600ms_cubic-bezier(0.16,1,0.3,1)_both]">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="motion-loop absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-[livePing_1.6s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Made for bachelor messes in Bangladesh
            </p>

            <h1
              id="hero-title"
              className="mt-7 text-balance bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent motion-safe:animate-[heroIn_700ms_80ms_cubic-bezier(0.16,1,0.3,1)_both] sm:text-6xl sm:leading-[1.05] lg:text-7xl"
            >
              Run your mess without the{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                month-end math
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-400 motion-safe:animate-[heroIn_700ms_160ms_cubic-bezier(0.16,1,0.3,1)_both] sm:text-lg">
              Meal Manager keeps your mess&rsquo;s meals, bazaar and bills in one place. Members log what they eat,
              the meal rate works itself out, and everyone gets an itemized bill at the end of the month.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 motion-safe:animate-[heroIn_700ms_240ms_cubic-bezier(0.16,1,0.3,1)_both] sm:flex-row">
              <Link
                href="/login"
                className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-500 px-7 text-sm font-semibold text-slate-950 shadow-[0_10px_30px_-8px_rgba(16,185,129,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_16px_40px_-8px_rgba(16,185,129,0.8)] sm:w-auto"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/30 blur-md transition-transform duration-700 group-hover:translate-x-[300%]"
                />
                Sign in to your mess
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-7 text-sm font-medium text-white transition-colors hover:border-white/20 hover:bg-white/5 sm:w-auto"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="mt-16 motion-safe:animate-[previewIn_1100ms_300ms_cubic-bezier(0.16,1,0.3,1)_both] sm:mt-20">
            <AppPreview />
          </div>
        </section>

        {/* Local facts marquee */}
        <section aria-label="What Meal Manager supports" className="relative border-y border-white/[0.06] bg-white/[0.015] py-6">
          <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <ul className="motion-loop flex w-max gap-3 motion-safe:animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused]">
              {[...LOCAL_FACTS, ...LOCAL_FACTS].map(({ icon: Icon, label }, index) => (
                <li
                  key={`${label}-${index}`}
                  aria-hidden={index >= LOCAL_FACTS.length ? true : undefined}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.07] bg-slate-900/50 px-4 py-2 text-sm text-slate-300"
                >
                  <Icon aria-hidden="true" className="h-4 w-4 text-emerald-400" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-title" className={`${container} scroll-mt-20 py-24 sm:py-32`}>
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 id="features-title" className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Everything the mess runs on
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
              From the daily meal count to the seat chart, one shared ledger that every member can see.
            </p>
          </Reveal>

          <div className="mt-16 grid gap-4 md:grid-cols-6">
            <FeatureCard
              icon={UtensilsCrossed}
              title="Daily meal ledger"
              text="Breakfast, lunch and dinner for every member, counted in half-meal steps. Members update their own; managers see the whole mess."
              className="md:col-span-4"
            >
              <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
                {MEAL_GRID.map((level, i) => (
                  <div
                    key={i}
                    className="motion-loop rounded-lg border border-white/[0.05] bg-white/[0.02] p-1.5 text-center motion-safe:animate-[cellGlow_5s_ease-in-out_infinite]"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  >
                    <p className="text-[10px] text-slate-600">{i + 1}</p>
                    <p
                      className={`text-xs font-semibold tabular-nums ${level === 0 ? "text-slate-600" : level === 3 ? "text-emerald-400" : "text-slate-300"}`}
                    >
                      {level}
                    </p>
                  </div>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard
              icon={ShoppingCart}
              title="Bazaar & expenses"
              text="Food, gas, electricity, water, internet, rent, cleaning and staff salary, each logged with who paid."
              className="md:col-span-2"
              delay={100}
            >
              <ul className="space-y-2 text-xs" aria-hidden="true">
                {[
                  ["Rice sack & oil", "৳4,200", "w-[100%]"],
                  ["Chicken & beef", "৳3,500", "w-[83%]"],
                  ["Electricity", "৳2,500", "w-[60%]"],
                ].map(([item, amount, width]) => (
                  <li key={item} className="rounded-lg border border-white/[0.05] px-3 py-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{item}</span>
                      <span className="tabular-nums text-slate-200">{amount}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className={`h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 ${width}`} />
                    </div>
                  </li>
                ))}
              </ul>
            </FeatureCard>

            <FeatureCard
              icon={FileSpreadsheet}
              title="Itemized monthly bills"
              text="Meals, seat rent and each utility share on one invoice, with deposits and payments deducted."
              className="md:col-span-2"
            >
              <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px]" aria-hidden="true">
                {[
                  ["Meals", "৳3,683"],
                  ["Seat rent", "৳2,150"],
                  ["Utilities", "৳1,700"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-0.5">
                    <span className="text-slate-500">{label}</span>
                    <span className="tabular-nums text-slate-300">{value}</span>
                  </div>
                ))}
                <div className="mt-1.5 flex justify-between border-t border-dashed border-white/10 pt-1.5 font-semibold">
                  <span className="text-slate-300">Due</span>
                  <span className="tabular-nums text-amber-300">৳1,733</span>
                </div>
                <span className="absolute -right-2 -top-2 rotate-12 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                  PRINT
                </span>
              </div>
            </FeatureCard>

            <FeatureCard
              icon={Wallet}
              title="Payment tracking"
              text="Record what each member paid and see who is paid, partly paid or still due."
              className="md:col-span-2"
              delay={100}
            >
              <div className="grid grid-cols-2 gap-1.5" aria-hidden="true">
                {[
                  ["Cash", "bg-slate-400"],
                  ["Bank", "bg-sky-400"],
                  ["bKash", "bg-pink-500"],
                  ["Nagad", "bg-orange-500"],
                ].map(([method, dot]) => (
                  <span
                    key={method}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-2 text-xs text-slate-300 transition-colors hover:border-white/15"
                  >
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    {method}
                  </span>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard
              icon={BedDouble}
              title="Rooms & seats"
              text="Floors, rooms and seats with live occupancy, so you always know which seat is free."
              className="md:col-span-2"
              delay={200}
            >
              <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                {["101A", "101B", "102A", "102B", "103A", "201A", "201B", "202A"].map((seat, i) => {
                  const vacant = [5, 7].includes(i);
                  return (
                    <span
                      key={seat}
                      className={`rounded-md border px-1 py-1.5 text-center text-[10px] font-medium ${
                        vacant
                          ? "motion-loop border-emerald-400/40 bg-emerald-400/10 text-emerald-300 motion-safe:animate-[seatPulse_2.4s_ease-in-out_infinite]"
                          : "border-white/[0.06] bg-white/[0.02] text-slate-500"
                      }`}
                    >
                      {seat}
                    </span>
                  );
                })}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500" aria-hidden="true">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 2 seats free
              </p>
            </FeatureCard>

            <FeatureCard
              icon={Megaphone}
              title="Notice board"
              text="Announcements with a priority, so important notices don't get buried in the group chat."
              className="md:col-span-2"
            >
              <div className="space-y-1.5" aria-hidden="true">
                <div className="flex items-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-2.5 py-2 text-[11px]">
                  <span className="rounded bg-rose-400/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300">URGENT</span>
                  <span className="truncate text-slate-300">Gas line work on Friday</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-2 text-[11px]">
                  <span className="rounded bg-sky-400/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">INFO</span>
                  <span className="truncate text-slate-400">Bills are ready for October</span>
                </div>
              </div>
            </FeatureCard>

            <FeatureCard
              icon={MessageSquareWarning}
              title="Complaints desk"
              text="Members report problems like a leaking tap or a down router and follow them to resolved."
              className="md:col-span-2"
              delay={100}
            >
              <div className="flex items-center gap-1.5 text-[11px]" aria-hidden="true">
                {[
                  ["Pending", "bg-amber-400/10 text-amber-300 border-amber-400/20"],
                  ["In progress", "bg-sky-400/10 text-sky-300 border-sky-400/20"],
                  ["Resolved", "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"],
                ].map(([label, tone], i) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span
                      className={`motion-loop rounded-full border px-2.5 py-1 ${tone} motion-safe:animate-[statusCycle_4.5s_ease-in-out_infinite]`}
                      style={{ animationDelay: `${i * 1.5}s` }}
                    >
                      {label}
                    </span>
                    {i < 2 ? <ArrowRight className="h-3 w-3 text-slate-600" /> : null}
                  </span>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard
              icon={History}
              title="Audit log"
              text="Every change is recorded with who made it and when, so nobody wonders who edited the ledger."
              className="md:col-span-2"
              delay={200}
            >
              <div className="relative h-[104px] overflow-hidden [mask-image:linear-gradient(transparent,black_20%,black_80%,transparent)]" aria-hidden="true">
                <ul className="motion-loop space-y-1.5 motion-safe:animate-[tickerUp_12s_linear_infinite]">
                  {[...AUDIT_LINES, ...AUDIT_LINES].map((line, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[11px]">
                      <span className="truncate text-slate-400">
                        <span className="font-medium text-slate-200">{line.who}</span> {line.what}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-500">{line.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FeatureCard>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          aria-labelledby="how-title"
          className="relative scroll-mt-20 overflow-hidden border-t border-white/[0.06] py-24 sm:py-32"
        >
          <div aria-hidden="true" className="pointer-events-none absolute right-[-10%] top-1/3 h-[420px] w-[520px] rounded-full bg-emerald-500/[0.07] blur-[120px]" />
          <div className={`${container} relative grid items-start gap-14 lg:grid-cols-2 lg:gap-20`}>
            <div>
              <Reveal>
                <h2 id="how-title" className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  A fair bill, worked out from your own numbers
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
                  No fixed rate and no guesswork. The month&rsquo;s food bazaar is divided by the meals the mess
                  actually ate, so whoever eats more pays more.
                </p>
              </Reveal>

              <ol className="relative mt-12 space-y-10">
                {/* Connecting line with a travelling light */}
                <span aria-hidden="true" className="absolute bottom-4 left-[19px] top-4 w-px overflow-hidden bg-white/[0.08]">
                  <span className="motion-loop absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-emerald-400 to-transparent motion-safe:animate-[beamDown_3s_ease-in-out_infinite]" />
                </span>
                {STEPS.map((step, index) => (
                  <Reveal as="li" key={step.title} delay={index * 120} className="relative flex gap-5">
                    <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-[#0d1424] text-sm font-semibold text-emerald-400 shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]">
                      {index + 1}
                    </span>
                    <div className="pt-1.5">
                      <h3 className="font-semibold text-white">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{step.text}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>

            <Reveal delay={150} className="lg:sticky lg:top-24">
              <RateCalculator />
            </Reveal>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" aria-labelledby="roles-title" className={`${container} scroll-mt-20 py-24 sm:py-32`}>
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 id="roles-title" className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              The right access for every person
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
              Everyone sees the same ledger. What they can change depends on their role, and admins can grant extra
              access when someone needs to cover.
            </p>
          </Reveal>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {ROLES.map((role, index) => (
              <Reveal key={role.name} delay={index * 120}>
                <SpotlightCard
                  className={`h-full rounded-2xl border p-7 transition-colors duration-300 ${
                    role.featured
                      ? "border-emerald-400/25 bg-gradient-to-b from-emerald-500/[0.08] to-slate-900/40"
                      : "border-white/[0.07] bg-slate-900/40 hover:border-white/[0.14]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                    {role.featured ? (
                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">Runs the month</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{role.summary}</p>
                  <ul className="mt-6 space-y-3">
                    {role.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm text-slate-300">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                          <Check aria-hidden="true" className="h-3 w-3 text-emerald-400" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA with a rotating gradient border */}
        <section aria-labelledby="cta-title" className={`${container} pb-24 sm:pb-32`}>
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl p-px">
              <div
                aria-hidden="true"
                className="motion-loop absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[spinSlow_8s_linear_infinite]"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, rgba(52,211,153,0.9) 60deg, transparent 120deg, transparent 240deg, rgba(45,212,191,0.6) 300deg, transparent 360deg)",
                }}
              />
              <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#0b1220] px-6 py-16 text-center sm:px-12 sm:py-24">
                <div aria-hidden="true" className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[90px]" />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,black,transparent)]"
                  style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />
                <div className="relative">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-400/20 to-emerald-400/5 text-emerald-300 shadow-[0_0_40px_-6px_rgba(16,185,129,0.7)]">
                    <UtensilsCrossed aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <h2 id="cta-title" className="mt-7 text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                    Your account is already set up
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">
                    Your mess admin creates every member&rsquo;s account. Sign in with the email or phone number you
                    gave them.
                  </p>
                  <Link
                    href="/login"
                    className="group mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 text-sm font-semibold text-slate-950 shadow-[0_10px_30px_-8px_rgba(16,185,129,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400"
                  >
                    Sign in
                    <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/[0.06]">
        <div className={`${container} flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-400">
                <UtensilsCrossed aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-semibold text-white">Meal Manager</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">Trouble signing in? Ask your mess admin or manager to reset your password.</p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li>
              <a href="#features" className="text-slate-400 transition-colors hover:text-white">Features</a>
            </li>
            <li>
              <a href="#how-it-works" className="text-slate-400 transition-colors hover:text-white">How it works</a>
            </li>
            <li>
              <a href="#roles" className="text-slate-400 transition-colors hover:text-white">Roles</a>
            </li>
            <li>
              <Link href="/login" className="text-slate-400 transition-colors hover:text-white">Sign in</Link>
            </li>
          </ul>
        </div>
        <div className={`${container} border-t border-white/[0.04] py-6 text-xs text-slate-600`}>
          © {new Date().getFullYear()} Meal Manager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
