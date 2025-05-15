import React, { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Loader2 } from "lucide-react";

const MarkCompletedSessionsButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleMarkCompletedSessions = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/admin/mark-completed-sessions");
      const data = await response.json();
      
      toast({
        title: "Sessions updated",
        description: `${data.completedCount} sessions marked as completed`,
      });
      
      // Refresh the sessions data
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark completed sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="h-8 text-xs"
      onClick={handleMarkCompletedSessions}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
      ) : (
        <>
          <CheckCircle className="h-3 w-3 mr-2" />
          Mark Completed
        </>
      )}
    </Button>
  );
};

export default MarkCompletedSessionsButton;