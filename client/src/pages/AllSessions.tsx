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
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { CheckCircle, Loader2, Calendar, Clock, User, Tag, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

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
      // Direct fetch without any email verification
      const response = await apiRequest("GET", "/api/all-sessions");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen dark bg-gray-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 dark bg-gray-950 text-white min-h-screen">
        <Card className="p-6 bg-red-900/30 border-red-800">
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

  // Display all sessions directly
  const sessions = data?.sessions || [];

  return (
    <div className="min-h-screen dark bg-gray-950 text-white pt-8 pb-12">
      <Helmet>
        <title>Your Sessions | BambooMade</title>
        <meta name="description" content="View your project guidance sessions" />
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href="/project-guidance">
            <Button variant="ghost" className="mr-4 p-2" aria-label="Back to Project Guidance">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Your Project Guidance Sessions</h1>
        </div>
        
        {/* Direct access to sessions - No email verification required */}
        <Card className="mb-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Your Recent Sessions</CardTitle>
            <CardDescription>
              View and manage all your booked project guidance sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <Link href="/project-guidance">
                <Button className="bg-green-600 hover:bg-green-700">
                  Book a New Session
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>No Sessions Found</CardTitle>
              <CardDescription>
                No project guidance sessions have been booked yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-gray-400 mb-4">Would you like to book a new session?</p>
              <Link href="/project-guidance">
                <Button className="bg-green-600 hover:bg-green-700">
                  Book a Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="text-xl font-medium mb-4">
              All Sessions ({sessions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {sessions.map((session: Session) => (
                <Card key={session.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{session.topic}</CardTitle>
                      <Badge 
                        variant={
                          session.status === 'cancelled' 
                            ? "destructive" 
                            : session.status === 'completed' 
                              ? "secondary"
                              : "default"
                        }
                        className="capitalize"
                      >
                        {session.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Session #{session.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-green-500" />
                      <span>{session.formattedDate}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-green-500" />
                      <span>{session.formattedTime} ({session.duration} minutes)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="mr-2 h-4 w-4 text-green-500" />
                      <span>{session.studentName}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Tag className="mr-2 h-4 w-4 text-green-500" />
                      <Badge 
                        variant={session.paymentStatus === 'Paid' ? "default" : "outline"}
                        className={session.paymentStatus === 'Paid' ? "bg-green-700 hover:bg-green-600" : ""}
                      >
                        {session.paymentStatus}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-800/50 pt-3 flex justify-end">
                    <Link href={`/project-guidance?session=${session.id}`}>
                      <Button 
                        variant="outline" 
                        className="border-green-700 text-green-500 hover:bg-green-900/30"
                        disabled={session.status === 'cancelled'}
                      >
                        Manage Session
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/project-guidance">
            <Button className="bg-green-600 hover:bg-green-700">
              Back to Project Guidance
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}