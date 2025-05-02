import React, { useState } from "react";
import { useLocation, Link } from "wouter";
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
  Menu, X, Sparkles, MessageSquareText, ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    { href: "/", label: "Home" },
    { href: "/our-works", label: "Our Experience" }, // Keep only Our Experience pointing to our-works page
    { href: "/project-guidance", label: "Project Guidance" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 max-w-screen-xl items-center">
        <div className="mr-2 sm:mr-4 flex pl-2 sm:pl-6">
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2">
            <img src={logoImage} alt="BambooMade Logo" className="h-8 sm:h-10 w-auto" />
            <span className="text-xl sm:text-2xl font-bold text-green-300">
              Bamboo<span className="text-green-400">Made</span>
            </span>
          </Link>
        </div>

        {!isMobile && (
          <nav className="flex flex-1 items-center space-x-4 sm:space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`transition-colors hover:text-green-300 ${
                  isActive(link.href)
                    ? "text-green-300 font-semibold"
                    : "text-green-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4 pr-2 sm:pr-6">
          {!isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                >
                  <Sparkles className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  BambooMade AI
                  <Badge className="ml-1 sm:ml-2 bg-green-600 hover:bg-green-600 text-white text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">New</Badge>
                  <ChevronDown className="ml-1 sm:ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-green-800">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/ai-chat" className="flex items-center w-full">
                    <Sparkles className="mr-2 h-4 w-4 text-green-400" />
                    <span>Chat with AI</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/add-whatsapp-bot" className="flex items-center w-full">
                    <MessageSquareText className="mr-2 h-4 w-4 text-green-400" />
                    <span>Add to WhatsApp</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/ai-chat">
              <Button 
                variant="default" 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white p-1 h-8"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </Link>
          )}
          
          {/* Theme toggle removed - dark mode only */}

          {user && user.tokens !== undefined && user.isAdmin !== undefined ? (
            <div className="flex items-center gap-1 sm:gap-2">
              {!isMobile && (
                <span className="text-xs sm:text-sm text-green-400 mr-1 sm:mr-2">
                  {user.tokens} tokens
                </span>
              )}
              {user.isAdmin && !isMobile && (
                <Link href="/admin">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8 border-green-700 text-green-400 hover:bg-green-900/30"
                  >
                    Admin
                  </Button>
                </Link>
              )}
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleLogout}
                className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
              >
                {isMobile ? "Exit" : "Logout"}
              </Button>
            </div>
          ) : null}

          {isMobile && (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[85%] sm:max-w-sm px-4 sm:px-6">
                <SheetHeader className="pb-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <img src={logoImage} alt="BambooMade Logo" className="h-8 w-auto" />
                    <SheetTitle className="text-lg sm:text-xl text-green-300">BambooMade</SheetTitle>
                  </div>
                  <SheetDescription className="text-sm text-green-400">
                    Sustainable Bamboo Architecture
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col space-y-3 mt-5 sm:mt-6">
                  {navLinks.map((link) => (
                    <Link
                      key={`${link.href}-${link.label}`}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-sm sm:text-base py-1.5 font-medium transition-colors ${
                        isActive(link.href)
                          ? "text-green-300 font-semibold"
                          : "text-green-400"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  <div className="space-y-1.5 py-3 border-t border-b border-green-900/50">
                    <div className="flex items-center text-sm sm:text-base font-medium text-green-300">
                      <Sparkles className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      BambooMade AI Tools
                      <Badge className="ml-2 bg-green-600 hover:bg-green-600 text-white text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">New</Badge>
                    </div>
                    
                    <Link
                      href="/ai-chat"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center pl-6 text-sm sm:text-base py-1.5 font-medium text-green-400 transition-colors hover:text-green-300"
                    >
                      <Sparkles className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Chat with AI
                    </Link>
                    
                    <Link 
                      href="/add-whatsapp-bot"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center pl-6 text-sm sm:text-base py-1.5 font-medium text-green-400 transition-colors hover:text-green-300"
                    >
                      <MessageSquareText className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Add to WhatsApp
                    </Link>
                  </div>
                  
                  {user && user.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-sm sm:text-base py-1.5 font-medium text-green-400 transition-colors hover:text-green-300"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {user && user.tokens !== undefined && (
                    <div className="pt-3 mt-1 border-t border-green-800/50">
                      <p className="text-xs sm:text-sm text-green-400 mb-2">
                        Available tokens: {user.tokens}
                      </p>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleLogout} 
                        className="w-full text-xs sm:text-sm h-8 sm:h-9 bg-green-600 hover:bg-green-700 text-white"
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
