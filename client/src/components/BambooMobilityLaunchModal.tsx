import React, { useState, useEffect } from "react";
import { X, ExternalLink, Sparkles, ShieldCheck, Bike, Zap, ArrowRight, Eye, Leaf, PackageOpen, CheckCircle2, Coffee, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BambooMobilityLaunchModalProps {
  defaultOpen?: boolean;
}

interface TestRideFormData {
  name: string;
  email: string;
  phone: string;
  city: string;
  occupation: string;
  age: string;
  gender: string;
}

const INITIAL_FORM_DATA: TestRideFormData = {
  name: "",
  email: "",
  phone: "",
  city: "",
  occupation: "",
  age: "",
  gender: "",
};

export const BambooMobilityLaunchModal: React.FC<BambooMobilityLaunchModalProps> = ({
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [formData, setFormData] = useState<TestRideFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setIsSubmitted(false);
      setErrorMessage(null);
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
        if (isZoomed) {
          setIsZoomed(false);
        } else if (isOpen) {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isZoomed]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("bamboomade_mobility_popup_closed", "true");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic frontend validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.city.trim() || !formData.occupation.trim() || !formData.age.trim() || !formData.gender.trim()) {
      setErrorMessage("Please fill in all the required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/test-ride/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit enrollment");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Test ride submission error:", err);
      setErrorMessage(err.message || "Submission failed. Please try again or reach out on WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating launcher button (accessible after closing or anytime) */}
      <div className="fixed bottom-4 sm:bottom-6 left-3 sm:left-6 z-40 max-w-[calc(100vw-24px)]">
        <button
          onClick={() => {
            setIsOpen(true);
            setIsSubmitted(false);
          }}
          className="group flex items-center gap-2 sm:gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-green-600 to-amber-600 px-3.5 sm:px-4 py-2 sm:py-2.5 text-white shadow-xl shadow-emerald-950/40 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/25 active:scale-95 border border-emerald-400/40 whitespace-nowrap shrink-0"
          aria-label="Enroll for E Bamboo Bike Test Ride"
        >
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <Bike className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-200 transition-transform group-hover:rotate-12 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap">
            E Bamboo Bike • <span className="text-amber-300 underline underline-offset-2">Book Test Ride</span>
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

          {/* Modal Container */}
          <div
            className="relative z-10 w-full max-w-sm sm:max-w-5xl rounded-2xl bg-neutral-900/95 border border-neutral-800 shadow-2xl text-neutral-100 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[88vh] sm:max-h-[92vh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 px-3 sm:px-6 py-2.5 sm:py-3 bg-neutral-950/70 gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-emerald-400 truncate">
                  Show Interest • Exclusive Test Ride Enrollment
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
            <div className="overflow-y-auto p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
                
                {/* Left Column: Launch Poster Image & Feature Pills */}
                <div className="lg:col-span-5 flex flex-col items-center space-y-3">
                  <div className="group relative w-full overflow-hidden rounded-xl border border-emerald-900/40 bg-neutral-950 shadow-md">
                    <img
                      src="/images/bamboo-mobility-banner.jpg"
                      srcSet="/images/bamboo-mobility-banner-mobile.jpg 800w, /images/bamboo-mobility-banner.jpg 1024w"
                      sizes="(max-width: 640px) 100vw, 40vw"
                      alt="E Bamboo Bike - Ride Connect Explore"
                      width={1024}
                      height={385}
                      className="w-full h-auto object-cover mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                    />
                    <button
                      onClick={() => setIsZoomed(true)}
                      className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 text-[10px] sm:text-xs font-medium text-neutral-200 backdrop-blur-md opacity-90 transition-opacity hover:opacity-100 hover:text-white border border-neutral-700/60"
                    >
                      <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                      Fullscreen
                    </button>
                  </div>

                  {/* Feature Highlights Grid - Matching the Official Poster */}
                  <div className="grid grid-cols-3 gap-2 w-full text-xs">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg bg-neutral-950/60 p-2 sm:p-2.5 border border-neutral-800 text-center sm:text-left">
                      <Leaf className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-200">Bamboo Frame</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg bg-neutral-950/60 p-2 sm:p-2.5 border border-neutral-800 text-center sm:text-left">
                      <PackageOpen className="h-4 w-4 text-sky-400 shrink-0" />
                      <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-200">Compact Design</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg bg-neutral-950/60 p-2 sm:p-2.5 border border-neutral-800 text-center sm:text-left">
                      <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-200">Electric Mobility</span>
                    </div>
                  </div>

                  {/* Optional Pay for Coffee Support Link */}
                  <div className="w-full pt-2 border-t border-neutral-800/80 text-center">
                    <a
                      href="https://razorpay.com/payment-button/pl_TjhR7PGDDKFDIH/view"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-300 transition-colors py-1 group"
                    >
                      <Coffee className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>Love our mission? <span className="underline underline-offset-2">Pay for a coffee</span></span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                </div>

                {/* Right Column: Show Interest & Test Ride Enrollment Form */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  {isSubmitted ? (
                    /* Submission Success State */
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 sm:p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-white">
                          You&apos;re Enrolled for the Test Ride!
                        </h3>
                        <p className="text-sm text-emerald-300/90 font-medium">
                          Thank you, {formData.name}!
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-md mx-auto">
                        We have sent a confirmation email to <strong className="text-emerald-300">{formData.email}</strong>. Our team will contact you directly to schedule your test ride when demo units arrive in <strong className="text-emerald-300">{formData.city}</strong>.
                      </p>

                      <div className="pt-4 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                          href="https://razorpay.com/payment-button/pl_TjhR7PGDDKFDIH/view"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-transform hover:scale-105"
                        >
                          <Coffee className="h-4 w-4" />
                          <span>Treat the team: Pay for a coffee</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <Button
                          variant="outline"
                          onClick={handleClose}
                          className="border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-xs sm:text-sm"
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* The Test Ride Enrollment Form */
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-300 mb-1">
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          Limited Test Ride Slots
                        </div>
                        <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                          Enroll for E Bamboo Bike Test Ride
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                          Share your details to show interest and be among the first to experience our sustainable electric micro-mobility bike.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-3">
                        {errorMessage && (
                          <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/80 text-red-200 text-xs">
                            {errorMessage}
                          </div>
                        )}

                        {/* Name & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-neutral-300 mb-1">
                              Full Name <span className="text-emerald-400">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              required
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="e.g. Rahul Sharma"
                              className="w-full h-9 sm:h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-neutral-300 mb-1">
                              Email Address <span className="text-emerald-400">*</span>
                            </label>
                            <input
                              type="email"
                              name="email"
                              required
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="you@example.com"
                              className="w-full h-9 sm:h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Phone & City */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-neutral-300 mb-1">
                              Phone / WhatsApp <span className="text-emerald-400">*</span>
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              required
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="+91 98765 43210"
                              className="w-full h-9 sm:h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-neutral-300 mb-1">
                              City <span className="text-emerald-400">*</span>
                            </label>
                            <input
                              type="text"
                              name="city"
                              required
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="e.g. Hyderabad / Bangalore"
                              className="w-full h-9 sm:h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Occupation */}
                        <div>
                          <label className="block text-[11px] sm:text-xs font-semibold text-neutral-300 mb-1">
                            Occupation <span className="text-emerald-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="occupation"
                            required
                            value={formData.occupation}
                            onChange={handleInputChange}
                            placeholder="e.g. Architect, Student, Software Engineer, Business Owner"
                            className="w-full h-9 sm:h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                          />
                        </div>

                        {/* Age & Gender */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-neutral-300 mb-1">
                              Age <span className="text-emerald-400">*</span>
                            </label>
                            <input
                              type="number"
                              name="age"
                              min="12"
                              max="100"
                              required
                              value={formData.age}
                              onChange={handleInputChange}
                              placeholder="e.g. 26"
                              className="w-full h-9 sm:h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-neutral-300 mb-1">
                              Gender <span className="text-emerald-400">*</span>
                            </label>
                            <select
                              name="gender"
                              required
                              value={formData.gender}
                              onChange={handleInputChange}
                              className="w-full h-9 sm:h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            >
                              <option value="" disabled className="text-neutral-500">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Non-binary">Non-binary</option>
                              <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                          </div>
                        </div>

                        {/* Privacy Policy Disclaimer Box */}
                        <div className="rounded-xl bg-neutral-950/80 border border-neutral-800 p-2.5 sm:p-3 text-[11px] text-neutral-400 space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                            <span>Privacy Policy & Research Commitment</span>
                          </div>
                          <p className="leading-relaxed">
                            This data is solely collected for research, development, and scheduling test rides by <strong>BambooMade</strong>. Your information is 100% confidential and will never be sold, rented, or shared with third parties.
                          </p>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-emerald-500 via-green-600 to-amber-600 hover:from-emerald-600 hover:to-amber-700 text-white shadow-lg shadow-emerald-950/50 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 rounded-xl"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Enrolling your test ride...</span>
                            </>
                          ) : (
                            <>
                              <span>Enroll for Test Ride</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  )}
                </div>

              </div>
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
