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
      // Check if user needs to complete their profile (new users without fullName)
      if (userData.needsProfileCompletion) {
        console.log("New user needs to complete profile. Redirecting to profile edit page.");
        window.location.href = "/profile/edit";
      } else {
        // Returning users or users with completed profiles go to home page
        console.log("User already logged in. Redirecting to home page.");
        window.location.href = "/";
      }
    }
  }, [userData, isLoading]);

  return (
    <>
      <Helmet>
        <title>Login | BambooMade</title>
        <meta name="description" content="Login to your BambooMade account to access AI chat, project guidance sessions, and more." />
      </Helmet>
      
      <div className="bg-background py-16">
        <div className="container px-4 sm:px-6 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Login Card */}
            <div className="w-full lg:w-1/2 max-w-xl mx-auto lg:mx-0">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Welcome to BambooMade</CardTitle>
                  <CardDescription>
                    Enter your email to continue to AI chat, project guidance, and more.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserLoginForm onSuccess={() => window.location.href = "/"} />
                  
                  {/* Benefits on mobile only */}
                  <div className="mt-8 pt-6 border-t lg:hidden">
                    <h3 className="text-lg font-semibold text-center mb-4">Benefits of Creating an Account</h3>
                    <div className="grid gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg flex items-start">
                        <div className="mr-2 mt-0.5 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"/><path d="M12 17.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"/><path d="M12 7.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"/><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/></svg>
                        </div>
                        <div>
                          <span className="font-medium">6 Months Free Bamboo One Access</span>
                          <p className="text-sm text-muted-foreground">Get 6 months of free access to our bamboo architecture AI assistant from your registration date.</p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-primary/10 rounded-lg flex items-start">
                        <div className="mr-2 mt-0.5 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/></svg>
                        </div>
                        <div>
                          <span className="font-medium">Complete Bamboo Knowledge Hub</span>
                          <p className="text-sm text-muted-foreground">Access our full library of bamboo architecture information, techniques, and inspiration.</p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-primary/10 rounded-lg flex items-start">
                        <div className="mr-2 mt-0.5 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m14.5 9-5 5"/><path d="m9.5 9 5 5"/></svg>
                        </div>
                        <div>
                          <span className="font-medium">Project Guidance Booking</span>
                          <p className="text-sm text-muted-foreground">Book expert guidance sessions for your bamboo architecture projects and track them from your account.</p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-primary/10 rounded-lg flex items-start">
                        <div className="mr-2 mt-0.5 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                        </div>
                        <div>
                          <span className="font-medium">Priority Support</span>
                          <p className="text-sm text-muted-foreground">Get priority support and responses from our team of bamboo architecture experts.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Benefits Card - Desktop Only */}
            <div className="hidden lg:block w-1/2 sticky top-24">
              <Card className="bg-gradient-to-br from-green-800/20 to-lime-700/10 border-green-700/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-green-50">
                    Benefits of Creating an Account
                  </CardTitle>
                  <CardDescription className="text-center text-green-200/80">
                    Join BambooMade today and unlock these exclusive features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-green-500/20 shadow-lg flex items-start">
                      <div className="mr-4 p-3 bg-green-600 rounded-full text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"/><path d="M12 17.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"/><path d="M12 7.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"/><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-green-50 mb-2">6 Months Free Bamboo One Access</h3>
                        <p className="text-green-200/80">Get 6 months of free access to our bamboo architecture AI assistant from your registration date. Ask questions, get design help, and learn about sustainable bamboo construction.</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-green-500/20 shadow-lg flex items-start">
                      <div className="mr-4 p-3 bg-green-600 rounded-full text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-green-50 mb-2">Complete Knowledge Hub</h3>
                        <p className="text-green-200/80">Access our full library of bamboo architecture information, techniques, and inspiration. Browse through case studies, tutorials, and design resources.</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-green-500/20 shadow-lg flex items-start">
                      <div className="mr-4 p-3 bg-green-600 rounded-full text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m14.5 9-5 5"/><path d="m9.5 9 5 5"/></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-green-50 mb-2">Project Guidance Booking</h3>
                        <p className="text-green-200/80">Book expert guidance sessions for your bamboo architecture projects and track them from your account. Get personalized feedback from experienced professionals.</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-green-500/20 shadow-lg flex items-start">
                      <div className="mr-4 p-3 bg-green-600 rounded-full text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-green-50 mb-2">Priority Support</h3>
                        <p className="text-green-200/80">Get priority support and responses from our team of bamboo architecture experts. We're here to help you succeed with your sustainable building projects.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
