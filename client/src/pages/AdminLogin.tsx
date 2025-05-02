import { useState } from "react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email").refine(
    (email) => email.toLowerCase() === "info@bamboomade.in",
    {
      message: "Only BambooMade admin email is allowed",
    }
  ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const AdminLogin = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: login, isPending } = useMutation({
    mutationFn: async (data: AdminLoginFormValues) => {
      return apiRequest("POST", "/api/auth/admin-login", data);
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome to the BambooMade admin panel",
      });
      setLocation("/admin-dashboard");
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      setAuthError(error?.message || "Invalid credentials. Please try again.");
      toast({
        title: "Login Failed",
        description: error?.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AdminLoginFormValues) => {
    setAuthError(null);
    login(values);
  };

  return (
    <>
      <Helmet>
        <title>Admin Login | BambooMade</title>
        <meta name="description" content="Admin login page for BambooMade" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="bg-background py-12 min-h-screen flex items-center">
        <div className="container max-w-md mx-auto px-4">
          <Card className="border-primary/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
              <CardDescription className="text-center">
                Secure access for BambooMade administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authError && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-start mb-4">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{authError}</p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="info@bamboomade.in"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                  >
                    {isPending ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;