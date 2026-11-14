"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Calls `onVisible` once when the element first scrolls into view. */
function useInView<T extends Element>(onVisible: () => void, rootMargin = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      onVisible();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible();
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

/** Fades and lifts its children in when they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const [visible, setVisible] = useState(false);
  const ref = useInView<HTMLDivElement>(() => setVisible(true));
  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      data-visible={visible ? "true" : "false"}
      className={className}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Counts a number up from zero when it scrolls into view. */
export function CountUp({
  value,
  prefix = "",
  decimals = 0,
  duration = 1400,
}: {
  value: number;
  prefix?: string;
  decimals?: number;
  duration?: number;
}) {
  const format = (n: number) =>
    `${prefix}${n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  const [text, setText] = useState(format(value));

  const ref = useInView<HTMLSpanElement>(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setText(format(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, "0px");

  return (
    <span ref={ref} className="tabular-nums">
      {text}
    </span>
  );
}

/** A card with a soft emerald spotlight that follows the cursor. */
export function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <article
      ref={ref}
      onPointerMove={(event) => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
        node.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
      }}
      className={`spotlight ${className}`}
    >
      {children}
    </article>
  );
}
