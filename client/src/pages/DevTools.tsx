import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { JSONTree } from "react-json-tree";

// Only show this component in development mode
const isDev = process.env.NODE_ENV === 'development';

const SessionDebugger = () => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSessionData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/session');
      const data = await response.json();
      setSessionData(data);
      toast({
        title: "Session data fetched",
        description: "Successfully retrieved session information"
      });
    } catch (error) {
      console.error("Error fetching session data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch session data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSessionData = () => {
    setSessionData(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Session Debugger</CardTitle>
        <CardDescription>Examine the current session state</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={fetchSessionData} disabled={isLoading}>
              {isLoading ? "Loading..." : "Fetch Session Data"}
            </Button>
            <Button variant="outline" onClick={clearSessionData} disabled={!sessionData}>
              Clear
            </Button>
          </div>
          
          {sessionData && (
            <div className="mt-4 bg-slate-900 rounded-md p-4 overflow-auto max-h-[400px]">
              <JSONTree data={sessionData} theme={{
                scheme: 'monokai',
                author: 'wimer hazenberg (http://www.monokai.nl)',
                base00: '#272822',
                base01: '#383830',
                base02: '#49483e',
                base03: '#75715e',
                base04: '#a59f85',
                base05: '#f8f8f2',
                base06: '#f5f4f1',
                base07: '#f9f8f5',
                base08: '#f92672',
                base09: '#fd971f',
                base0A: '#f4bf75',
                base0B: '#a6e22e',
                base0C: '#a1efe4',
                base0D: '#66d9ef',
                base0E: '#ae81ff',
                base0F: '#cc6633'
              }} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const LoginTester = () => {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const sendVerificationCode = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/request-login-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Verification Code Sent",
          description: "Verification code sent to your email"
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send verification code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyCode = async () => {
    if (!email || !verificationCode) {
      toast({
        title: "Error",
        description: "Please enter both email and verification code",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: verificationCode }),
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Successfully logged in"
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to verify code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const masterCodes = [
    { label: "123456 (Master)", value: "123456" }
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Login Tester</CardTitle>
        <CardDescription>Test authentication flow</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm">Email</label>
            <div className="flex space-x-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter email"
              />
              <Button onClick={sendVerificationCode} disabled={isLoading || !email}>
                Send Code
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm">Verification Code</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter verification code"
              />
              <Button onClick={verifyCode} disabled={isLoading || !email || !verificationCode}>
                Verify
              </Button>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Quick Codes:</h3>
            <div className="flex flex-wrap gap-2">
              {masterCodes.map((code, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm"
                  onClick={() => setVerificationCode(code.value)}
                >
                  {code.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DevTools: React.FC = () => {
  // Prevent rendering in production
  if (!isDev) {
    return <div className="container py-10">This page is only available in development mode.</div>;
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Tools</h1>
          <p className="text-muted-foreground mt-2">
            Utilities to help with development and debugging (only visible in dev mode)
          </p>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4 mb-6">
          <div className="text-amber-500 font-medium flex items-center">
            <span className="mr-2">⚠️</span> Development Mode Only
          </div>
          <p className="text-amber-400/70 text-sm mt-1">
            These tools are only available in development mode and will not be accessible in production.
          </p>
        </div>
        
        <Tabs defaultValue="session" className="w-full">
          <TabsList>
            <TabsTrigger value="session">Session Debugger</TabsTrigger>
            <TabsTrigger value="login">Login Tester</TabsTrigger>
          </TabsList>
          <TabsContent value="session" className="mt-4">
            <SessionDebugger />
          </TabsContent>
          <TabsContent value="login" className="mt-4">
            <LoginTester />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DevTools;