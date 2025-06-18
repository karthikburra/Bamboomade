import React, { useState } from "react";
import { useLocation } from "wouter";
import ScrollLink from "@/components/ScrollLink";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { format, differenceInDays } from "date-fns";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Menu, X, Sparkles, MessageSquareText, Home, Briefcase, Calendar, Phone, User,
  UserCircle, LogOut, Settings, Edit, ClipboardList, Loader2, Clock, 
  Globe, LayoutDashboard, CreditCard, BookOpen, MessageSquare, Moon, Sun, Info,
  Database
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import darkLogoImage from "@assets/Lgo dark.png";

// Custom component for Free Trial badge
const FreeTrialBadge = ({ className = "" }: { className?: string }) => {
  return (
    <Badge className={`bg-gradient-to-r from-green-500 to-amber-500 text-white px-2 py-1 text-xs font-semibold rounded ${className}`}>
      Free Trial
    </Badge>
  );
};

// Subscription Status Item Component for Dropdown Menu
const SubscriptionStatusItem = () => {
  const { 
    isActive, 
    expiryDate, 
    daysLeft, 
    subscriptionStatus, 
    isLoading,
    isChecking,
    checkSubscription 
  } = useSubscription();
  
  const getBadgeColor = () => {
    if (!isActive || (daysLeft !== null && daysLeft <= 0)) {
      return "bg-red-600 hover:bg-red-700"; // Expired
    }
    
    if (subscriptionStatus === 'free') {
      if (daysLeft && daysLeft > 30) {
        return "bg-green-600 hover:bg-green-700"; // Free trial with plenty of time
      } else if (daysLeft && daysLeft > 7) {
        return "bg-amber-600 hover:bg-amber-700"; // Free trial with limited time
      } else {
        return "bg-red-600 hover:bg-red-700"; // Free trial about to expire
      }
    }
    
    return "bg-blue-600 hover:bg-blue-700"; // Active paid subscription
  };
  
  const getStatusLabel = () => {
    if (isLoading) return "Loading...";
    if (!isActive) return "Expired";
    if (daysLeft !== null && daysLeft <= 0) return "Expired";
    if (isActive && subscriptionStatus === 'active' && daysLeft) return `${daysLeft} days left`;
    if (isActive && subscriptionStatus === 'free' && daysLeft) return `Free Trial (${daysLeft} days)`;
    return "Expired";
  };
  
  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    checkSubscription();
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer text-green-200 focus:text-green-100 focus:bg-green-700/30"
          onClick={(e) => e.preventDefault()}
        >
          <Sparkles className="mr-2 h-4 w-4 text-amber-400" />
          AI Subscription
          <div className="ml-auto">
            <Badge className={`text-white ${getBadgeColor()} px-2 py-1 text-xs font-medium rounded`}>
              {getStatusLabel()}
            </Badge>
          </div>
        </DropdownMenuItem>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-gray-900 border border-green-800/50 text-gray-100">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-lg text-green-300">Bamboo One Access</h4>
            <div className="flex items-center gap-2">
              <Badge className={`text-white ${getBadgeColor()} px-2 py-1 text-xs font-semibold rounded`}>
                {getStatusLabel()}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full p-0 text-gray-400 hover:text-white hover:bg-gray-700/50"
                onClick={handleRefresh}
                disabled={isChecking}
                title="Refresh subscription status"
              >
                {isChecking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-5 w-5 animate-spin text-green-500" />
            </div>
          ) : (
            <>
              {isActive ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Expiry Date:</span>
                    <span className="font-medium text-green-300">
                      {expiryDate ? format(new Date(expiryDate), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Days Left:</span>
                    <span className="font-medium">
                      {daysLeft !== null ? (
                        daysLeft > 0 ? (
                          <Badge className={`${daysLeft > 30 ? 'bg-green-600 hover:bg-green-700' : daysLeft > 7 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'} text-white px-2 py-1 text-xs font-semibold rounded`}>
                            {daysLeft} days
                          </Badge>
                        ) : (
                          <Badge className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs font-semibold rounded">
                            Expired
                          </Badge>
                        )
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-gray-400">
                    {daysLeft !== null && daysLeft > 0 ? (
                      subscriptionStatus === 'free' ? 
                        <span className="text-green-300">You're on a <strong>Free Trial</strong> with <strong>{daysLeft} days</strong> remaining.</span> : 
                        `You have access to Bamboo One for ${daysLeft} more days.`
                    ) : (
                      "Your Bamboo One access has expired."
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">
                    Your subscription has expired. Please contact the administrator for more information.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

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
    fullName: string | null;
    profileImageUrl: string | null;
    phoneNumber: string | null;
    subscriptionStatus: string | null;
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
    { href: "/our-works", label: "Our Experience" }, 
    { href: "/project-guidance", label: "Project Guidance", isNew: true },
    { href: "/contact", label: "Contact" },
    // Bamboo One dashboard for admin users
    ...(user?.isAdmin ? [{ href: "/ai-knowledge-database", label: "Bamboo One", isNew: true }] : [])
  ];
  
  // User links removed as profile is now accessible via the dropdown menu
  const userLinks = [];

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
          <nav className="flex flex-1 items-center justify-center space-x-2 sm:space-x-3 md:space-x-5 lg:space-x-8 text-[10px] sm:text-xs md:text-sm lg:text-base font-medium">
            {navLinks.map((link) => (
              <ScrollLink
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`transition-colors hover:text-green-300 py-1 ${
                  isActive(link.href)
                    ? "text-green-300 font-semibold"
                    : "text-green-400"
                }`}
              >
                <span className="relative whitespace-nowrap">
                  {link.label}
                  {link.isNew && (
                    <Badge className="absolute -top-3 -right-1 bg-amber-500 hover:bg-amber-500 text-white text-[6px] sm:text-[7px] px-[3px] py-0 rounded-[2px] h-[10px] flex items-center">
                      New
                    </Badge>
                  )}
                  {link.isBeta && (
                    <Badge className="absolute -top-3 -right-1 bg-blue-500 hover:bg-blue-500 text-white text-[6px] sm:text-[7px] px-[3px] py-0 rounded-[2px] h-[10px] flex items-center">
                      Beta
                    </Badge>
                  )}
                </span>
              </ScrollLink>
            ))}
            
            {/* User profile link if logged in */}
            {user && userLinks.map((link) => (
              <ScrollLink
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`transition-colors hover:text-green-300 py-1 ${
                  isActive(link.href)
                    ? "text-green-300 font-semibold"
                    : "text-green-400"
                }`}
              >
                <span className="relative whitespace-nowrap flex items-center">
                  <link.icon className="mr-1 h-3.5 w-3.5" />
                  {link.label}
                </span>
              </ScrollLink>
            ))}
          </nav>
        )}

        <div className="flex flex-1 items-center justify-end space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
          
          {!user && !isMobile && (
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.location.href = "/login"}
            >
              Login
            </Button>
          )}
          
          {user && !isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative flex items-center gap-2 h-9 rounded-full px-2 text-sm text-green-300 hover:bg-green-700/20">
                  <Avatar className="h-8 w-8 border border-green-700">
                    <AvatarImage 
                      src={user.profileImageUrl ? `/uploads/${user.profileImageUrl.split('/').pop()}` : undefined}
                      alt={user.fullName || user.username} 
                    />
                    <AvatarFallback className="bg-green-800 text-green-100">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{user.fullName || user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 bg-gray-900 border border-green-800/50">
                <DropdownMenuLabel className="mb-1 text-green-300">
                  My Account
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 text-xs text-green-400 mb-1">
                  {user.email}
                  {user.subscriptionStatus === 'free' && (
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-amber-400 font-medium">Free Trial Active</span>
                      <FreeTrialBadge className="scale-90" />
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-green-800/30" />
                <DropdownMenuItem 
                  className="flex items-center gap-2 cursor-pointer text-green-200 focus:text-green-100 focus:bg-green-700/30"
                  onClick={() => window.location.href = "/profile/edit"}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 cursor-pointer text-green-200 focus:text-green-100 focus:bg-green-700/30"
                  onClick={() => window.location.href = "/view-my-sessions"}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  My Sessions
                </DropdownMenuItem>
                {/* Admin options */}
                {user?.isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-green-800/30" />
                    <DropdownMenuLabel className="text-amber-300 mb-1">
                      Admin Tools
                    </DropdownMenuLabel>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-900/20"
                      onClick={() => window.location.href = "/web-extraction"}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Web Extraction
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-900/20"
                      onClick={() => window.location.href = "/manual-content-entry"}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Manual Content Entry
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-900/20"
                      onClick={() => window.location.href = "/ai-knowledge-database"}
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Bamboo One Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-900/20"
                      onClick={() => window.location.href = "/admin-dashboard"}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-green-800/30" />
                <DropdownMenuItem 
                  className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-900/20"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
                      <span className="relative whitespace-nowrap">
                        {link.label}
                        {link.isNew && (
                          <Badge className="absolute -top-3 -right-1 bg-amber-500 hover:bg-amber-500 text-white text-[6px] sm:text-[7px] px-[3px] py-0 rounded-[2px] h-[10px] flex items-center">
                            New
                          </Badge>
                        )}
                        {link.isBeta && (
                          <Badge className="absolute -top-3 -right-1 bg-blue-500 hover:bg-blue-500 text-white text-[6px] sm:text-[7px] px-[3px] py-0 rounded-[2px] h-[10px] flex items-center">
                            Beta
                          </Badge>
                        )}
                      </span>
                    </ScrollLink>
                  ))}
                  
                  {/* AI Chat section removed as it's now in the main navigation */}
                  
                  {/* User or login section */}
                  {user ? (
                    <div className="pt-4 mt-2 border-t border-green-800/50 space-y-4">
                      {/* User profile info */}
                      <div className="flex items-center space-x-3 px-1 py-2">
                        <Avatar className="h-10 w-10 border border-green-700">
                          <AvatarImage 
                            src={user.profileImageUrl ? `/uploads/${user.profileImageUrl.split('/').pop()}` : undefined}
                            alt={user.fullName || user.username} 
                          />
                          <AvatarFallback className="bg-green-800 text-green-100">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-green-300">
                            {user.fullName || user.username}
                          </p>
                          <p className="text-xs text-green-400">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Edit Profile link */}
                      <ScrollLink
                        href="/profile/edit"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center text-sm sm:text-base md:text-lg py-1.5 sm:py-2 font-medium text-green-400 transition-colors hover:text-green-300"
                      >
                        <Edit className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                        Edit Profile
                      </ScrollLink>
                      
                      {/* View My Sessions link */}
                      <ScrollLink
                        href="/view-my-sessions"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center text-sm sm:text-base md:text-lg py-1.5 sm:py-2 font-medium text-green-400 transition-colors hover:text-green-300"
                      >
                        <ClipboardList className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                        My Sessions
                      </ScrollLink>
                      
                      {/* Admin links */}
                      {user?.isAdmin && (
                        <>
                          <div className="pt-4 mt-2 border-t border-amber-800/50">
                            <h3 className="text-amber-300 font-semibold text-sm mb-2">Admin Tools</h3>
                            <div className="space-y-3">
                              <ScrollLink
                                href="/admin-dashboard"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center text-sm sm:text-base md:text-lg py-1.5 sm:py-2 font-medium text-amber-300 transition-colors hover:text-amber-200"
                              >
                                <LayoutDashboard className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                Admin Dashboard
                              </ScrollLink>
                              <ScrollLink
                                href="/ai-knowledge-database"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center text-sm sm:text-base md:text-lg py-1.5 sm:py-2 font-medium text-amber-300 transition-colors hover:text-amber-200"
                              >
                                <Database className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                Bamboo One Dashboard
                              </ScrollLink>
                              <ScrollLink
                                href="/web-extraction"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center text-sm sm:text-base md:text-lg py-1.5 sm:py-2 font-medium text-amber-300 transition-colors hover:text-amber-200"
                              >
                                <Globe className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                Web Extraction
                              </ScrollLink>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Logout button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLogout} 
                        className="w-full text-xs sm:text-sm md:text-base h-8 sm:h-10 md:h-11 border-red-800/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 mt-2"
                      >
                        <LogOut className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-green-800/50">
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => {
                          setIsMenuOpen(false);
                          window.location.href = "/login";
                        }} 
                        className="w-full text-xs sm:text-sm md:text-base h-8 sm:h-10 md:h-11 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Login
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