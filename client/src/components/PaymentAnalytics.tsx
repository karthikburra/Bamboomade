import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, RefreshCcw, BarChart, PieChart, XCircle, Clock, RefreshCw, Compass } from "lucide-react";
import PaymentMapperDialog from "./PaymentMapperDialog";
import FixFailedSessionsButton from "./FixFailedSessionsButton";

// Define payment status colors
const paymentStatusColors = {
  created: "bg-blue-100 text-blue-800 border-blue-200",
  authorized: "bg-yellow-100 text-yellow-800 border-yellow-200",
  captured: "bg-green-100 text-green-800 border-green-200",
  refunded: "bg-purple-100 text-purple-800 border-purple-200",
  failed: "bg-red-100 text-red-800 border-red-200"
};

// Define payment method icons and labels
const paymentMethodLabels = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  wallet: "Wallet",
  bank_transfer: "Bank Transfer",
  default: "Other"
};

// TypeScript interfaces
interface PaymentStatusSummary {
  created: number;
  authorized: number;
  captured: number;
  refunded: number;
  failed: number;
  total: number;
}

interface RazorpayPayment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  email: string;
  contact: string;
  createdAt: string;
  capturedAt: string | null;
}

const PaymentAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch payment summary data
  const { 
    data: summaryData, 
    isLoading: isSummaryLoading, 
    error: summaryError,
    refetch: refetchSummary
  } = useQuery<{ success: boolean; summary: PaymentStatusSummary }>({ 
    queryKey: ['razorpay-payment-summary'],
    queryFn: async () => {
      const response = await fetch('/api/admin/razorpay-payment-summary');
      if (!response.ok) {
        throw new Error('Failed to fetch payment summary');
      }
      return response.json();
    },
  });

  // Fetch payment list data
  const { 
    data: paymentsData, 
    isLoading: isPaymentsLoading, 
    error: paymentsError,
    refetch: refetchPayments
  } = useQuery<{ success: boolean; payments: RazorpayPayment[] }>({ 
    queryKey: ['razorpay-payments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/razorpay-payments');
      if (!response.ok) {
        throw new Error('Failed to fetch payment list');
      }
      return response.json();
    },
  });

  // Handler for refreshing data
  const handleRefresh = () => {
    refetchSummary();
    refetchPayments();
    toast({
      title: "Refreshing payment data",
      description: "The latest payment information is being loaded.",
    });
  };

  // Handler for changing time range
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    // In a real implementation, this would update query parameters
  };

  // Calculate stats from the data
  const calculateStats = () => {
    if (!paymentsData?.payments || paymentsData.payments.length === 0) {
      return {
        totalRevenue: 0,
        averageAmount: 0,
        successRate: 0,
        paymentMethods: {},
      };
    }

    const payments = paymentsData.payments;
    const capturedPayments = payments.filter(p => p.status === 'captured');
    
    // Calculate total revenue (from captured payments only)
    const totalRevenue = capturedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate average payment amount
    const averageAmount = totalRevenue / (capturedPayments.length || 1);
    
    // Calculate success rate
    const successRate = (capturedPayments.length / payments.length) * 100;
    
    // Count payment methods
    const paymentMethods: Record<string, number> = {};
    payments.forEach(payment => {
      const method = payment.method || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });
    
    return {
      totalRevenue,
      averageAmount,
      successRate,
      paymentMethods,
    };
  };

  const stats = calculateStats();

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Render payment status badge
  const renderStatusBadge = (status: string) => {
    const colorClass = paymentStatusColors[status as keyof typeof paymentStatusColors] || "bg-gray-100 text-gray-800 border-gray-200";
    
    let icon;
    switch(status) {
      case 'captured':
        icon = <CheckCircle className="w-3 h-3 mr-1" />;
        break;
      case 'failed':
        icon = <XCircle className="w-3 h-3 mr-1" />;
        break;
      case 'authorized':
        icon = <Clock className="w-3 h-3 mr-1" />;
        break;
      case 'created':
        icon = <RefreshCw className="w-3 h-3 mr-1" />;
        break;
      default:
        icon = <AlertCircle className="w-3 h-3 mr-1" />;
    }
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Analytics</h2>
          <p className="text-muted-foreground">Track payments, revenue, and success rates</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <PaymentMapperDialog onSuccess={handleRefresh} />
            <FixFailedSessionsButton onSuccess={handleRefresh} />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={isSummaryLoading || isPaymentsLoading}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
                <p className="text-xs text-muted-foreground">
                  From {paymentsData?.payments?.length || 0} payments
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {summaryData?.summary?.captured || 0} successful out of {summaryData?.summary?.total || 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Payment</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">₹{stats.averageAmount.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Per successful payment</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summaryData?.summary?.failed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {((summaryData?.summary?.failed || 0) / (summaryData?.summary?.total || 1) * 100).toFixed(1)}% failure rate
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payment-list">Payment List</TabsTrigger>
          <TabsTrigger value="breakdown">Payment Breakdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Distribution of payment statuses</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                {isSummaryLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(summaryData?.summary || {}).map(([key, value]) => {
                      if (key === 'total') return null;
                      const percentage = ((value / (summaryData?.summary?.total || 1)) * 100).toFixed(1);
                      const colorClass = paymentStatusColors[key as keyof typeof paymentStatusColors] || "bg-gray-100";
                      
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {renderStatusBadge(key)}
                            </div>
                            <span>{value} ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary">
                            <div
                              className={`h-2 rounded-full ${colorClass.split(' ')[0]}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>How customers are paying</CardDescription>
              </CardHeader>
              <CardContent>
                {isPaymentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(stats.paymentMethods).map(([method, count]) => {
                      const percentage = ((count / (paymentsData?.payments?.length || 1)) * 100).toFixed(1);
                      const label = paymentMethodLabels[method as keyof typeof paymentMethodLabels] || method;
                      
                      return (
                        <div key={method} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{label}</span>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="payment-list">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>A list of all payments with details</CardDescription>
            </CardHeader>
            <CardContent>
              {isPaymentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : paymentsData?.payments?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Customer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsData.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell>₹{payment.amount}</TableCell>
                        <TableCell>{renderStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {paymentMethodLabels[payment.method as keyof typeof paymentMethodLabels] || payment.method}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={payment.email}>
                          {payment.email}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No payment data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payments</CardTitle>
              <CardDescription>Payments that failed to process</CardDescription>
            </CardHeader>
            <CardContent>
              {isPaymentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  {paymentsData?.payments?.filter(p => p.status === 'failed')?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Customer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentsData.payments
                          .filter(payment => payment.status === 'failed')
                          .map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                              <TableCell>{formatDate(payment.createdAt)}</TableCell>
                              <TableCell>₹{payment.amount}</TableCell>
                              <TableCell>
                                {paymentMethodLabels[payment.method as keyof typeof paymentMethodLabels] || payment.method}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate" title={payment.email}>
                                {payment.email}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No failed payments found</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          <div className="h-4"></div>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Analysis</CardTitle>
              <CardDescription>Success rate by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              {isPaymentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Total Count</TableHead>
                      <TableHead>Success Count</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.paymentMethods).map(([method, count]) => {
                      const successCount = paymentsData?.payments
                        ?.filter(p => p.method === method && p.status === 'captured')
                        ?.length || 0;
                      
                      const successRate = ((successCount / count) * 100).toFixed(1);
                      
                      const totalAmount = paymentsData?.payments
                        ?.filter(p => p.method === method && p.status === 'captured')
                        ?.reduce((sum, p) => sum + p.amount, 0) || 0;
                      
                      return (
                        <TableRow key={method}>
                          <TableCell>
                            {paymentMethodLabels[method as keyof typeof paymentMethodLabels] || method}
                          </TableCell>
                          <TableCell>{count}</TableCell>
                          <TableCell>{successCount}</TableCell>
                          <TableCell>{successRate}%</TableCell>
                          <TableCell>₹{totalAmount.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentAnalytics;