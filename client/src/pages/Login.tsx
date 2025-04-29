import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import UserLoginForm from "@/components/UserLoginForm";
import UserRegisterForm from "@/components/UserRegisterForm";

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Fetch current user data to check if already logged in
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });
  
  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && userData) {
      window.location.href = "/";
    }
  }, [userData, isLoading]);

  return (
    <>
      <Helmet>
        <title>Login | BambooMade</title>
        <meta name="description" content="Login to your BambooMade account to access AI chat, project guidance sessions, and more." />
      </Helmet>
      
      <div className="bg-background py-16">
        <div className="container max-w-md px-4 sm:px-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to BambooMade</CardTitle>
              <CardDescription>
                Sign in to access AI chat, book project guidance, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <UserLoginForm onSuccess={() => window.location.href = "/"} />
                </TabsContent>
                <TabsContent value="register">
                  <UserRegisterForm onSuccess={() => setActiveTab("login")} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Login;
