import React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FixFailedSessionsButtonProps {
  onSuccess?: () => void;
}

const FixFailedSessionsButton: React.FC<FixFailedSessionsButtonProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: checkFailedSessions, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/check-failed-sessions', {});
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check failed sessions');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.mappedCount > 0 ? 'Sessions Updated' : 'No Updates Needed',
        description: data.message,
        variant: data.mappedCount > 0 ? 'default' : 'secondary',
      });
      
      // Refresh related data
      queryClient.invalidateQueries({ queryKey: ['/api/project-guidance'] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the dialog
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check failed sessions',
        variant: 'destructive',
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Fix Failed Sessions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check Failed Sessions</DialogTitle>
          <DialogDescription>
            This will check for sessions marked as "failed" but actually have successful payments in Razorpay, 
            and update them to "pending" status. This helps recover sessions where the payment went through 
            but the system didn't update the status correctly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-400">Important Information</h3>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                <p>This process will:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Find all sessions with a "failed" status</li>
                  <li>Check against Razorpay payments by email, amount, and order ID</li>
                  <li>Update sessions with successful payments to "pending" status</li>
                  <li>Allow admins to see and confirm these sessions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => checkFailedSessions()} 
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Failed Sessions'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FixFailedSessionsButton;