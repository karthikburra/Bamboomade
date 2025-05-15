import React from "react";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";

interface RefreshSessionsButtonProps {
  tab: string;
}

const RefreshSessionsButton: React.FC<RefreshSessionsButtonProps> = ({ tab }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions', tab] });
      toast({
        title: "Sessions refreshed",
        description: "The session list has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh sessions",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="h-8 text-xs"
      onClick={handleRefresh}
    >
      <RefreshCw className="h-3 w-3 mr-2" />
      Refresh
    </Button>
  );
};

export default RefreshSessionsButton;