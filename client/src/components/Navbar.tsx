import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
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
import { Menu, X, Sun, Moon, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import lightLogoImage from "@assets/logo.png";
import darkLogoImage from "@assets/Lgo dark.png";

const Navbar: React.FC = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Get the appropriate logo based on theme
  const logoImage = theme === 'light' ? lightLogoImage : darkLogoImage;
  
  const { data: user } = useQuery({
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
    { href: "/gallery", label: "Gallery" },
    { href: "/counseling", label: "Counseling" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <img src={logoImage} alt="BambooMade Logo" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-green-800 dark:text-green-300">
              Bamboo<span className="text-green-600 dark:text-green-400">Made</span>
            </span>
          </Link>
        </div>

        {!isMobile && (
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-green-700 dark:hover:text-green-300 ${
                  isActive(link.href)
                    ? "text-green-800 dark:text-green-300 font-semibold"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex flex-1 items-center justify-end space-x-4">
          <Link href="/ai-chat" className="relative group">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              BambooMade AI
              <Badge className="ml-2 bg-green-600 hover:bg-green-600 text-white text-[10px] px-1.5 py-0">New</Badge>
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              {!isMobile && (
                <span className="text-sm text-green-700 dark:text-green-400 mr-2">
                  {user.tokens} tokens
                </span>
              )}
              {user.isAdmin && !isMobile && (
                <Link href="/admin">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                  >
                    Admin
                  </Button>
                </Link>
              )}
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleLogout}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Logout
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
              <SheetContent>
                <SheetHeader>
                  <div className="flex items-center space-x-2 mb-2">
                    <img src={logoImage} alt="BambooMade Logo" className="h-10 w-auto" />
                    <SheetTitle className="text-green-800 dark:text-green-300">BambooMade</SheetTitle>
                  </div>
                  <SheetDescription className="text-green-600 dark:text-green-400">
                    Sustainable Bamboo Architecture
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-base font-medium transition-colors ${
                        isActive(link.href)
                          ? "text-green-800 dark:text-green-300 font-semibold"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  <Link
                    href="/ai-chat"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center text-base font-medium text-green-700 dark:text-green-400 transition-colors hover:text-green-800 dark:hover:text-green-300"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    BambooMade AI
                    <Badge className="ml-2 bg-green-600 hover:bg-green-600 text-white text-[10px] px-1.5 py-0">New</Badge>
                  </Link>
                  {user?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-medium text-green-700 dark:text-green-500 transition-colors hover:text-green-800 dark:hover:text-green-300"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {user && (
                    <div className="pt-4 border-t border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                        Available tokens: {user.tokens}
                      </p>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleLogout} 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
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
