"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Calculator,
  FileSpreadsheet,
  History,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  ShieldAlert,
  ShoppingCart,
  Briefcase,
  UtensilsCrossed,
  Wallet,
  Eye,
  IdCard,
} from "lucide-react";
import MonthSelector from "@/shared/components/ui/MonthSelector";
import MemberInvoiceModal from "@/features/billing/components/MemberInvoiceModal";
import { setMonthInUrl } from "@/shared/hooks/useMonthParam";
import { formatMonthLabel } from "@/lib/month";
import { getProfileOverview } from "@/server/actions/profileActions";
import type { ProfileOverview } from "@/features/profile/services/profile.service";
import { ChangePasswordDrawer, EditProfileDrawer } from "@/features/profile/components/ProfileForms";

type Tab = "MEALS" | "EXPENSES" | "PAYMENTS" | "BILL" | "HISTORY";

interface ProfileClientPageProps {
  initialOverview: ProfileOverview;
  isOwnProfile: boolean;
}

const taka = (n: number) => `৳${Math.round(n).toLocaleString()}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const formatDay = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" });

export default function ProfileClientPage({ initialOverview, isOwnProfile }: ProfileClientPageProps) {
  const router = useRouter();
  const [overview, setOverview] = useState(initialOverview);
  const [month, setMonth] = useState(initialOverview.month);
  const [tab, setTab] = useState<Tab>("MEALS");
  const [loadError, setLoadError] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);

  const { user } = overview;

  const loadMonth = (monthStr: string) => {
    const request = ++requestId.current;
    setLoadError(false);
    startTransition(async () => {
      try {
        const res = await getProfileOverview(user.id, monthStr);
        if (request !== requestId.current) return;
        if (res) setOverview(res);
        else setLoadError(true);
      } catch {
        if (request === requestId.current) {
          setLoadError(true);
          toast.error("Could not load this month. Please try again.");
        }
      }
    });
  };

  const handleMonthChange = (monthStr: string) => {
    setMonth(monthStr);
    setMonthInUrl(monthStr);
    loadMonth(monthStr);
  };

  const handleProfileSaved = () => {
    loadMonth(month);
    router.refresh();
  };

  const { bill, estimate } = overview;
  const balance = bill ? bill.dueAmount : estimate.balance;

  const tabs: { id: Tab; label: string; icon: typeof UtensilsCrossed; count?: number }[] = [
    { id: "MEALS", label: "Meals", icon: UtensilsCrossed, count: overview.meals.records.length },
    { id: "EXPENSES", label: "Bazaar & Expenses", icon: ShoppingCart, count: overview.expenses.items.length },
    { id: "PAYMENTS", label: "Payments", icon: Wallet, count: overview.payments.items.length },
    { id: "BILL", label: "Monthly Bill", icon: FileSpreadsheet },
    { id: "HISTORY", label: "Bill History", icon: History },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-28 lg:pb-8">
      {!isOwnProfile && (
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to members
        </Link>
      )}

      {/* Identity card */}
      <section className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl font-extrabold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{user.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {user.role}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    user.status === "ACTIVE"
                      ? "bg-slate-800 text-slate-300 border-slate-700"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {user.status}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    user.mealStatus
                      ? "bg-slate-800 text-slate-300 border-slate-700"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  Meals {user.mealStatus ? "on" : "off"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Member since {formatDate(user.joiningDate.toString())}
                {user.leavingDate && ` · Left ${formatDate(user.leavingDate.toString())}`}
              </p>
            </div>
          </div>

          {isOwnProfile && (
            <div className="grid grid-cols-2 md:flex gap-2 shrink-0">
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              >
                <Pencil className="w-4 h-4" /> Edit profile
              </button>
              <button
                onClick={() => setIsPasswordOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:scale-95 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" /> Password
              </button>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
          <Detail icon={Mail} label="Email" value={user.email} />
          <Detail icon={Phone} label="Phone" value={user.phone} />
          <Detail
            icon={BedDouble}
            label="Room & seat"
            value={
              overview.seat
                ? `${overview.seat.roomName} · Seat ${overview.seat.seatNumber} (Floor ${overview.seat.floor})`
                : null
            }
            fallback="No seat assigned"
          />
          <Detail icon={Receipt} label="Monthly rent" value={taka(user.monthlyRent)} />
          <Detail icon={ShieldAlert} label="Emergency contact" value={user.emergencyContact} />
          <Detail icon={MapPin} label="Address" value={user.address} />
          <Detail icon={Briefcase} label="Occupation" value={user.occupation} />
          <Detail icon={IdCard} label="NID number" value={user.nidNumber} />
        </dl>
      </section>

      {/* Month bar */}
      <div className="glass-card rounded-2xl p-3.5 sm:p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            {isOwnProfile ? "Your" : `${user.name.split(" ")[0]}'s`} month at a glance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Meals, bazaar, payments and the bill all follow the month you pick.
          </p>
        </div>
        <MonthSelector
          value={month}
          onChange={handleMonthChange}
          disabled={isPending}
          className="w-full sm:w-auto justify-between"
        />
      </div>

      {loadError ? (
        <div role="alert" className="glass-card rounded-2xl p-8 text-center text-slate-400">
          Could not load {formatMonthLabel(month)}.{" "}
          <button type="button" onClick={() => loadMonth(month)} className="text-emerald-400 underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`} aria-busy={isPending}>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Kpi
              label="Meals"
              value={overview.meals.total.toLocaleString()}
              hint={`B ${overview.meals.breakfast} · L ${overview.meals.lunch} · D ${overview.meals.dinner}`}
              icon={UtensilsCrossed}
            />
            <Kpi
              label="Meal rate"
              value={`৳${overview.mealRate.toFixed(2)}`}
              hint={overview.isMonthClosed ? "Food spending ÷ mess meals for the month" : "Updates as bazaar and meals are logged"}
              icon={Calculator}
            />
            <Kpi
              label={overview.isMonthClosed ? "Total bill" : "Bill so far"}
              value={taka(bill ? bill.totalBill : estimate.total)}
              hint={
                bill
                  ? `Bazaar ${taka(bill.bazarDeposited)} · Paid ${taka(bill.totalPaid)}`
                  : `Bazaar ${taka(overview.expenses.bazaarDeposited)} · Paid ${taka(overview.payments.totalPaid)}`
              }
              icon={FileSpreadsheet}
            />
            <Kpi
              label={balance < 0 ? "Refund due" : "Left to pay"}
              value={taka(Math.abs(balance))}
              hint={
                overview.totalOutstanding > 0
                  ? `${taka(overview.totalOutstanding)} outstanding across all bills`
                  : "No outstanding bills"
              }
              icon={Wallet}
              tone={balance > 0 ? "due" : "ok"}
            />
          </div>

          {/* Tabs */}
          <div role="tablist" className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                  tab === id
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
                {count !== undefined && (
                  <span className={`text-[10px] px-1.5 rounded-md ${tab === id ? "bg-white/20" : "bg-slate-800"}`}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "MEALS" && (
            <DataTable
              empty={`No meals recorded in ${formatMonthLabel(month)}.`}
              headers={["Day", "Breakfast", "Lunch", "Dinner", "Total", "Note"]}
              rows={overview.meals.records.map((r) => [
                <span key="d" className="font-semibold text-white">{formatDay(r.date)}</span>,
                r.breakfast,
                r.lunch,
                r.dinner,
                <span key="t" className="font-bold text-emerald-400">{r.totalMeals}</span>,
                <span key="n" className="text-slate-400">{r.note || "—"}</span>,
              ])}
              footer={["Total", overview.meals.breakfast, overview.meals.lunch, overview.meals.dinner, overview.meals.total, `${overview.meals.activeDays} active days`]}
            />
          )}

          {tab === "EXPENSES" && (
            <DataTable
              empty={`No bazaar or expenses logged in ${formatMonthLabel(month)}.`}
              headers={["Date", "Title", "Category", "Amount"]}
              rows={overview.expenses.items.map((e) => [
                <span key="d" className="font-mono text-xs text-slate-400">{e.date}</span>,
                <div key="t">
                  <div className="font-semibold text-white">{e.title}</div>
                  {e.description && <div className="text-xs text-slate-400">{e.description}</div>}
                </div>,
                <span key="c" className="text-xs text-slate-300">{e.category === "FOOD" ? "Food & Bazaar" : e.category.replace("_", " ")}</span>,
                <span key="a" className="font-bold text-emerald-400">{taka(e.amount)}</span>,
              ])}
              footer={["", "Bazaar counted toward your bill", "", taka(overview.expenses.bazaarDeposited)]}
            />
          )}

          {tab === "PAYMENTS" && (
            <DataTable
              empty={`No payments recorded for ${formatMonthLabel(month)}.`}
              headers={["Date", "Method", "Reference", "Amount"]}
              rows={overview.payments.items.map((p) => [
                <span key="d" className="font-mono text-xs text-slate-400">{p.date}</span>,
                <span key="m" className="font-semibold text-white">{p.paymentMethod}</span>,
                <span key="r" className="text-xs text-slate-400">{p.transactionId || p.note || "—"}</span>,
                <span key="a" className="font-bold text-emerald-400">{taka(p.amount)}</span>,
              ])}
              footer={["", "", "Total paid", taka(overview.payments.totalPaid)]}
            />
          )}

          {tab === "BILL" && (
            <section className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
              {bill ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">Bill for {formatMonthLabel(month)}</h3>
                      <p className="text-xs text-slate-400">
                        {overview.isMonthClosed
                          ? `Month closed · last updated ${formatDate(bill.updatedAt.toString())}`
                          : "Month in progress · updates automatically as meals, bazaar, bills and payments are logged"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowInvoice(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" /> View & print slip
                    </button>
                  </div>
                  <Breakdown
                    lines={[
                      [`Meals (${bill.totalMeals} × ৳${bill.mealRate.toFixed(2)})`, bill.mealCost],
                      ["Room rent", bill.roomRent],
                      ["Utilities & maid", bill.utilityShare],
                      ["Other charges", bill.otherCharges],
                    ]}
                    total={["Total bill", bill.totalBill]}
                    credits={[
                      ["Bazaar deposited", bill.bazarDeposited],
                      ["Paid", bill.totalPaid],
                    ]}
                    balance={bill.dueAmount}
                  />
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-base font-bold text-white">No bill for {formatMonthLabel(month)}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      This account isn&apos;t billed for this month (admins, or before joining). Meals and bazaar are
                      shown for reference.
                    </p>
                  </div>
                  <Breakdown
                    lines={[
                      [`Meals (${overview.meals.total} × ৳${overview.mealRate.toFixed(2)})`, estimate.mealCost],
                      ["Room rent", estimate.roomRent],
                    ]}
                    total={["Estimated so far", estimate.total]}
                    credits={[
                      ["Bazaar deposited", overview.expenses.bazaarDeposited],
                      ["Paid", overview.payments.totalPaid],
                    ]}
                    balance={estimate.balance}
                  />
                </>
              )}
            </section>
          )}

          {tab === "HISTORY" && (
            <DataTable
              empty="No bills yet."
              headers={["Month", "Meals", "Total bill", "Bazaar + paid", "Balance", "Status"]}
              rows={overview.billHistory.map((b) => [
                <button
                  key="m"
                  onClick={() => {
                    handleMonthChange(b.month);
                    setTab("BILL");
                  }}
                  className={`font-semibold hover:underline cursor-pointer ${b.month === month ? "text-emerald-400" : "text-white"}`}
                >
                  {formatMonthLabel(b.month)}
                </button>,
                b.totalMeals,
                taka(b.totalBill),
                taka(b.bazarDeposited + b.totalPaid),
                <span key="b" className={b.dueAmount > 0 ? "font-bold text-rose-400" : "font-bold text-emerald-400"}>
                  {b.dueAmount < 0 ? `Refund ${taka(-b.dueAmount)}` : b.dueAmount === 0 ? "Settled" : taka(b.dueAmount)}
                </span>,
                <span key="s" className="text-xs text-slate-400">{b.status.replace("_", " ")}</span>,
              ])}
              footer={
                overview.totalOutstanding > 0
                  ? ["Outstanding", "", "", "", taka(overview.totalOutstanding), ""]
                  : undefined
              }
            />
          )}
        </div>
      )}

      {isOwnProfile && (
        <>
          {/* Mounted only while open, so each opening starts from the saved values. */}
          {isEditOpen && <EditProfileDrawer
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSaved={handleProfileSaved}
            initial={{
              name: user.name,
              phone: user.phone ?? "",
              emergencyContact: user.emergencyContact ?? "",
              address: user.address ?? "",
              occupation: user.occupation ?? "",
            }}
          />}
          {isPasswordOpen && <ChangePasswordDrawer isOpen onClose={() => setIsPasswordOpen(false)} />}
        </>
      )}

      <MemberInvoiceModal isOpen={showInvoice && !!bill} onClose={() => setShowInvoice(false)} bill={bill} />
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  fallback = "Not provided",
}: {
  icon: typeof Mail;
  label: string;
  value: string | null | undefined;
  fallback?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
        <dd className={`text-sm break-words ${value ? "text-slate-200" : "text-slate-500 italic"}`}>{value || fallback}</dd>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Mail;
  tone?: "due" | "ok";
}) {
  const valueColor = tone === "due" ? "text-rose-400" : tone === "ok" ? "text-emerald-400" : "text-white";
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
      </div>
      <div className={`text-xl sm:text-2xl font-extrabold mt-2 ${valueColor}`}>{value}</div>
      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{hint}</p>
    </div>
  );
}

function DataTable({
  headers,
  rows,
  footer,
  empty,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  footer?: React.ReactNode[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <div className="glass-card rounded-2xl p-8 text-center text-slate-500 border border-slate-800">{empty}</div>;
  }
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              {headers.map((h, i) => (
                <th key={h} className={`px-4 sm:px-5 py-3 whitespace-nowrap ${i === headers.length - 1 && i > 0 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.map((cells, r) => (
              <tr key={r} className="hover:bg-slate-800/40 transition-colors">
                {cells.map((c, i) => (
                  <td key={i} className={`px-4 sm:px-5 py-3 whitespace-nowrap ${i === cells.length - 1 && i > 0 ? "text-right" : ""}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot className="bg-slate-900/70 border-t border-slate-800 text-xs font-bold text-white">
              <tr>
                {footer.map((c, i) => (
                  <td key={i} className={`px-4 sm:px-5 py-3 whitespace-nowrap ${i === footer.length - 1 && i > 0 ? "text-right" : ""}`}>
                    {c}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function Breakdown({
  lines,
  total,
  credits,
  balance,
}: {
  lines: [string, number][];
  total: [string, number];
  credits: [string, number][];
  balance: number;
}) {
  return (
    <dl className="rounded-xl bg-slate-950/60 border border-slate-800 divide-y divide-slate-800 text-sm">
      {lines.map(([label, amount]) => (
        <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
          <dt className="text-slate-400">{label}</dt>
          <dd className="text-slate-200 font-semibold">{taka(amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 px-4 py-2.5 bg-slate-900/60">
        <dt className="font-bold text-white">{total[0]}</dt>
        <dd className="font-extrabold text-white">{taka(total[1])}</dd>
      </div>
      {credits.map(([label, amount]) => (
        <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
          <dt className="text-slate-400">− {label}</dt>
          <dd className="text-emerald-400 font-semibold">{taka(amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 px-4 py-3 bg-slate-900/60">
        <dt className="font-bold text-white">{balance < 0 ? "Refund due" : balance === 0 ? "Settled" : "Left to pay"}</dt>
        <dd className={`font-extrabold ${balance > 0 ? "text-rose-400" : "text-emerald-400"}`}>{taka(Math.abs(balance))}</dd>
      </div>
    </dl>
  );
}
