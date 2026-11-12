"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MONTH_PARAM } from "@/lib/month";

// Pages that show month-based data and should keep the selected month when navigated between.
const MONTH_ROUTES = ["/dashboard", "/meals", "/expenses", "/bills", "/payments"];

export function useMonthHref() {
  const searchParams = useSearchParams();
  const month = searchParams.get(MONTH_PARAM);

  return useCallback(
    (href: string) => (month && MONTH_ROUTES.includes(href) ? `${href}?${MONTH_PARAM}=${month}` : href),
    [month]
  );
}

// Updates the month in the address bar without a server round-trip, so the URL stays shareable and navigation keeps it.
export function setMonthInUrl(monthStr: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(MONTH_PARAM, monthStr);
  window.history.replaceState(window.history.state, "", url);
}
