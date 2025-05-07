import React, { useState } from "react";
import { useLocation } from "wouter";
import ScrollLink from "@/components/ScrollLink";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Menu, X, Sparkles, MessageSquareText, Home, Briefcase, Calendar, Phone
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import darkLogoImage from "@assets/Lgo dark.png";

const Navbar: React.FC = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Always use dark logo since we're only using dark mode
  const logoImage = darkLogoImage;
  
  const { data: user } = useQuery<{
    id: number;
    username: string;
    email: string;
    tokens: number;
    isAdmin: boolean;
  }>({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });
  
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/our-works", label: "Our Experience", icon: Briefcase }, 
    { href: "/project-guidance", label: "Project Guidance", icon: Calendar, isNew: true },
    { href: "/contact", label: "Contact", icon: Phone },
    { href: "/ai-chat", label: "AI Chat", icon: Sparkles, isNew: true },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 md:h-18 lg:h-20 max-w-screen-xl items-center px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="mr-2 sm:mr-4 md:mr-6 lg:mr-8 flex">
          <ScrollLink href="/" className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
            <img src={logoImage} alt="BambooMade Logo" className="h-7 sm:h-8 md:h-9 lg:h-10 w-auto" />
            <span className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold text-green-300">
              Bamboo<span className="text-green-400">Made</span>
            </span>
          </ScrollLink>
        </div>

        {!isMobile && (
          <nav className="flex flex-1 items-center space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8 text-xs sm:text-sm md:text-base font-medium">
            {navLinks.map((link) => (
              <ScrollLink
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`transition-colors hover:text-green-300 ${
                  isActive(link.href)
                    ? "text-green-300 font-semibold"
                    : "text-green-400"
                }`}
              >
                <span className="relative flex items-center">
                  {link.icon && <link.icon className="mr-1.5 h-4 w-4" />}
                  <span className="block">
                    {link.label}
                    {link.isNew && (
                      <Badge className="absolute -top-2 -right-5 sm:-right-6 bg-green-600 hover:bg-green-600 text-white text-[8px] sm:text-[9px] px-0.5 sm:px-1 py-0">
                        New
                      </Badge>
                    )}
                  </span>
                </span>
              </ScrollLink>
            ))}
          </nav>
        )}

        <div className="flex flex-1 items-center justify-end space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
          
          {/* Theme toggle, admin buttons, token display, and logout button removed */}

          {isMobile && (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle menu"
                  className="h-9 w-9 sm:h-10 sm:w-10 text-green-400 hover:bg-gray-800 hover:text-green-300"
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[85%] sm:max-w-sm px-4 sm:px-6 bg-gray-900 border-l border-green-800/50 text-white">
                <SheetHeader className="pb-2 sm:pb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                    <img src={logoImage} alt="BambooMade Logo" className="h-8 sm:h-10 w-auto" />
                    <SheetTitle className="text-lg sm:text-xl md:text-2xl text-green-300">BambooMade</SheetTitle>
                  </div>
                  <SheetDescription className="text-sm sm:text-base text-green-400">
                    Sustainable Bamboo Architecture
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col space-y-3 sm:space-y-4 mt-5 sm:mt-6 md:mt-7">
                  {navLinks.map((link) => (
                    <ScrollLink
                      key={`${link.href}-${link.label}`}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-sm sm:text-base md:text-lg py-1.5 sm:py-2 font-medium transition-colors ${
                        isActive(link.href)
                          ? "text-green-300 font-semibold"
                          : "text-green-400"
                      }`}
                    >
                      <span className="relative flex items-center">
                        {link.icon && <link.icon className="mr-2 h-5 w-5" />}
                        <span className="block">
                          {link.label}
                          {link.isNew && (
                            <Badge className="absolute -top-2 -right-5 bg-green-600 hover:bg-green-600 text-white text-[8px] px-0.5 py-0">
                              New
                            </Badge>
                          )}
                        </span>
                      </span>
                    </ScrollLink>
                  ))}
                  
                  {/* AI Chat section removed as it's now in the main navigation */}
                  
                  {/* Admin dashboard link removed */}
                  {user && (
                    <div className="pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-green-800/50 space-y-3">
                      {/* View My Sessions link */}
                      <ScrollLink
                        href="/view-my-sessions"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center text-sm sm:text-base md:text-lg py-1.5 sm:py-2 font-medium text-green-400 transition-colors hover:text-green-300"
                      >
                        <MessageSquareText className="mr-2 h-5 w-5" />
                        View My Sessions
                      </ScrollLink>

                      {/* Token display removed */}
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleLogout} 
                        className="w-full text-xs sm:text-sm md:text-base h-8 sm:h-10 md:h-11 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Logout
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;