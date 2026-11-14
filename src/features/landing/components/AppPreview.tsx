import {
  BedDouble,
  CalendarDays,
  ChevronDown,
  Coffee,
  FileSpreadsheet,
  LayoutDashboard,
  Moon,
  ShoppingCart,
  Sun,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { CountUp } from "./motion";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Meals", icon: UtensilsCrossed },
  { label: "Bazaar", icon: ShoppingCart },
  { label: "Bills", icon: FileSpreadsheet },
  { label: "Payments", icon: Wallet },
  { label: "Rooms", icon: BedDouble },
];

const KPIS = [
  { label: "Meal rate", value: 47.83, decimals: 2, prefix: "৳", note: "per meal" },
  { label: "Mess meals", value: 345, decimals: 0, prefix: "", note: "this month" },
  { label: "Food bazaar", value: 16500, decimals: 0, prefix: "৳", note: "6 entries" },
  { label: "Your due", value: 1733, decimals: 0, prefix: "৳", note: "after deposits", highlight: true },
];

const TODAY = [
  { name: "Rakib", b: 1, l: 1, d: 1 },
  { name: "Tanvir", b: 0.5, l: 1, d: 1 },
  { name: "Sabbir", b: 1, l: 1, d: 0 },
  { name: "Imran", b: 1, l: 1.5, d: 1 },
  { name: "You", b: 1, l: 1, d: 1 },
];

const BILL = [
  { label: "Meals (77 × ৳47.83)", value: "৳3,683" },
  { label: "Seat rent", value: "৳2,150" },
  { label: "Utilities & khala", value: "৳1,700" },
  { label: "Bazaar deposited", value: "−৳2,800", muted: true },
  { label: "Paid via bKash", value: "−৳3,000", muted: true },
];

// Meals eaten by the whole mess on each day so far (sample).
const DAILY = [14, 15, 13.5, 15, 12, 14.5, 15, 13, 14, 15, 11.5, 14, 15, 14.5, 13, 15, 14, 12.5, 15, 14.5, 15, 13.5, 14, 15];

const CHIPS: { icon: LucideIcon; title: string; detail: string; tone: string; position: string; delay: number }[] = [
  {
    icon: ShoppingCart,
    title: "Bazaar added",
    detail: "Chicken & beef, ৳3,500",
    tone: "text-sky-300 bg-sky-400/10 border-sky-400/20",
    position: "-left-24 top-28",
    delay: 900,
  },
  {
    icon: Wallet,
    title: "Payment received",
    detail: "bKash, ৳3,000 from Tanvir",
    tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    position: "-right-24 top-56",
    delay: 1200,
  },
  {
    icon: TrendingUp,
    title: "Meal rate updated",
    detail: "৳47.83 per meal",
    tone: "text-amber-300 bg-amber-400/10 border-amber-400/20",
    position: "-left-20 bottom-20",
    delay: 1500,
  },
];

/** A sample-data rendering of the Meal Manager dashboard for the hero. */
export function AppPreview() {
  const max = Math.max(...DAILY);

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Glow behind the window */}
      <div aria-hidden="true" className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[40px] bg-gradient-to-b from-emerald-500/20 via-teal-500/5 to-transparent blur-3xl" />

      {/* Floating activity notifications (desktop) */}
      {CHIPS.map(({ icon: Icon, title, detail, tone, position, delay }, index) => (
        <div
          key={title}
          aria-hidden="true"
          className={`absolute z-20 hidden xl:block ${position} motion-safe:animate-[chipIn_700ms_cubic-bezier(0.16,1,0.3,1)_both]`}
          style={{ animationDelay: `${delay}ms` }}
        >
          <div
            className="motion-loop flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 py-2.5 pl-2.5 pr-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md motion-safe:animate-[floatY_6s_ease-in-out_infinite]"
            style={{ animationDelay: `${index * 1.3}s` }}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tone}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs font-semibold text-white">{title}</span>
              <span className="block text-[11px] text-slate-400">{detail}</span>
            </span>
          </div>
        </div>
      ))}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-[0_50px_140px_-30px_rgba(0,0,0,0.9)] ring-1 ring-black/40">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-slate-950/70 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 hidden rounded-md bg-white/[0.04] px-3 py-1 text-[11px] text-slate-500 sm:block">
            Meal Manager / Dashboard
          </span>
          <span className="ml-auto rounded-md border border-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-500">
            Sample data
          </span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden w-44 shrink-0 border-r border-white/[0.06] p-3 md:block">
            <ul className="space-y-0.5">
              {NAV.map(({ label, icon: Icon, active }) => (
                <li
                  key={label}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${
                    active ? "bg-emerald-500/10 font-medium text-emerald-400" : "text-slate-500"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {label}
                </li>
              ))}
            </ul>
          </aside>

          {/* Main */}
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                Overview
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="motion-loop absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-[livePing_1.6s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              </p>
              <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1 text-[11px] text-slate-400">
                <CalendarDays aria-hidden="true" className="h-3 w-3" />
                November 2026
                <ChevronDown aria-hidden="true" className="h-3 w-3" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {KPIS.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-xl border p-3 ${
                    kpi.highlight ? "border-amber-400/25 bg-amber-400/[0.06]" : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <p className="text-[11px] text-slate-500">{kpi.label}</p>
                  <p className={`mt-1 text-lg font-semibold tracking-tight ${kpi.highlight ? "text-amber-300" : "text-white"}`}>
                    <CountUp value={kpi.value} prefix={kpi.prefix} decimals={kpi.decimals} />
                  </p>
                  <p className="text-[10px] text-slate-600">{kpi.note}</p>
                </div>
              ))}
            </div>

            {/* Daily meals chart */}
            <div className="mt-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-300">Mess meals per day</p>
                <p className="text-[10px] text-slate-500">Nov 1 to 24</p>
              </div>
              <div className="flex h-16 items-end gap-[3px] sm:h-20 sm:gap-1" aria-hidden="true">
                {DAILY.map((value, index) => (
                  <span
                    key={index}
                    className={`flex-1 origin-bottom rounded-t-[3px] motion-safe:animate-[barGrow_900ms_cubic-bezier(0.16,1,0.3,1)_both] ${
                      index === DAILY.length - 1 ? "bg-emerald-400" : "bg-emerald-400/30"
                    }`}
                    style={{ height: `${(value / max) * 100}%`, animationDelay: `${600 + index * 35}ms` }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-2.5 grid gap-2.5 lg:grid-cols-5">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 lg:col-span-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-300">Today&rsquo;s meals</p>
                  <div className="flex gap-3 text-slate-500">
                    <Coffee aria-hidden="true" className="h-3.5 w-3.5" />
                    <Sun aria-hidden="true" className="h-3.5 w-3.5" />
                    <Moon aria-hidden="true" className="h-3.5 w-3.5" />
                  </div>
                </div>
                <table className="w-full text-[11px]">
                  <thead className="sr-only">
                    <tr>
                      <th>Member</th>
                      <th>Breakfast</th>
                      <th>Lunch</th>
                      <th>Dinner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TODAY.map((row) => (
                      <tr key={row.name} className="border-t border-white/[0.04]">
                        <td className={`py-1.5 ${row.name === "You" ? "font-medium text-emerald-400" : "text-slate-400"}`}>{row.name}</td>
                        {[row.b, row.l, row.d].map((value, index) => (
                          <td key={index} className="w-10 py-1.5 text-right tabular-nums text-slate-300">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 lg:col-span-2">
                <p className="mb-2 text-xs font-medium text-slate-300">Your bill</p>
                <ul className="space-y-1.5 text-[11px]">
                  {BILL.map((line) => (
                    <li key={line.label} className="flex justify-between gap-2">
                      <span className="text-slate-500">{line.label}</span>
                      <span className={`tabular-nums ${line.muted ? "text-slate-500" : "text-slate-300"}`}>{line.value}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                  <span className="text-[11px] font-medium text-slate-300">Due</span>
                  <span className="text-sm font-semibold tabular-nums text-amber-300">৳1,733</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
