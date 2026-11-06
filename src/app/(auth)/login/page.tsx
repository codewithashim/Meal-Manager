import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { CalendarDays, ReceiptText, UtensilsCrossed } from "lucide-react";

export const metadata = {
  title: "Login | Meal Manager System",
  description: "Sign in to access your meal management account, meals, bills, and payments.",
};

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-screen min-h-dvh w-full flex-1 items-center overflow-x-clip bg-slate-950 px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-teal-600/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="hidden max-w-xl lg:block">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-300">
            <UtensilsCrossed aria-hidden="true" className="h-4 w-4" />
            MEAL MANAGER
          </div>
          <p className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Your mess, made <span className="text-emerald-400">simpler.</span>
          </p>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            Keep your daily meals and monthly bills organized in one convenient place.
          </p>
          <div className="mt-10 grid gap-3">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><CalendarDays aria-hidden="true" className="h-5 w-5" /></span>
              <div><p className="text-sm font-semibold text-slate-100">Daily meal tracking</p><p className="mt-1 text-sm text-slate-400">Keep up with your meal entries.</p></div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400"><ReceiptText aria-hidden="true" className="h-5 w-5" /></span>
              <div><p className="text-sm font-semibold text-slate-100">Bills in one place</p><p className="mt-1 text-sm text-slate-400">Review your monthly bills and payments.</p></div>
            </div>
          </div>
        </div>
        <div className="flex w-full justify-center lg:justify-end">
          <Suspense fallback={<div role="status" className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-400">Loading sign-in form...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
