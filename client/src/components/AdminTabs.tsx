import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, Database, Users, HelpCircle, Server, BookOpen, FileText, Trash2, CreditCard } from "lucide-react";

interface AdminTabsProps {
  value?: string;
  defaultTab?: string; // For backwards compatibility
  onTabChange?: (tab: string) => void;
  children: React.ReactNode;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ 
  value,
  defaultTab = "summary", 
  onTabChange, 
  children 
}) => {
  const [location, navigate] = useLocation();
  
  // Use value prop if provided, otherwise fall back to defaultTab
  const activeTab = value || defaultTab;
  
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    
    // Handle tab changes without always redirecting
    // This allows the summary tab to work within the same page
    switch (tab) {
      case "sessions":
        navigate("/admin-dashboard?tab=pending");
        break;
      case "payments":
        navigate("/admin-dashboard?tab=payments");
        break;
      case "database":
        navigate("/ai-knowledge-database");
        break;
      case "users":
        navigate("/admin-dashboard?tab=users");
        break;
      case "deleted-users":
        navigate("/admin-dashboard?tab=deleted-users");
        break;
      case "summary":
        // Check if already on AdminDashboard, no need to redirect then
        if (location !== "/admin-dashboard") {
          navigate("/admin-dashboard?tab=summary");
        }
        break;
      default:
        // No redirection by default - rely on the activeTab state
        break;
    }
  };

  return (
    <Tabs 
      value={activeTab}
      defaultValue={defaultTab}
      onValueChange={handleTabChange}
      className="space-y-6"
    >
      <div className="sticky top-0 z-10 bg-gray-950 pt-1 pb-2">
        <TabsList className="bg-gray-800/80 border border-gray-700 w-full flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent rounded-md shadow-md">
          {/* Dashboard Summary tab removed */}
          <TabsTrigger 
            value="sessions" 
            className="flex-1 min-w-[140px] data-[state=active]:bg-green-700/90 data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200"
          >
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="sm:inline">Session</span> Management
          </TabsTrigger>

          <TabsTrigger 
            value="payments" 
            className="flex-1 min-w-[140px] data-[state=active]:bg-blue-600/90 data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200"
          >
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="sm:inline">Payment</span> Analytics
          </TabsTrigger>

          <TabsTrigger 
            value="database" 
            className="flex-1 min-w-[140px] data-[state=active]:bg-amber-600/90 data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200"
          >
            <Database className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="sm:inline">Knowledge</span> Database
          </TabsTrigger>
          
          <TabsTrigger 
            value="users" 
            className="flex-1 min-w-[140px] data-[state=active]:bg-purple-600/90 data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="sm:inline">User</span> Management
          </TabsTrigger>
          
          <TabsTrigger 
            value="deleted-users" 
            className="flex-1 min-w-[140px] data-[state=active]:bg-red-600/90 data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="sm:inline">Deleted</span> Users
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="pb-20">
        {children}
      </div>
    </Tabs>
  );
};

export default AdminTabs;