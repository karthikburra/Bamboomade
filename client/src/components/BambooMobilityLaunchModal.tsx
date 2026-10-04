import React, { useState, useEffect } from "react";
import { X, ExternalLink, Sparkles, ShieldCheck, Bike, Zap, ArrowRight, Eye, Globe, Leaf, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Tri-wheel stability glyph: a triangle frame with a wheel at each corner (lucide-style stroke icon). */
const TriWheelIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 6.5 6.4 16.2M12 6.5l5.6 9.7M7.5 18.5h9" />
    <circle cx="12" cy="4.5" r="2.5" />
    <circle cx="5" cy="18.5" r="2.5" />
    <circle cx="19" cy="18.5" r="2.5" />
  </svg>
);

interface BambooMobilityLaunchModalProps {
  defaultOpen?: boolean;
}

type CurrencyType = "SGD" | "INR" | "USD";

interface CurrencyOption {
  currency: CurrencyType;
  label: string;
  name: string;
  symbol: string;
  flag: string;
  buttonText: string;
  buttonId: string;
  directUrl: string;
  description: string;
  badge: string;
}

const PAYMENT_OPTIONS: Record<CurrencyType, CurrencyOption> = {
  SGD: {
    currency: "SGD",
    label: "SGD (S$)",
    name: "Singapore Dollar",
    symbol: "S$",
    flag: "🇸🇬",
    buttonText: "Pay in SGD",
    buttonId: "pl_TjhJzcuPJ23SV8",
    directUrl: "https://razorpay.com/payment-button/pl_TjhJzcuPJ23SV8/view",
    description: "Support international rollout & get special launch discount in Singapore Dollars",
    badge: "International",
  },
  INR: {
    currency: "INR",
    label: "INR (₹)",
    name: "Indian Rupee",
    symbol: "₹",
    flag: "🇮🇳",
    buttonText: "Pay in INR",
    buttonId: "pl_TjhR7PGDDKFDIH",
    directUrl: "https://razorpay.com/payment-button/pl_TjhR7PGDDKFDIH/view",
    badge: "India",
    description: "Support India launch & get special launch discount in Indian Rupees",
  },
  USD: {
    currency: "USD",
    label: "USD ($)",
    name: "US Dollar",
    symbol: "$",
    flag: "🇺🇸",
    buttonText: "Pay in USD",
    buttonId: "pl_TjmS8c30f59XeK",
    directUrl: "https://razorpay.com/payment-button/pl_TjmS8c30f59XeK/view",
    badge: "Global / US",
    description: "Support global rollout & get special launch discount in US Dollars",
  },
};

export const BambooMobilityLaunchModal: React.FC<BambooMobilityLaunchModalProps> = ({
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Auto open after a slight delay on initial visit unless user has dismissed in this session
  useEffect(() => {
    const hasDismissed = sessionStorage.getItem("bamboomade_mobility_popup_closed");
    if (!hasDismissed || defaultOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [defaultOpen]);

  // Listen for custom trigger to open modal from anywhere in the app
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-bamboo-mobility-modal", handleOpen);
    return () => {
      window.removeEventListener("open-bamboo-mobility-modal", handleOpen);
    };
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCurrencyDialog) {
          setShowCurrencyDialog(false);
        } else if (isZoomed) {
          setIsZoomed(false);
        } else if (isOpen) {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isZoomed, showCurrencyDialog]);

  const handleClose = () => {
    setIsOpen(false);
    setShowCurrencyDialog(false);
    sessionStorage.setItem("bamboomade_mobility_popup_closed", "true");
  };

  const handleProceedPayment = (currency: CurrencyType) => {
    const config = PAYMENT_OPTIONS[currency];
    window.open(config.directUrl, "_blank", "noopener,noreferrer");
    setShowCurrencyDialog(false);
  };

  return (
    <>
      {/* Floating launcher button (accessible after closing or anytime) */}
      <div className="fixed bottom-4 sm:bottom-6 left-3 sm:left-6 z-40 max-w-[calc(100vw-24px)]">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 sm:gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-green-600 to-amber-600 px-3 sm:px-4 py-2 sm:py-2.5 text-white shadow-xl shadow-emerald-950/40 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/25 active:scale-95 border border-emerald-400/40 whitespace-nowrap shrink-0"
          aria-label="View E Bamboo Bike Launch & Crowd funding"
        >
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <Bike className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-200 transition-transform group-hover:rotate-12 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap">
            E Bamboo Bike • <span className="text-amber-300 underline underline-offset-2">Crowd funding</span>
          </span>
        </button>
      </div>

      {/* Main Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={handleClose}
          />

          {/* Modal Container - Compact on mobile */}
          <div
            className="relative z-10 w-full max-w-sm sm:max-w-5xl rounded-2xl bg-neutral-900/95 border border-neutral-800 shadow-2xl text-neutral-100 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[86vh] sm:max-h-[92vh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 px-3 sm:px-6 py-2 sm:py-3 bg-neutral-950/60 gap-2 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-emerald-400 truncate">
                  Crowd funding open • Special launch discount
                </span>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors focus:outline-none shrink-0"
                aria-label="Close modal"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="overflow-y-auto p-3 sm:p-6 md:p-8 space-y-3 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 lg:gap-8 items-start">
                {/* Left Column: Launch Poster Image - compact on mobile */}
                <div className="lg:col-span-6 flex flex-col items-center">
                  <div className="group relative w-full overflow-hidden rounded-xl border border-emerald-900/40 bg-neutral-950 shadow-md">
                    <img
                      src="/images/bamboo-mobility-banner.jpg"
                      srcSet="/images/bamboo-mobility-banner-mobile.jpg 800w, /images/bamboo-mobility-banner.jpg 1024w"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      alt="E Bamboo Bike - Ride Carry Explore - Launching Soon"
                      width={1024}
                      height={385}
                      className="w-full h-auto object-cover mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                    />
                    {/* Zoom / Full Preview Overlay Button */}
                    <button
                      onClick={() => setIsZoomed(true)}
                      className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 text-[10px] sm:text-xs font-medium text-neutral-200 backdrop-blur-md opacity-90 transition-opacity hover:opacity-100 hover:text-white border border-neutral-700/60"
                    >
                      <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                      Fullscreen
                    </button>
                  </div>
                  <p className="mt-1 text-center text-[10px] sm:text-xs text-neutral-400 hidden sm:block">
                    E Bamboo Bike • Designed for a Sustainable Tomorrow
                  </p>
                </div>

                {/* Right Column: E Bamboo Bike & Currency Selector Panel */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-3 sm:space-y-5">
                  {/* Headline & Badges */}
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-300 mb-1.5 sm:mb-2.5">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      Crowd funding open to get Special launch discount
                    </div>

                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
                      E Bamboo Bike
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-amber-300/90 mt-0.5 sm:mt-1">
                      RIDE • CARRY • EXPLORE — One Design. Many Possibilities.
                    </p>
                    <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-2 sm:line-clamp-none">
                      Experience the world&apos;s most innovative foldable E Bamboo Bike. Crafted with sustainable bamboo composite, tri-wheel stability, and multi-modal portability.
                    </p>
                  </div>

                  {/* Feature Highlights Grid */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-neutral-800/60 p-2 sm:p-2.5 border border-neutral-700/50">
                      <div className="rounded-md bg-emerald-900/50 p-1 sm:p-1.5 text-emerald-400 shrink-0">
                        <Leaf className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-200 text-[11px] sm:text-xs">Sustainable Bamboo</div>
                        <div className="text-[10px] text-neutral-400 hidden sm:block">Eco-conscious frame</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-neutral-800/60 p-2 sm:p-2.5 border border-neutral-700/50">
                      <div className="rounded-md bg-amber-900/50 p-1 sm:p-1.5 text-amber-400 shrink-0">
                        <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-200 text-[11px] sm:text-xs">Electric Assist</div>
                        <div className="text-[10px] text-neutral-400 hidden sm:block">Effortless commutes</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-neutral-800/60 p-2 sm:p-2.5 border border-neutral-700/50">
                      <div className="rounded-md bg-sky-900/50 p-1 sm:p-1.5 text-sky-400 shrink-0">
                        <PackageOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-200 text-[11px] sm:text-xs">Ultra-Compact Fold</div>
                        <div className="text-[10px] text-neutral-400 hidden sm:block">Bus, Train & Car Boot</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-neutral-800/60 p-2 sm:p-2.5 border border-neutral-700/50">
                      <div className="rounded-md bg-purple-900/50 p-1 sm:p-1.5 text-purple-400 shrink-0">
                        <TriWheelIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-200 text-[11px] sm:text-xs">Tri-Wheel Stability</div>
                        <div className="text-[10px] text-neutral-400 hidden sm:block">Superior safe balance</div>
                      </div>
                    </div>
                  </div>

                  {/* Action & Launch Button Section */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 sm:p-5">
                    <Button
                      type="button"
                      onClick={() => setShowCurrencyDialog(true)}
                      className="w-full h-10 sm:h-12 text-xs sm:text-base font-semibold bg-gradient-to-r from-emerald-500 via-emerald-600 to-amber-600 hover:from-emerald-600 hover:to-amber-700 text-white shadow-lg shadow-emerald-950/50 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 rounded-xl"
                    >
                      <span>Help us launch</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>

                    {/* Trust and Security Footnote */}
                    <div className="mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-neutral-900/80 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-neutral-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>100% Secure Payment via Razorpay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Currency Selection Dialog (triggered after clicking 'Help us launch') */}
      {showCurrencyDialog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowCurrencyDialog(false)}
        >
          <div
            className="w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-4 sm:p-6 shadow-2xl text-neutral-100 space-y-3 sm:space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
                Select Payment Currency
              </h4>
              <button
                onClick={() => setShowCurrencyDialog(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300">
              Please choose whether you would like to complete your payment in SGD, INR, or USD to continue:
            </p>

            <div className="grid grid-cols-1 gap-2 sm:gap-3 pt-1">
              <button
                onClick={() => handleProceedPayment("SGD")}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-neutral-800 hover:border-emerald-500 bg-neutral-950 hover:bg-emerald-950/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl shrink-0">🇸🇬</span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300">
                      Pay in SGD
                    </div>
                    <div className="text-[11px] sm:text-xs text-neutral-400">Singapore Dollar (S$)</div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-emerald-400 shrink-0" />
              </button>

              <button
                onClick={() => handleProceedPayment("INR")}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-neutral-800 hover:border-emerald-500 bg-neutral-950 hover:bg-emerald-950/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl shrink-0">🇮🇳</span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300">
                      Pay in INR
                    </div>
                    <div className="text-[11px] sm:text-xs text-neutral-400">Indian Rupee (₹) • India</div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-emerald-400 shrink-0" />
              </button>

              <button
                onClick={() => handleProceedPayment("USD")}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-neutral-800 hover:border-emerald-500 bg-neutral-950 hover:bg-emerald-950/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl shrink-0">🇺🇸</span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300">
                      Pay in USD
                    </div>
                    <div className="text-[11px] sm:text-xs text-neutral-400">US Dollar ($) • Global</div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-emerald-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Poster Image Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl animate-in fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-10 rounded-full bg-neutral-800/80 p-2 text-white hover:bg-neutral-700 transition-colors"
            aria-label="Close zoomed poster"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src="/images/bamboo-mobility-launch-opt.jpg"
            alt="E Bamboo Bike Poster Fullscreen"
            className="max-h-[92vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default BambooMobilityLaunchModal;
