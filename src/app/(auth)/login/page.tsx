import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Login | MessMate Boarding Management",
  description: "Sign in to access your mess account, meals, bills, and payments.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Decor */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <Suspense fallback={<div className="text-slate-400 text-xs font-semibold animate-pulse">Loading login form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
