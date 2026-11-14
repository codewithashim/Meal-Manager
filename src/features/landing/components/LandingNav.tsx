"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, UtensilsCrossed, X } from "lucide-react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#roles", label: "Roles" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled || open ? "border-white/[0.08] bg-[#0b0f19]/85 backdrop-blur-xl" : "border-transparent bg-transparent"
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Meal Manager home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-400">
            <UtensilsCrossed aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">Meal Manager</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200"
          >
            Sign in
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-white md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <div id="mobile-menu" hidden={!open} className="border-t border-white/[0.06] px-4 pb-4 md:hidden">
        <ul className="pt-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-3 text-[15px] text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
