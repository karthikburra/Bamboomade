import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PaymentAnalytics from "../components/PaymentAnalytics";
import { DayPicker } from "react-day-picker";
import { format, addMinutes, addDays, isAfter, isBefore, isToday, parseISO } from "date-fns";
import { formatInIST, formatSessionDate } from "../lib/date-utils";
import { cn } from "../lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import AdminTabs from "../components/AdminTabs";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, RefreshCw, Search, Edit, Trash, Plus, Calendar, Clock, User, AtSign, Phone, Users, DollarSign, BookOpen, ArrowUpDown, MoreVertical, CheckCircle, XCircle, Copy, ExternalLink, ReceiptText, CalendarClock, Download, FileText, ChevronDown, ChevronRight, Filter, Timer } from "lucide-react";
import PaymentMapperDialog from "../components/PaymentMapperDialog";
import RefreshSessionsButton from "../components/RefreshSessionsButton";
import FixFailedSessionsButton from "../components/FixFailedSessionsButton";
import MarkCompletedSessionsButton from "../components/MarkCompletedSessionsButton";

export default function AdminDashboard() {
  // Get query parameters 
  const [location, navigate] = useLocation();
  const search = useSearch();
  const queryParams = new URLSearchParams(search);
  const tab = queryParams.get("tab") || "pending";
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get sessions based on tab
  const { data: sessions = [], isLoading: isSessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['/api/admin/sessions', tab],
    enabled: tab !== "summary" && tab !== "users" && tab !== "deleted-users" && tab !== "payments"
  });
  
  // Users data
  const { data: users = [], isLoading: isUsersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: tab === "users" || tab === "summary"
  });
  
  // Deleted users data
  const { data: deletedUsers = [], isLoading: isDeletedUsersLoading, refetch: refetchDeletedUsers } = useQuery({
    queryKey: ['/api/admin/deleted-users'],
    enabled: tab === "deleted-users"
  });

  // Payment analytics query
  const { data: paymentAnalytics, isLoading: isPaymentAnalyticsLoading } = useQuery({
    queryKey: ['/api/admin/payment-analytics'],
    enabled: tab === "payments" || tab === "summary"
  });

  // Render the appropriate tab content based on the URL parameter
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Helmet>
        <title>Admin Dashboard | BambooMade</title>
      </Helmet>
      
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        
        <AdminTabs value={tab}>
          {/* Session Management tabs */}
          {["pending", "confirmed", "completed", "cancelled", "all"].map((statusTab) => {
            // Generate display name with first letter capitalized
            const displayName = statusTab.charAt(0).toUpperCase() + statusTab.slice(1);
            
            // Set empty message based on tab
            const emptyMessage = statusTab === "all" 
              ? "No sessions found" 
              : `No ${statusTab} sessions found`;
            
            // Filter sessions based on tab if it's the "all" tab
            const displaySessions = statusTab === "all" 
              ? sessions 
              : sessions.filter(s => s.status === statusTab);
              
            return (
              <TabsContent key={statusTab} value={statusTab} className="space-y-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-0.5">
                      <CardTitle className="text-lg">{displayName} Sessions</CardTitle>
                      <CardDescription>
                        View and manage {statusTab} project guidance sessions
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RefreshSessionsButton tab={statusTab} />
                      
                      {statusTab === "all" && (
                        <FixFailedSessionsButton />
                      )}
                      
                      {statusTab === "confirmed" && (
                        <MarkCompletedSessionsButton />
                      )}
                      
                      {statusTab === "pending" && (
                        <PaymentMapperDialog />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isSessionsLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
                      </div>
                    ) : displaySessions.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>{emptyMessage}</p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pb-1">
                          <Table className="min-w-[700px]">
                            <TableHeader className="bg-gray-800 sticky top-0 z-10">
                              <TableRow className="hover:bg-gray-800/80">
                                <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span>Student</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 hidden sm:table-cell py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span>Date</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span>Payment</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 hidden lg:table-cell py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span>Topic</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 hidden sm:table-cell py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span>Status</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-gray-300 text-right py-2 px-2 sm:px-4 whitespace-nowrap">
                                  <span>Actions</span>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {displaySessions.map((session) => (
                                <TableRow key={session.id} className="hover:bg-gray-800/40 border-gray-800">
                                  <TableCell className="py-2 px-2 sm:px-4">
                                    <div className="flex flex-col">
                                      <span className="font-medium">{session.studentName}</span>
                                      <span className="text-xs text-gray-400">{session.email}</span>
                                      
                                      {/* Date shown on mobile */}
                                      <div className="flex flex-col space-y-1 mt-1 sm:hidden">
                                        <span className="text-[10px] text-gray-400">
                                          {formatSessionDate(session.sessionDate)}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          {session.duration} mins
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell py-2 px-2 sm:px-4">
                                    <div className="flex flex-col">
                                      <span>{formatSessionDate(session.sessionDate)}</span>
                                      <span className="text-xs text-gray-400">{session.duration} mins</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 px-2 sm:px-4">
                                    <div className="flex flex-col">
                                      <div className="flex items-center">
                                        <span className="font-medium">₹{session.amount}</span>
                                        
                                        {session.paymentId && (
                                          <Button 
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 ml-1"
                                            onClick={() => {
                                              navigator.clipboard.writeText(session.paymentId);
                                              toast({
                                                title: "Payment ID copied",
                                                description: "Payment ID has been copied to clipboard",
                                              });
                                            }}
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      
                                      {session.status === "pending" && (
                                        <div className="mt-1">
                                          {session.paymentId ? (
                                            <Badge variant="success" className="text-[10px] bg-green-800/30 hover:bg-green-800/50 border-green-600/40 text-green-400">
                                              <span className="sm:hidden">Paid</span>
                                              <span className="hidden sm:inline">Payment confirmed</span>
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-600/40 text-yellow-500 bg-yellow-950/20">
                                              <span className="sm:hidden">Verify</span>
                                              <span className="hidden sm:inline">Verification pending</span>
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                      
                                      {session.refundStatus && (
                                        <div className="mt-1">
                                          <Badge 
                                            variant={session.refundStatus === "completed" ? "success" : "outline"}
                                            className={cn(
                                              "text-[10px] px-1 py-0",
                                              session.refundStatus === "completed" 
                                                ? "bg-blue-800/30 hover:bg-blue-800/50 border-blue-600/40 text-blue-400"
                                                : "border-orange-600/40 text-orange-500 bg-orange-950/20"
                                            )}
                                          >
                                            {session.refundStatus === "completed" ? "Refunded" : "Processing Refund"}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell py-2 px-2 sm:px-4">
                                    <div>
                                      <span className="line-clamp-2">{session.topic}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    <Badge 
                                      variant="outline"
                                      className="capitalize text-xs whitespace-nowrap"
                                    >
                                      {session.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right py-2 px-2 sm:px-4">
                                    <div className="sm:hidden mt-1">
                                      <Badge 
                                        variant="outline"
                                        className="capitalize text-[10px]"
                                      >
                                        {session.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-end space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[10px] sm:text-xs px-2"
                                        onClick={() => {
                                          // Session management action
                                        }}
                                      >
                                        Manage
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
          
          {/* Payment Analytics tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Payment Analytics</CardTitle>
                <CardDescription>
                  View payment analytics and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isPaymentAnalyticsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <PaymentAnalytics data={paymentAnalytics} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User Management tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <CardTitle className="text-lg">User Management</CardTitle>
                    <CardDescription>
                      Manage user accounts and permissions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isUsersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pb-1">
                      <Table className="min-w-[600px]">
                        <TableHeader className="bg-gray-800 sticky top-0 z-10">
                          <TableRow className="hover:bg-gray-800/80">
                            <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">User ID</TableHead>
                            <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">Name</TableHead>
                            <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">Email</TableHead>
                            <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-gray-800/40 border-gray-800">
                              <TableCell className="font-mono text-xs sm:text-sm text-gray-400">{user.id}</TableCell>
                              <TableCell>{user.fullName || <span className="text-gray-500 italic">Not provided</span>}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] sm:text-xs px-2"
                                    onClick={() => {
                                      // User management action
                                    }}
                                  >
                                    Manage
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Deleted Users tab */}
          <TabsContent value="deleted-users" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Deleted Users</CardTitle>
                <CardDescription>
                  View and restore deleted user accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isDeletedUsersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : deletedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No deleted users found</p>
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pb-1">
                      <Table className="min-w-[600px]">
                        <TableHeader className="bg-gray-800 sticky top-0 z-10">
                          <TableRow className="hover:bg-gray-800/80">
                            <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">User ID</TableHead>
                            <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">Name</TableHead>
                            <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">Email</TableHead>
                            <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">Deleted At</TableHead>
                            <TableHead className="text-gray-300 py-2 px-2 sm:px-4 whitespace-nowrap">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deletedUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-gray-800/40 border-gray-800">
                              <TableCell className="font-mono text-xs sm:text-sm text-gray-400">{user.id}</TableCell>
                              <TableCell>{user.fullName || <span className="text-gray-500 italic">Not provided</span>}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{formatSessionDate(user.deletedAt)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] sm:text-xs px-2"
                                    onClick={() => {
                                      // Restore user action
                                    }}
                                  >
                                    Restore
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Database tab placeholder */}
          <TabsContent value="database" className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Database</CardTitle>
                <CardDescription>
                  Manage AI training data and knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-amber-400">
                  <p>Please navigate to the AI Knowledge Database page to manage content</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/ai-knowledge-database")}
                  >
                    Open Knowledge Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </AdminTabs>
      </div>
    </div>
  );
}