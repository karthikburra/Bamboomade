import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, Database, Users, HelpCircle, Server, BookOpen, FileText } from "lucide-react";

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
      case "knowledge":
        navigate("/ai-knowledge-management");
        break;
      case "database":
        navigate("/ai-knowledge-database");
        break;
      case "users":
        navigate("/admin-dashboard?tab=users");
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
      <div className="relative overflow-x-auto pb-1">
        <TabsList className="bg-gray-800 border border-gray-700 w-max min-w-full sm:min-w-0 flex flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {/* Dashboard Summary tab removed */}
          <TabsTrigger value="sessions" className="data-[state=active]:bg-green-700 text-sm whitespace-nowrap">
            <Calendar className="w-4 h-4 mr-2" />
            Session Management
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-blue-600 text-sm whitespace-nowrap">
            <BookOpen className="w-4 h-4 mr-2" />
            Add Knowledge
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-amber-600 text-sm whitespace-nowrap">
            <Database className="w-4 h-4 mr-2" />
            Knowledge Database
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-purple-600 text-sm whitespace-nowrap">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
        </TabsList>
      </div>

      {children}
    </Tabs>
  );
};

export default AdminTabs;