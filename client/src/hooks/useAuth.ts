import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useToast } from "./use-toast";

/**
 * A hook to manage user authentication state and operations
 * Updated to support email-only authentication flow
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Initiate email verification login process
  const requestLoginCode = useMutation({
    mutationFn: async (data: { email: string }) => {
      return apiRequest("POST", "/api/auth/request-login-code", data);
    },
    onSuccess: () => {
      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Code",
        description: error instanceof Error ? error.message : "Could not send verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete login with verification code
  const loginWithCode = useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      return apiRequest("POST", "/api/auth/verify-login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Login Successful",
        description: "Welcome to BambooMade!",
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Legacy login (to be deprecated)
  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return apiRequest("POST", "/api/auth/login", credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Login Successful",
        description: "Welcome back to BambooMade!",
      });
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Legacy registration (to be deprecated)
  const register = useMutation({
    mutationFn: async (userData: { email: string; username: string; password: string }) => {
      return apiRequest("POST", "/api/auth/register", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Registration Successful",
        description: "Welcome to BambooMade! You can now log in.",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Register with email only
  const registerWithEmail = useMutation({
    mutationFn: async (userData: { email: string }) => {
      return apiRequest("POST", "/api/auth/register-with-email", userData);
    },
    onSuccess: () => {
      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code to complete registration.",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Logout Failed",
        description: error instanceof Error ? error.message : "An error occurred during logout.",
        variant: "destructive",
      });
    }
  });

  return {
    user,
    isLoading,
    isError,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    
    // New email-only login methods
    requestLoginCode: requestLoginCode.mutate,
    isRequestingCode: requestLoginCode.isPending,
    loginWithCode: loginWithCode.mutate,
    isVerifyingCode: loginWithCode.isPending,
    
    // New email-only registration method
    registerWithEmail: registerWithEmail.mutate,
    isRegisteringWithEmail: registerWithEmail.isPending,
    
    // Legacy methods (to be deprecated)
    login: login.mutate,
    isLoginPending: login.isPending,
    register: register.mutate,
    isRegisterPending: register.isPending,
    
    // Logout
    logout: logout.mutate,
    isLogoutPending: logout.isPending,
  };
}