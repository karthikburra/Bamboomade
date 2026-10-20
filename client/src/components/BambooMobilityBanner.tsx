import React from "react";
import { ExternalLink, ShieldCheck, ArrowRight, Eye, Zap, Bike, Leaf, Coffee, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BambooMobilityBanner: React.FC = () => {
  const openTestRideModal = () => {
    window.dispatchEvent(new CustomEvent("open-bamboo-mobility-modal"));
  };

  return (
    <section className="relative w-full pt-4 pb-8 sm:pt-6 sm:pb-10 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 border-b border-emerald-950/60 overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* The Banner Image Container - Directly at Top */}
        <div
          onClick={openTestRideModal}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-emerald-950/40"
        >
          <img
            src="/images/bamboo-mobility-banner.jpg"
            srcSet="/images/bamboo-mobility-banner-mobile.jpg 800w, /images/bamboo-mobility-banner.jpg 1024w"
            sizes="(max-width: 640px) 100vw, 1024px"
            alt="E Bamboo Bike - Ride Connect Explore - Launching Soon"
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
              <Eye className="h-4 w-4 text-amber-300" /> Click to view details & enroll for an exclusive test ride
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
                <Bike className="h-5 w-5 text-emerald-400 shrink-0" />
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Experience the E Bamboo Bike
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Be the first to test ride our compact bamboo frame electric bike. Fill the quick interest form to help our research and reserve your slot.
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 text-xs text-neutral-400">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950/70 border border-neutral-800/80 px-2.5 py-1 text-[11px] sm:text-xs">
                  <Leaf className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  Bamboo Frame
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950/70 border border-neutral-800/80 px-2.5 py-1 text-[11px] sm:text-xs">
                  <Zap className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  Compact Design
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950/70 border border-neutral-800/80 px-2.5 py-1 text-[11px] sm:text-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  Electric Mobility
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950/70 border border-neutral-800/80 px-2.5 py-1 text-[11px] sm:text-xs">
                  <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  Research Privacy Protected
                </span>
              </div>
            </div>

            {/* Right Col: Bold CTA Button & Optional Coffee Support */}
            <div className="w-full md:w-auto md:min-w-[260px] shrink-0 space-y-2 text-center">
              <Button
                onClick={openTestRideModal}
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-emerald-500 via-green-600 to-amber-600 hover:from-emerald-600 hover:to-amber-700 text-white shadow-lg shadow-emerald-950/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 rounded-xl"
              >
                <span>Enroll for Test Ride</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="pt-1">
                <a
                  href="https://razorpay.com/payment-button/pl_TjhR7PGDDKFDIH/view"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-300 transition-colors group"
                >
                  <Coffee className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Support our mission: <span className="underline underline-offset-2">Pay for coffee</span></span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BambooMobilityBanner;
