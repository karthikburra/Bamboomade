import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import UserLoginForm from "@/components/UserLoginForm";

const Login: React.FC = () => {
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
                Enter your email to continue to AI chat, project guidance, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserLoginForm onSuccess={() => window.location.href = "/"} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Login;
