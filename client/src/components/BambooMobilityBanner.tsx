import React, { useState } from "react";
import { ExternalLink, ShieldCheck, ArrowRight, Globe, Eye, Zap, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";

type CurrencyType = "USD" | "SGD" | "INR";

interface CurrencyConfig {
  currency: CurrencyType;
  label: string;
  name: string;
  symbol: string;
  flag: string;
  buttonText: string;
  buttonId: string;
  directUrl: string;
  badge: string;
}

const CURRENCIES: Record<CurrencyType, CurrencyConfig> = {
  SGD: {
    currency: "SGD",
    label: "SGD (S$)",
    name: "Singapore Dollar",
    symbol: "S$",
    flag: "🇸🇬",
    buttonText: "Pay in SGD",
    buttonId: "pl_TjhJzcuPJ23SV8",
    directUrl: "https://razorpay.com/payment-button/pl_TjhJzcuPJ23SV8/view",
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
  },
};

export const BambooMobilityBanner: React.FC = () => {
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const handleRedirect = (curr: CurrencyType) => {
    const config = CURRENCIES[curr];
    window.open(config.directUrl, "_blank", "noopener,noreferrer");
    setShowCurrencyModal(false);
  };

  const openPosterModal = () => {
    window.dispatchEvent(new CustomEvent("open-bamboo-mobility-modal"));
  };

  return (
    <section className="relative w-full pt-4 pb-8 sm:pt-6 sm:pb-10 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 border-b border-emerald-950/60 overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* The Banner Image Container - Directly at Top */}
        <div
          onClick={openPosterModal}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-emerald-950/40"
        >
          <img
            src="/images/bamboo-mobility-banner.jpg"
            srcSet="/images/bamboo-mobility-banner-mobile.jpg 800w, /images/bamboo-mobility-banner.jpg 1024w"
            sizes="(max-width: 640px) 100vw, 1024px"
            alt="Tesseract E Bamboo Bike - Ride Carry Explore - Launching Soon"
            width={1024}
            height={385}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          {/* Subtle hover overlay hint */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 sm:p-6">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
              <Eye className="h-4 w-4 text-amber-300" /> Click to explore full details & get special launch discount
            </span>
          </div>
        </div>

        {/* Action & CTA Card */}
        <div
          className="mt-4 sm:mt-6 rounded-2xl border border-neutral-800/90 bg-neutral-900/80 p-4 sm:p-7 backdrop-blur-xl shadow-xl transition-all duration-300"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            {/* Left Col: Prompt & Feature Icons */}
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-400 shrink-0" />
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Help Us Launch
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Support the development of the E Bamboo Bike and get an exclusive special launch discount. Available internationally in USD, SGD and in India in INR.
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 text-xs text-neutral-400">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950/70 border border-neutral-800/80 px-2.5 py-1 text-[11px] sm:text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  Razorpay Verified
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950/70 border border-neutral-800/80 px-2.5 py-1 text-[11px] sm:text-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  Instant Confirmation
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950/70 border border-neutral-800/80 px-2.5 py-1 text-[11px] sm:text-xs">
                  <Bike className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  Special Launch Discount
                </span>
              </div>
            </div>

            {/* Right Col: Bold CTA Button */}
            <div className="w-full md:w-auto md:min-w-[260px] shrink-0">
              <Button
                onClick={() => setShowCurrencyModal(true)}
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-emerald-500 via-green-600 to-amber-600 hover:from-emerald-600 hover:to-amber-700 text-white shadow-lg shadow-emerald-950/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 rounded-xl"
              >
                <span>Help us launch</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Selection Dialog Modal if clicked without picking */}
      {showCurrencyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowCurrencyModal(false)}
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
                onClick={() => setShowCurrencyModal(false)}
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
                onClick={() => handleRedirect("SGD")}
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
                onClick={() => handleRedirect("INR")}
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
                onClick={() => handleRedirect("USD")}
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
    </section>
  );
};

export default BambooMobilityBanner;
