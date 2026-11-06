"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/server/actions/authActions";
import { ArrowRight, ShieldCheck, AlertCircle, Loader2, User, LockKeyhole, Eye, EyeOff, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import styles from "./login-form.module.css";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginAction({ identifier, password });
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success("Successfully logged in!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.intro}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <UtensilsCrossed aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <p className={styles.brandName}>Meal Manager</p>
            <p className={styles.brandCaption}>Residential mess portal</p>
          </div>
        </div>
        <p className={styles.eyebrow}>Your account</p>
        <h1 className={styles.title}>
          Welcome back
        </h1>
        <p className={styles.description}>
          Sign in to manage your meals, bills, and account.
        </p>
      </div>

      {error && (
        <div id="login-error" role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div>
          <label htmlFor="login-identifier" className={styles.label}>
            Email or phone number
          </label>
          <div className={styles.inputWrapper}>
            <User aria-hidden="true" className={styles.inputIcon} />
            <input
              id="login-identifier"
              name="username"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or phone"
              className={styles.input}
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className={styles.label}>
            Password
          </label>
          <div className={styles.inputWrapper}>
            <LockKeyhole aria-hidden="true" className={styles.inputIcon} />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${styles.input} ${styles.passwordInput}`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-controls="login-password"
              onClick={() => setShowPassword((visible) => !visible)}
              className={styles.toggle}
            >
              {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submit}
        >
          {loading ? (
            <><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> Signing in...</>
          ) : (
            <>Sign in <ArrowRight aria-hidden="true" className="h-4 w-4" /></>
          )}
        </button>
      </form>
      <div className={styles.footer}>
        <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-400" />
        Your account, all in one place
      </div>
    </div>
  );
}
