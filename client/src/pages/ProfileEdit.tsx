import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, User, Upload } from "lucide-react";

const ProfileEdit: React.FC = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get current user data
  const { data: user, isLoading, error } = useQuery<{
    id: number;
    username: string;
    email: string;
    fullName: string | null;
    phoneNumber: string | null;
    profileImageUrl: string | null;
    needsProfileCompletion?: boolean;
  }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  // Show welcome toast for first-time users
  useEffect(() => {
    if (user?.needsProfileCompletion) {
      toast({
        title: "Welcome to BambooMade!",
        description: "Please complete your profile to continue. Full name is required.",
        duration: 6000,
      });
    }
  }, [user, toast]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
      
      // Redirect to login page
      navigate("/login");
    }
  }, [error, navigate, toast]);
  
  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhoneNumber(user.phoneNumber || "");
      if (user.profileImageUrl) {
        setImagePreview(user.profileImageUrl);
      }
    }
  }, [user]);
  
  // Handle profile image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Validate fullName is not empty (required field)
      if (!fullName.trim()) {
        toast({
          title: "Full Name Required",
          description: "Please enter your full name to continue.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      let profileImageUrl = user?.profileImageUrl || null;
      
      // Upload image if selected
      if (profileImage) {
        setIsUploading(true);
        
        // Create form data
        const formData = new FormData();
        formData.append("profileImage", profileImage);
        
        // Upload image
        const uploadResponse = await fetch("/api/profile/upload-image", {
          method: "POST",
          body: formData,
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResponse.ok) {
          profileImageUrl = uploadResult.imageUrl;
        } else {
          throw new Error(uploadResult.message || "Failed to upload image");
        }
        
        setIsUploading(false);
      }
      
      // Update profile
      const response = await apiRequest("POST", "/api/profile/update", {
        fullName,
        phoneNumber,
        profileImageUrl,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully!",
        });
        
        // Redirect to home page after successful update
        navigate("/");
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          <p className="text-green-300">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Edit Profile | BambooMade</title>
        <meta name="description" content="Update your BambooMade profile information" />
      </Helmet>
      
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-green-300 mb-8 text-center">Edit Your Profile</h1>
        
        {user?.needsProfileCompletion && (
          <div className="bg-green-700/20 border border-green-700 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-300 mb-2">Welcome to BambooMade!</h2>
            <p className="text-green-100">
              Please complete your profile to continue using the platform. 
              <span className="font-bold"> Full name is required</span>, other fields are optional.
            </p>
          </div>
        )}
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-green-300">Personal Information</CardTitle>
            <CardDescription>
              Update your profile information below. Only your email cannot be changed.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 border-2 border-green-600 flex items-center justify-center">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-500" />
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Label
                    htmlFor="profileImage"
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-700 hover:bg-green-800 transition-colors cursor-pointer text-white"
                  >
                    <Upload className="w-4 h-4" />
                    {imagePreview ? "Change Picture" : "Upload Picture"}
                  </Label>
                  <p className="text-center text-xs text-gray-500 mt-2">(optional)</p>
                </div>
              </div>
              
              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-green-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-800 border-gray-700 text-gray-400"
                />
                <p className="text-xs text-gray-500">Email address cannot be changed</p>
              </div>
              
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-green-300">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`bg-gray-800 border-gray-700 ${!fullName.trim() ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {!fullName.trim() && (
                  <p className="text-xs text-red-500">Full name is required</p>
                )}
              </div>
              
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-green-300">
                  Phone Number <span className="text-gray-500 text-xs">(optional)</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="border-green-700 text-green-300 hover:bg-green-900/20"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSaving || isUploading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {(isSaving || isUploading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploading ? "Uploading..." : isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
};

export default ProfileEdit;