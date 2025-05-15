import React from "react";
import { useLocation } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "../lib/utils";

interface AdminTabsProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ children, value, className }) => {
  const [location, setLocation] = useLocation();
  
  const handleTabChange = (newValue: string) => {
    // Update the URL query parameter
    setLocation(`/admin-dashboard?tab=${newValue}`);
  };
  
  return (
    <Tabs 
      defaultValue={value} 
      value={value}
      onValueChange={handleTabChange}
      className={cn("space-y-4", className)}
    >
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <TabsList className="bg-gray-900/50 border border-gray-800">
          <TabsTrigger 
            value="pending"
            className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-300 data-[state=active]:shadow-none"
          >
            Pending
          </TabsTrigger>
          
          <TabsTrigger 
            value="confirmed"
            className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-300 data-[state=active]:shadow-none"
          >
            Confirmed
          </TabsTrigger>
          
          <TabsTrigger 
            value="completed"
            className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300 data-[state=active]:shadow-none"
          >
            Completed
          </TabsTrigger>
          
          <TabsTrigger 
            value="cancelled"
            className="data-[state=active]:bg-red-900/30 data-[state=active]:text-red-300 data-[state=active]:shadow-none"
          >
            Cancelled
          </TabsTrigger>
          
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            All Sessions
          </TabsTrigger>
          
          <TabsTrigger 
            value="payments"
            className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-300 data-[state=active]:shadow-none"
          >
            Payment Analytics
          </TabsTrigger>
          
          <TabsTrigger 
            value="users"
            className="data-[state=active]:bg-indigo-900/30 data-[state=active]:text-indigo-300 data-[state=active]:shadow-none"
          >
            Users
          </TabsTrigger>
          
          <TabsTrigger 
            value="deleted-users"
            className="data-[state=active]:bg-pink-900/30 data-[state=active]:text-pink-300 data-[state=active]:shadow-none"
          >
            Deleted Users
          </TabsTrigger>
          
          <TabsTrigger 
            value="database"
            className="data-[state=active]:bg-orange-900/30 data-[state=active]:text-orange-300 data-[state=active]:shadow-none"
          >
            Knowledge DB
          </TabsTrigger>
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
};

export default AdminTabs;