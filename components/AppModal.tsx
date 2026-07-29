"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

type AppModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerHero?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  size?: "sm" | "md" | "lg";
};

export default function AppModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerHero,
  onSubmit,
  size = "md",
}: AppModalProps) {
  // Lock body scroll when modal is open
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

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "md:max-w-md",
    md: "md:max-w-lg",
    lg: "md:max-w-2xl",
  };

  const ContentWrapper = onSubmit ? "form" : "div";
  const wrapperProps = onSubmit ? { onSubmit } : {};

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <ContentWrapper
        {...wrapperProps}
        className={`bg-white dark:bg-zinc-900 w-full ${sizeClasses[size]} rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300`}
      >
        {/* Sticky Header */}
        <div className="flex-shrink-0 bg-blue-600 text-white rounded-t-3xl md:rounded-t-none">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
          {headerHero && <div className="flex-shrink-0">{headerHero}</div>}
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div
            className="flex-shrink-0 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 pt-4 sticky bottom-0 z-10"
            style={{
              paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
            }}
          >
            {footer}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
}
