import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X, Sun, Moon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const Navbar: React.FC = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
    { href: "/ai-chat", label: "BambooMade AI" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">
              Bamboo<span className="text-secondary">Made</span>
            </span>
          </Link>
        </div>

        {!isMobile && (
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-primary ${
                  isActive(link.href)
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex flex-1 items-center justify-end space-x-4">
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
                <span className="text-sm text-muted-foreground mr-2">
                  {user.tokens} tokens
                </span>
              )}
              {user.isAdmin && !isMobile && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <Button variant="default" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/ai-chat">
              <Button variant="default" size="sm">
                Login
              </Button>
            </Link>
          )}

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
                  <SheetTitle>BambooMade</SheetTitle>
                  <SheetDescription>
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
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {user && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-2">
                        Available tokens: {user.tokens}
                      </p>
                      <Button variant="default" size="sm" onClick={handleLogout} className="w-full">
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
