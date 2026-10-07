"use client";

import { useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  position?: "bottom-mobile-right-desktop" | "bottom-mobile-center-desktop" | "right";
}

export default function AppDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "xl",
  position = "bottom-mobile-right-desktop",
}: AppDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  const isDesktopRight = position === "bottom-mobile-right-desktop" || position === "right";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center print:p-0 print:static print:block">
      
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn print:hidden"
        onClick={onClose}
      />

      {/* Drawer Body Container: Bottom Sheet on Mobile, Right Slide-over / Centered on Desktop */}
      <div
        className={`relative w-full ${widthClasses} z-10 glass-drawer text-slate-100 shadow-2xl flex flex-col transition-all print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 print:bg-white print:text-black ${
          isDesktopRight
            ? "rounded-t-3xl md:rounded-t-none md:rounded-l-3xl max-h-[88vh] md:max-h-full md:h-full md:ml-auto animate-slideUp md:animate-slideLeft border-t md:border-t-0 md:border-l border-slate-700/80"
            : "rounded-t-3xl md:rounded-3xl max-h-[90vh] md:mx-auto animate-slideUp md:animate-scaleUp border-t md:border border-slate-700/80"
        }`}
      >
        {/* Mobile Pull/Drag Bar Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2.5 shrink-0 md:hidden print:hidden" />

        {/* Drawer Header */}
        {(title || subtitle || icon) && (
          <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-800 shrink-0 print:pb-2">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer print:hidden"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 print:p-0">
          {children}
        </div>

        {/* Drawer Footer */}
        {footer && (
          <div className="px-5 sm:px-7 py-4 border-t border-slate-800 bg-slate-950/80 rounded-b-3xl shrink-0 print:hidden">
            {footer}
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
