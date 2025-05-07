import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, Database, Users, HelpCircle } from "lucide-react";

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
    
    // Navigate to appropriate page based on the selected tab
    switch (tab) {
      case "summary":
        navigate("/admin-home");
        break;
      case "sessions":
        navigate("/admin-dashboard?tab=pending");
        break;
      case "knowledge":
        navigate("/ai-knowledge-management");
        break;
      case "users":
        navigate("/admin-dashboard?tab=users");
        break;
      default:
        navigate("/admin-home");
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
          <TabsTrigger value="summary" className="data-[state=active]:bg-green-700 text-sm whitespace-nowrap">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard Summary
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-green-700 text-sm whitespace-nowrap">
            <Calendar className="w-4 h-4 mr-2" />
            Session Management
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-blue-600 text-sm whitespace-nowrap">
            <Database className="w-4 h-4 mr-2" />
            AI Knowledge Base
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