import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Session {
  id: number;
  formattedDate: string;
  formattedTime: string;
  email: string;
  topic: string;
  duration: number;
  paymentStatus: string;
  studentName: string;
  status: string;
}

export default function AllSessions() {
  // Fetch all sessions
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/all-sessions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/all-sessions");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-destructive/10">
          <CardHeader>
            <CardTitle>Error Loading Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error instanceof Error ? error.message : "Failed to load sessions"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessions = data?.sessions || [];

  return (
    <>
      <Helmet>
        <title>All Sessions | BambooMade</title>
        <meta name="description" content="View all project guidance sessions" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">All Project Guidance Sessions</h1>
          <a href="/project-guidance" className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium">
            Back to Booking
          </a>
        </div>
        <p className="text-muted-foreground mb-6">
          This is a temporary admin view to see all sessions in the system without email verification.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Sessions ({sessions.length})</CardTitle>
            <CardDescription>
              All booked project guidance sessions in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium">No sessions found</p>
                <p className="text-muted-foreground">No project guidance sessions have been booked yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>List of all project guidance sessions</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session: Session) => (
                      <TableRow key={session.id}>
                        <TableCell>{session.id}</TableCell>
                        <TableCell className="font-medium">{session.studentName}</TableCell>
                        <TableCell>{session.email}</TableCell>
                        <TableCell>{session.formattedDate}</TableCell>
                        <TableCell>{session.formattedTime}</TableCell>
                        <TableCell>{session.topic}</TableCell>
                        <TableCell>{session.duration} min</TableCell>
                        <TableCell>
                          <Badge 
                            variant={session.paymentStatus === 'Paid' ? "default" : "outline"}
                            className={session.paymentStatus === 'Paid' ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {session.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              session.status === 'cancelled' 
                                ? "destructive" 
                                : session.status === 'completed' 
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {session.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}