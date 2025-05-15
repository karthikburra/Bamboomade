import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Compass,
  RefreshCw 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface PaymentMapperDialogProps {
  onSuccess?: () => void;
}

interface Payment {
  id: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  email: string;
  contact: string;
  createdAt: string;
}

interface Session {
  id: number;
  studentName: string;
  email: string;
  date: string;
  duration: number;
  topic: string;
  status: string;
  amount?: number;
  paymentStatus?: string;
  paymentId?: string;
  orderId?: string;
}

const PaymentMapperDialog: React.FC<PaymentMapperDialogProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("auto");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all unmapped payments
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/admin/unmapped-payments"],
    enabled: open,
    staleTime: 10000, // 10 seconds
  });

  // Fetch all sessions without confirmed payment
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/admin/unpaid-sessions"],
    enabled: open,
    staleTime: 10000, // 10 seconds
  });

  // Auto-map mutation
  const { mutate: autoMapPayments, isPending: isAutoMapping } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/auto-map-payments", {});
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to auto-map payments");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payments Mapped",
        description: `Successfully mapped ${data.mappedCount} payments to sessions`,
        variant: "default",
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unmapped-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unpaid-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-guidance"] });
      
      if (onSuccess) onSuccess();
      if (data.mappedCount === 0) {
        setActiveTab("manual");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Mapping Failed",
        description: error.message || "Failed to map payments to sessions",
        variant: "destructive"
      });
    }
  });

  // Manual map mutation
  const { mutate: manualMapPayment, isPending: isManualMapping } = useMutation({
    mutationFn: async () => {
      if (!selectedPaymentId || !selectedSessionId) {
        throw new Error("Please select both a payment and a session");
      }
      
      const response = await apiRequest("POST", "/api/admin/manual-map-payment", {
        paymentId: selectedPaymentId,
        sessionId: selectedSessionId
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to map payment");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Mapped",
        description: `Successfully mapped payment to session ${selectedSessionId}`,
        variant: "default",
      });
      
      // Reset selections
      setSelectedPaymentId(null);
      setSelectedSessionId(null);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unmapped-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unpaid-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-guidance"] });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Mapping Failed",
        description: error.message || "Failed to map payment to session",
        variant: "destructive"
      });
    }
  });

  // Filter payments and sessions based on search term
  useEffect(() => {
    if (paymentsData?.payments) {
      if (searchTerm.trim() === "") {
        setFilteredPayments(paymentsData.payments);
      } else {
        const term = searchTerm.toLowerCase();
        setFilteredPayments(
          paymentsData.payments.filter(
            (payment: Payment) =>
              payment.id.toLowerCase().includes(term) ||
              payment.email.toLowerCase().includes(term) ||
              (payment.orderId && payment.orderId.toLowerCase().includes(term)) ||
              payment.amount.toString().includes(term)
          )
        );
      }
    }

    if (sessionsData?.sessions) {
      if (searchTerm.trim() === "") {
        setFilteredSessions(sessionsData.sessions);
      } else {
        const term = searchTerm.toLowerCase();
        setFilteredSessions(
          sessionsData.sessions.filter(
            (session: Session) =>
              session.id.toString().includes(term) ||
              session.studentName.toLowerCase().includes(term) ||
              session.email.toLowerCase().includes(term) ||
              session.topic.toLowerCase().includes(term) ||
              (session.amount && session.amount.toString().includes(term))
          )
        );
      }
    }
  }, [searchTerm, paymentsData, sessionsData]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-9">
          <Compass className="h-4 w-4" />
          Map Payments
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle>Payment Mapper</DialogTitle>
          <DialogDescription>
            Map Razorpay payments to sessions automatically or manually.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="auto">Automatic Mapping</TabsTrigger>
            <TabsTrigger value="manual">Manual Mapping</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auto" className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Auto-Mapping Information</h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>This will automatically match Razorpay payments with sessions by:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>First attempting to match by order ID (most reliable)</li>
                        <li>Then trying to match by email and payment amount</li>
                        <li>Checking booking time proximity to payment time</li>
                        <li>Only successful (captured) payments will be mapped</li>
                      </ul>
                      <p className="mt-2 font-medium">This process will analyze:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>All unmapped successful Razorpay payments</li>
                        <li>All sessions with "Pending" payment status</li>
                        <li>Sessions where the email matches payment email</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Auto-mapping stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-3 bg-white dark:bg-gray-900">
                  <div className="text-sm font-medium mb-1">Unmapped Payments</div>
                  <div className="text-2xl font-bold">
                    {isLoadingPayments ? 
                      <div className="animate-pulse h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div> : 
                      (paymentsData?.payments?.length || 0)
                    }
                  </div>
                </div>
                <div className="border rounded-md p-3 bg-white dark:bg-gray-900">
                  <div className="text-sm font-medium mb-1">Pending Sessions</div>
                  <div className="text-2xl font-bold">
                    {isLoadingSessions ? 
                      <div className="animate-pulse h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div> : 
                      (sessionsData?.sessions?.length || 0)
                    }
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => autoMapPayments()}
                disabled={isAutoMapping || (!paymentsData?.payments?.length || !sessionsData?.sessions?.length)}
                className="w-full"
              >
                {isAutoMapping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mapping Payments...
                  </>
                ) : !paymentsData?.payments?.length || !sessionsData?.sessions?.length ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    No Payments to Map
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Auto-Map Payments
                  </>
                )}
              </Button>
              
              <div className="text-sm text-muted-foreground text-center italic">
                If auto-mapping doesn't work, use the Manual Mapping tab to match payments to sessions.
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, ID, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Payments selection */}
              <div className="space-y-2">
                <Label>Select Payment</Label>
                <div className="border rounded-md dark:border-gray-800">
                  {isLoadingPayments ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ScrollArea className="h-64 w-full rounded-md">
                      <div className="p-2 space-y-2">
                        {filteredPayments && filteredPayments.length > 0 ? (
                          filteredPayments.map((payment) => (
                            <div
                              key={payment.id}
                              className={`p-2 rounded-md border cursor-pointer transition-colors ${
                                selectedPaymentId === payment.id
                                  ? "border-primary bg-primary/10"
                                  : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-900"
                              }`}
                              onClick={() => setSelectedPaymentId(payment.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{payment.email}</p>
                                  <p className="text-xs text-muted-foreground">ID: {payment.id}</p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {formatCurrency(payment.amount)}
                                    </Badge>
                                    <Badge 
                                      variant={payment.status === "captured" ? "success" : "secondary"} 
                                      className="text-xs"
                                    >
                                      {payment.status}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(payment.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            {filteredPayments?.length === 0 ? "No payments found" : "Loading payments..."}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
              
              {/* Sessions selection */}
              <div className="space-y-2">
                <Label>Select Unpaid Session</Label>
                <div className="border rounded-md dark:border-gray-800">
                  {isLoadingSessions ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ScrollArea className="h-64 w-full rounded-md">
                      <div className="p-2 space-y-2">
                        {filteredSessions && filteredSessions.length > 0 ? (
                          filteredSessions.map((session) => (
                            <div
                              key={session.id}
                              className={`p-2 rounded-md border cursor-pointer transition-colors ${
                                selectedSessionId === session.id
                                  ? "border-primary bg-primary/10"
                                  : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-900"
                              }`}
                              onClick={() => setSelectedSessionId(session.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{session.studentName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{session.email}</p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      ID: {session.id}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {session.duration} min
                                    </Badge>
                                    {session.amount && (
                                      <Badge variant="outline" className="text-xs">
                                        {formatCurrency(session.amount)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDate(session.date)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            {filteredSessions?.length === 0 ? "No unpaid sessions found" : "Loading sessions..."}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => manualMapPayment()}
              disabled={isManualMapping || !selectedPaymentId || !selectedSessionId}
              className="w-full"
            >
              {isManualMapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mapping Payment...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Map Payment to Session
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMapperDialog;