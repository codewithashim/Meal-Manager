// Mess operates on Bangladesh time; the server runs in UTC, so "current month" must be derived in this zone.
export const MESS_TIMEZONE = "Asia/Dhaka";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MESS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getMessDateStr(now: Date = new Date()): string {
  return dateFormatter.format(now); // en-CA yields YYYY-MM-DD
}

export function getMessMonthStr(now: Date = new Date()): string {
  return getMessDateStr(now).slice(0, 7);
}

export function getPreviousMonthStr(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7);
}

export function shiftMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + delta, 1)).toISOString().slice(0, 7);
}

export function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const MONTH_PARAM = "month";

// Reads ?month=YYYY-MM from a request. Invalid or future months fall back to the page default.
export function resolveMonthParam(value: string | string[] | undefined, fallback: string): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  const isValid = !!candidate && /^\d{4}-(0[1-9]|1[0-2])$/.test(candidate);
  return isValid && candidate <= getMessMonthStr() ? candidate : fallback;
}

export function getMonthRange(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59)),
  };
}
