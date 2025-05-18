import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Calendar, Book, MessageSquare, FileText, 
  Info, Upload, Save, Check, Globe, User, Trophy
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/useAuth';

const ManualContentEntry = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("event");

  // Event form state
  const [eventData, setEventData] = useState({
    title: '',
    content: '',
    mediaUrl: '',
    registrationLink: '',
    eventDate: '',
    eventLocation: '',
    organiserName: '',
    price: ''
  });

  // Blog form state
  const [blogData, setBlogData] = useState({
    title: '',
    content: '',
    mediaUrl: '',
    source: ''
  });

  // Book form state
  const [bookData, setBookData] = useState({
    title: '',
    content: '',
    mediaUrl: '',
    purchaseLink: '',
    author: ''
  });

  // Social Media form state
  const [socialData, setSocialData] = useState({
    title: '',
    content: '',
    embedCode: ''
  });

  // Document form state
  const [documentData, setDocumentData] = useState({
    title: '',
    content: '',
    mediaUrl: '',
    downloadLink: ''
  });

  // Website form state
  const [websiteData, setWebsiteData] = useState({
    title: '',
    content: '',
    websiteUrl: '',
    mediaUrl: '',
    organizationName: '',
    description: ''
  });
  
  // Bamboo Fact form state
  const [factData, setFactData] = useState({
    fact: '',
    source: ''
  });
  
  // Bamboo Enthusiast form state
  const [enthusiastData, setEnthusiastData] = useState({
    title: '',
    content: '',
    mediaUrl: '',
    contactEmail: '',
    contactPhone: '',
    linkedinUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    facebookUrl: '',
    personalWebsite: ''
  });
  
  // Competition form state
  const [competitionData, setCompetitionData] = useState({
    title: '',
    content: '',
    mediaUrl: '',
    registrationLink: '',
    eventDate: '',
    eventLocation: '',
    price: '',
    organiserName: '',
    submissionDeadline: ''
  });

  // Handle input changes for different form types
  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlogChange = (e) => {
    const { name, value } = e.target;
    setBlogData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookChange = (e) => {
    const { name, value } = e.target;
    setBookData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setSocialData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (e) => {
    const { name, value } = e.target;
    setDocumentData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleWebsiteChange = (e) => {
    const { name, value } = e.target;
    setWebsiteData(prev => ({ ...prev, [name]: value }));
  };

  const handleFactChange = (e) => {
    const { name, value } = e.target;
    setFactData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEnthusiastChange = (e) => {
    const { name, value } = e.target;
    setEnthusiastData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCompetitionChange = (e) => {
    const { name, value } = e.target;
    setCompetitionData(prev => ({ ...prev, [name]: value }));
  };

  // File upload handlers
  const handleFileUpload = (e, setFormData, formData) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a FormData object to send the file
    const formDataObj = new FormData();
    formDataObj.append('file', file);

    // Set loading state if needed
    
    // Upload the file
    fetch('/api/upload-media', {
      method: 'POST',
      body: formDataObj,
    })
      .then(response => response.json())
      .then(data => {
        if (data.url) {
          setFormData({ ...formData, mediaUrl: data.url });
          toast({
            title: "Image uploaded",
            description: "Your image has been successfully uploaded.",
          });
        } else {
          toast({
            title: "Upload failed",
            description: data.message || "There was an error uploading your image.",
            variant: "destructive",
          });
        }
      })
      .catch(error => {
        toast({
          title: "Upload error",
          description: "There was an error uploading your image.",
          variant: "destructive",
        });
        console.error("Upload error:", error);
      });
  };

  // Submit mutations for different content types
  const addContentMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', '/api/ai-knowledge', data),
    onSuccess: () => {
      toast({
        title: "Content added",
        description: "The content has been successfully added to the knowledge base.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      
      // Reset form based on active tab
      switch (activeTab) {
        case 'event':
          setEventData({
            title: '',
            content: '',
            mediaUrl: '',
            registrationLink: '',
            eventDate: '',
            eventLocation: '',
            organiserName: '',
            price: ''
          });
          break;
        case 'blog':
          setBlogData({
            title: '',
            content: '',
            mediaUrl: '',
            source: ''
          });
          break;
        case 'book':
          setBookData({
            title: '',
            content: '',
            mediaUrl: '',
            purchaseLink: '',
            author: ''
          });
          break;
        case 'social':
          setSocialData({
            title: '',
            content: '',
            embedCode: ''
          });
          break;
        case 'document':
          setDocumentData({
            title: '',
            content: '',
            mediaUrl: '',
            downloadLink: ''
          });
          break;
        case 'fact':
          setFactData({
            fact: '',
            source: ''
          });
          break;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add content. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding content:", error);
    }
  });

  // Submit handlers for each content type
  const handleEventSubmit = (e) => {
    e.preventDefault();
    if (!eventData.title || !eventData.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const contentData = {
      title: eventData.title,
      content: eventData.content,
      contentType: 'event',
      mediaUrl: eventData.mediaUrl || null,
      eventDate: eventData.eventDate || null,
      eventLocation: eventData.eventLocation || null,
      registrationLink: eventData.registrationLink || null,
      price: eventData.price || null,
      // Include organiser name in the content if provided
      additionalInfo: eventData.organiserName ? `Organiser: ${eventData.organiserName}` : null,
      createdBy: user?.id || 1,
      status: 'active'
    };

    addContentMutation.mutate(contentData);
  };
  
  // Bamboo Enthusiast submit handler
  const handleEnthusiastSubmit = (e) => {
    e.preventDefault();
    if (!enthusiastData.title || !enthusiastData.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const contentData = {
      title: enthusiastData.title,
      content: enthusiastData.content,
      contentType: 'enthusiast',
      mediaUrl: enthusiastData.mediaUrl || null,
      contactEmail: enthusiastData.contactEmail || null,
      contactPhone: enthusiastData.contactPhone || null,
      linkedinUrl: enthusiastData.linkedinUrl || null,
      instagramUrl: enthusiastData.instagramUrl || null,
      twitterUrl: enthusiastData.twitterUrl || null,
      facebookUrl: enthusiastData.facebookUrl || null,
      personalWebsite: enthusiastData.personalWebsite || null,
      createdBy: user?.id || 1,
      status: 'active'
    };

    addContentMutation.mutate(contentData);
  };
  
  // Competition submit handler
  const handleCompetitionSubmit = (e) => {
    e.preventDefault();
    if (!competitionData.title || !competitionData.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const contentData = {
      title: competitionData.title,
      content: competitionData.content,
      contentType: 'competition',
      mediaUrl: competitionData.mediaUrl || null,
      eventDate: competitionData.eventDate || null,
      eventLocation: competitionData.eventLocation || null,
      registrationLink: competitionData.registrationLink || null,
      price: competitionData.price || null,
      additionalInfo: `Organiser: ${competitionData.organiserName || 'Not specified'}\nSubmission Deadline: ${competitionData.submissionDeadline || 'Not specified'}`,
      createdBy: user?.id || 1,
      status: 'active'
    };

    addContentMutation.mutate(contentData);
  };

  const handleBlogSubmit = (e) => {
    e.preventDefault();
    if (!blogData.title || !blogData.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const contentData = {
      title: blogData.title,
      content: blogData.content,
      contentType: 'webpage',
      mediaUrl: blogData.mediaUrl || null,
      source: blogData.source || null,
      createdBy: user?.id || 1,
      status: 'active'
    };

    addContentMutation.mutate(contentData);
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!bookData.title || !bookData.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Add author information to the content if provided
    let enhancedContent = bookData.content;
    if (bookData.author) {
      enhancedContent = `Author: ${bookData.author}\n\n${enhancedContent}`;
    }

    const contentData = {
      title: bookData.title,
      content: enhancedContent,
      contentType: 'document',
      mediaUrl: bookData.mediaUrl || null,
      source: bookData.purchaseLink || null, // Using source field for purchase link
      createdBy: user?.id || 1,
      status: 'active'
    };

    addContentMutation.mutate(contentData);
  };

  const handleSocialSubmit = (e) => {
    e.preventDefault();
    if (!socialData.title || !socialData.embedCode) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const contentData = {
      title: socialData.title,
      content: socialData.content || socialData.title,
      contentType: 'social_media',
      embedCode: socialData.embedCode,
      createdBy: user?.id || 1,
      status: 'active'
    };

    addContentMutation.mutate(contentData);
  };

  const handleDocumentSubmit = (e) => {
    e.preventDefault();
    if (!documentData.title || !documentData.content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const contentData = {
      title: documentData.title,
      content: documentData.content,
      contentType: 'document',
      mediaUrl: documentData.mediaUrl || null,
      source: documentData.downloadLink || null,
      createdBy: user?.id || 1,
      status: 'active'
    };

    addContentMutation.mutate(contentData);
  };
  
  const handleWebsiteSubmit = (e) => {
    e.preventDefault();
    if (!websiteData.title || !websiteData.content || !websiteData.websiteUrl) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields (title, description, and website URL).",
        variant: "destructive",
      });
      return;
    }

    // Create enhanced content with organization info if provided
    let enhancedContent = websiteData.content;
    if (websiteData.organizationName) {
      enhancedContent = `Organization: ${websiteData.organizationName}\n\n${enhancedContent}`;
    }
    if (websiteData.description) {
      enhancedContent = `${enhancedContent}\n\n${websiteData.description}`;
    }

    const contentData = {
      title: websiteData.title,
      content: enhancedContent,
      contentType: 'webpage',
      mediaUrl: websiteData.mediaUrl || null,
      source: websiteData.websiteUrl || null,
      createdBy: user?.id || 1,
      status: 'active'
    };

    addContentMutation.mutate(contentData);
  };

  const handleFactSubmit = (e) => {
    e.preventDefault();
    if (!factData.fact) {
      toast({
        title: "Missing field",
        description: "Please enter a bamboo fact.",
        variant: "destructive",
      });
      return;
    }

    const contentData = {
      title: "Bamboo Fact",
      content: factData.fact,
      contentType: 'fact',
      source: factData.source || null,
      createdBy: user?.id || 1,
      status: 'active'
    };

    addContentMutation.mutate(contentData);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription>
            Please log in to add content to the knowledge base.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-950 text-gray-100">
      <div className="flex items-center mb-6">
        <Button 
          onClick={() => window.location.href = "/admin-dashboard"} 
          variant="outline" 
          className="mr-4 bg-gray-800 text-amber-400 border-amber-400 hover:bg-amber-900 hover:text-amber-200"
        >
          Back to Admin Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-amber-400">Add Knowledge Content</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-8 mb-8 bg-gray-900/80 border border-gray-800">
          <TabsTrigger value="event" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4" /> Event
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <MessageSquare className="h-4 w-4" /> Blog
          </TabsTrigger>
          <TabsTrigger value="book" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Book className="h-4 w-4" /> Book
          </TabsTrigger>
          <TabsTrigger value="website" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Globe className="h-4 w-4" /> Website
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <MessageSquare className="h-4 w-4" /> Social Media
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4" /> Document
          </TabsTrigger>
          <TabsTrigger value="fact" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Info className="h-4 w-4" /> Bamboo Fact
          </TabsTrigger>
          <TabsTrigger value="enthusiast" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <MessageSquare className="h-4 w-4" /> Enthusiast
          </TabsTrigger>
          <TabsTrigger value="competition" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4" /> Competition
          </TabsTrigger>
        </TabsList>
        
        {/* Event Form */}
        <TabsContent value="event">
          <Card className="bg-gray-900/80 border border-gray-800 shadow-xl text-gray-100">
            <CardHeader>
              <CardTitle className="text-amber-400">Add Event</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEventSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="event-title" className="text-gray-300">Event Title *</Label>
                  <Input 
                    id="event-title" 
                    name="title" 
                    value={eventData.title}
                    onChange={handleEventChange}
                    placeholder="Enter event title"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event-description" className="text-gray-300">Event Description *</Label>
                  <Textarea 
                    id="event-description" 
                    name="content"
                    value={eventData.content}
                    onChange={handleEventChange}
                    placeholder="Enter event description"
                    rows={5}
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Event Date</Label>
                    <Input 
                      id="event-date" 
                      name="eventDate"
                      value={eventData.eventDate}
                      onChange={handleEventChange}
                      placeholder="E.g., May 25, 2024 at 10:00 AM"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event-location">Event Location</Label>
                    <Input 
                      id="event-location" 
                      name="eventLocation"
                      value={eventData.eventLocation}
                      onChange={handleEventChange}
                      placeholder="Enter event location"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-registration">Registration Link</Label>
                    <Input 
                      id="event-registration" 
                      name="registrationLink"
                      value={eventData.registrationLink}
                      onChange={handleEventChange}
                      placeholder="Enter registration URL"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event-price">Price</Label>
                    <Input 
                      id="event-price" 
                      name="price"
                      value={eventData.price}
                      onChange={handleEventChange}
                      placeholder="E.g., ₹500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event-organiser">Organiser Name</Label>
                  <Input 
                    id="event-organiser" 
                    name="organiserName"
                    value={eventData.organiserName}
                    onChange={handleEventChange}
                    placeholder="Enter organiser name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event-image">Event Image</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="event-image" 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setEventData, eventData)}
                    />
                    {eventData.mediaUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" /> Image uploaded
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addContentMutation.isPending}
                >
                  {addContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Event
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Blog Form */}
        <TabsContent value="blog">
          <Card className="bg-gray-900/80 border border-gray-800 shadow-xl text-gray-100">
            <CardHeader>
              <CardTitle className="text-amber-400">Add Blog</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBlogSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blog-title">Blog Title *</Label>
                  <Input 
                    id="blog-title" 
                    name="title" 
                    value={blogData.title}
                    onChange={handleBlogChange}
                    placeholder="Enter blog title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blog-description">Blog Description *</Label>
                  <Textarea 
                    id="blog-description" 
                    name="content"
                    value={blogData.content}
                    onChange={handleBlogChange}
                    placeholder="Enter blog content"
                    rows={6}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blog-source">Source Link</Label>
                  <Input 
                    id="blog-source" 
                    name="source"
                    value={blogData.source}
                    onChange={handleBlogChange}
                    placeholder="Enter source URL"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blog-image">Blog Image</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="blog-image" 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setBlogData, blogData)}
                    />
                    {blogData.mediaUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" /> Image uploaded
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addContentMutation.isPending}
                >
                  {addContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Blog
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Website Form */}
        <TabsContent value="website">
          <Card className="bg-gray-900/80 border border-gray-800 shadow-xl text-gray-100">
            <CardHeader>
              <CardTitle className="text-amber-400">Add Website</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWebsiteSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website-title">Website Title *</Label>
                  <Input 
                    id="website-title" 
                    name="title" 
                    value={websiteData.title}
                    onChange={handleWebsiteChange}
                    placeholder="Enter website title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website-url">Website URL *</Label>
                  <Input 
                    id="website-url" 
                    name="websiteUrl" 
                    value={websiteData.websiteUrl}
                    onChange={handleWebsiteChange}
                    placeholder="Enter full website URL (https://example.com)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website-organization">Organization Name</Label>
                  <Input 
                    id="website-organization" 
                    name="organizationName" 
                    value={websiteData.organizationName}
                    onChange={handleWebsiteChange}
                    placeholder="Enter organization name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website-content">Content Description *</Label>
                  <Textarea 
                    id="website-content" 
                    name="content"
                    value={websiteData.content}
                    onChange={handleWebsiteChange}
                    placeholder="Enter brief content description"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website-description">Detailed Description</Label>
                  <Textarea 
                    id="website-description" 
                    name="description"
                    value={websiteData.description}
                    onChange={handleWebsiteChange}
                    placeholder="Enter detailed website description"
                    rows={5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website-logo">Logo/Image URL</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="website-logo" 
                      name="mediaUrl"
                      value={websiteData.mediaUrl}
                      onChange={handleWebsiteChange}
                      placeholder="Enter logo/image URL"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Enter a URL for the website logo or a representative image</p>
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={addContentMutation.isPending}
                >
                  {addContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Add Website"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Book Form */}
        <TabsContent value="book">
          <Card className="bg-gray-900/80 border border-gray-800 shadow-xl text-gray-100">
            <CardHeader>
              <CardTitle className="text-amber-400">Add Book</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="book-title">Book Title *</Label>
                  <Input 
                    id="book-title" 
                    name="title" 
                    value={bookData.title}
                    onChange={handleBookChange}
                    placeholder="Enter book title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="book-author">Author</Label>
                  <Input 
                    id="book-author" 
                    name="author" 
                    value={bookData.author}
                    onChange={handleBookChange}
                    placeholder="Enter author name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="book-description">Book Description *</Label>
                  <Textarea 
                    id="book-description" 
                    name="content"
                    value={bookData.content}
                    onChange={handleBookChange}
                    placeholder="Enter book description"
                    rows={5}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="book-purchase">Purchase Link</Label>
                  <Input 
                    id="book-purchase" 
                    name="purchaseLink"
                    value={bookData.purchaseLink}
                    onChange={handleBookChange}
                    placeholder="Enter purchase URL"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="book-image">Book Cover Image</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="book-image" 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setBookData, bookData)}
                    />
                    {bookData.mediaUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" /> Image uploaded
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addContentMutation.isPending}
                >
                  {addContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Book
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Social Media Form */}
        <TabsContent value="social">
          <Card className="bg-gray-900/80 border border-gray-800 shadow-xl text-gray-100">
            <CardHeader>
              <CardTitle className="text-amber-400">Add Social Media Content</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSocialSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="social-title">Title *</Label>
                  <Input 
                    id="social-title" 
                    name="title" 
                    value={socialData.title}
                    onChange={handleSocialChange}
                    placeholder="Enter post title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="social-description">Description</Label>
                  <Textarea 
                    id="social-description" 
                    name="content"
                    value={socialData.content}
                    onChange={handleSocialChange}
                    placeholder="Enter post description"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="social-embed">Embed Code *</Label>
                  <Textarea 
                    id="social-embed" 
                    name="embedCode"
                    value={socialData.embedCode}
                    onChange={handleSocialChange}
                    placeholder="Paste social media embed code"
                    rows={5}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addContentMutation.isPending}
                >
                  {addContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Social Media Content
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Document Form */}
        <TabsContent value="document">
          <Card className="bg-gray-900/80 border border-gray-800 shadow-xl text-gray-100">
            <CardHeader>
              <CardTitle className="text-amber-400">Add Document</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDocumentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-title">Document Title *</Label>
                  <Input 
                    id="document-title" 
                    name="title" 
                    value={documentData.title}
                    onChange={handleDocumentChange}
                    placeholder="Enter document title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document-description">Document Description *</Label>
                  <Textarea 
                    id="document-description" 
                    name="content"
                    value={documentData.content}
                    onChange={handleDocumentChange}
                    placeholder="Enter document description"
                    rows={5}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document-download">Download Link</Label>
                  <Input 
                    id="document-download" 
                    name="downloadLink"
                    value={documentData.downloadLink}
                    onChange={handleDocumentChange}
                    placeholder="Enter download URL"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document-image">Thumbnail Image</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="document-image" 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setDocumentData, documentData)}
                    />
                    {documentData.mediaUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" /> Image uploaded
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addContentMutation.isPending}
                >
                  {addContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Document
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Bamboo Fact Form */}
        <TabsContent value="fact">
          <Card className="bg-gray-900/80 border border-gray-800 shadow-xl text-gray-100">
            <CardHeader>
              <CardTitle className="text-amber-400">Add Bamboo Fact</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fact-content">Bamboo Fact *</Label>
                  <Textarea 
                    id="fact-content" 
                    name="fact"
                    value={factData.fact}
                    onChange={handleFactChange}
                    placeholder="Enter an interesting fact about bamboo"
                    rows={5}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fact-source">Source Link</Label>
                  <Input 
                    id="fact-source" 
                    name="source"
                    value={factData.source}
                    onChange={handleFactChange}
                    placeholder="Enter source URL"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addContentMutation.isPending}
                >
                  {addContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Bamboo Fact
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bamboo Enthusiast Form */}
        <TabsContent value="enthusiast">
          <Card className="bg-gray-900/80 border border-gray-800 shadow-xl text-gray-100">
            <CardHeader>
              <CardTitle className="text-amber-400">Add Bamboo Enthusiast</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEnthusiastSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="enthusiast-name" className="text-gray-300">Name *</Label>
                  <Input 
                    id="enthusiast-name" 
                    name="title" 
                    value={enthusiastData.title}
                    onChange={handleEnthusiastChange}
                    placeholder="Enter enthusiast name"
                    className="bg-gray-800 border-gray-700 text-gray-100" 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enthusiast-description" className="text-gray-300">Description *</Label>
                  <Textarea 
                    id="enthusiast-description" 
                    name="content" 
                    value={enthusiastData.content}
                    onChange={handleEnthusiastChange}
                    placeholder="Enter description about the enthusiast and their work with bamboo"
                    className="bg-gray-800 border-gray-700 text-gray-100 min-h-[100px]" 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enthusiast-email" className="text-gray-300">Email</Label>
                  <Input 
                    id="enthusiast-email" 
                    name="contactEmail" 
                    value={enthusiastData.contactEmail}
                    onChange={handleEnthusiastChange}
                    placeholder="Enter email address"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                    type="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enthusiast-phone" className="text-gray-300">Phone</Label>
                  <Input 
                    id="enthusiast-phone" 
                    name="contactPhone" 
                    value={enthusiastData.contactPhone}
                    onChange={handleEnthusiastChange}
                    placeholder="Enter phone number"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="enthusiast-linkedin" className="text-gray-300">LinkedIn</Label>
                    <Input 
                      id="enthusiast-linkedin" 
                      name="linkedinUrl" 
                      value={enthusiastData.linkedinUrl}
                      onChange={handleEnthusiastChange}
                      placeholder="LinkedIn profile URL"
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="enthusiast-instagram" className="text-gray-300">Instagram</Label>
                    <Input 
                      id="enthusiast-instagram" 
                      name="instagramUrl" 
                      value={enthusiastData.instagramUrl}
                      onChange={handleEnthusiastChange}
                      placeholder="Instagram profile URL"
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="enthusiast-twitter" className="text-gray-300">Twitter</Label>
                    <Input 
                      id="enthusiast-twitter" 
                      name="twitterUrl" 
                      value={enthusiastData.twitterUrl}
                      onChange={handleEnthusiastChange}
                      placeholder="Twitter profile URL"
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="enthusiast-facebook" className="text-gray-300">Facebook</Label>
                    <Input 
                      id="enthusiast-facebook" 
                      name="facebookUrl" 
                      value={enthusiastData.facebookUrl}
                      onChange={handleEnthusiastChange}
                      placeholder="Facebook profile URL"
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enthusiast-website" className="text-gray-300">Personal Website</Label>
                  <Input 
                    id="enthusiast-website" 
                    name="personalWebsite" 
                    value={enthusiastData.personalWebsite}
                    onChange={handleEnthusiastChange}
                    placeholder="Website URL"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enthusiast-image" className="text-gray-300">Profile Image</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="enthusiast-image" 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setEnthusiastData, enthusiastData)}
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                    {enthusiastData.mediaUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" /> Image uploaded
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={addContentMutation.isPending}
                >
                  {addContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Bamboo Enthusiast
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Competition Form */}
        <TabsContent value="competition">
          <Card className="bg-gray-900/80 border border-gray-800 shadow-xl text-gray-100">
            <CardHeader>
              <CardTitle className="text-amber-400">Add Competition</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompetitionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="competition-title" className="text-gray-300">Competition Title *</Label>
                  <Input 
                    id="competition-title" 
                    name="title" 
                    value={competitionData.title}
                    onChange={handleCompetitionChange}
                    placeholder="Enter competition title"
                    className="bg-gray-800 border-gray-700 text-gray-100" 
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="competition-description" className="text-gray-300">Description *</Label>
                  <Textarea 
                    id="competition-description" 
                    name="content" 
                    value={competitionData.content}
                    onChange={handleCompetitionChange}
                    placeholder="Enter competition details, requirements, and other important information"
                    className="bg-gray-800 border-gray-700 text-gray-100 min-h-[100px]" 
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="competition-date" className="text-gray-300">Event Date</Label>
                    <Input 
                      id="competition-date" 
                      name="eventDate" 
                      value={competitionData.eventDate}
                      onChange={handleCompetitionChange}
                      placeholder="E.g., June 15-20, 2025"
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="competition-deadline" className="text-gray-300">Submission Deadline</Label>
                    <Input 
                      id="competition-deadline" 
                      name="submissionDeadline" 
                      value={competitionData.submissionDeadline}
                      onChange={handleCompetitionChange}
                      placeholder="E.g., May 31, 2025"
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="competition-location" className="text-gray-300">Location</Label>
                  <Input 
                    id="competition-location" 
                    name="eventLocation" 
                    value={competitionData.eventLocation}
                    onChange={handleCompetitionChange}
                    placeholder="Enter event location or 'Virtual'"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="competition-registration" className="text-gray-300">Registration Link</Label>
                    <Input 
                      id="competition-registration" 
                      name="registrationLink" 
                      value={competitionData.registrationLink}
                      onChange={handleCompetitionChange}
                      placeholder="Enter registration URL"
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="competition-price" className="text-gray-300">Entry Fee</Label>
                    <Input 
                      id="competition-price" 
                      name="price" 
                      value={competitionData.price}
                      onChange={handleCompetitionChange}
                      placeholder="E.g., ₹500, Free, etc."
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="competition-organiser" className="text-gray-300">Organiser</Label>
                  <Input 
                    id="competition-organiser" 
                    name="organiserName" 
                    value={competitionData.organiserName}
                    onChange={handleCompetitionChange}
                    placeholder="Enter organiser name"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="competition-image" className="text-gray-300">Competition Image</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="competition-image" 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setCompetitionData, competitionData)}
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    />
                    {competitionData.mediaUrl && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" /> Image uploaded
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={addContentMutation.isPending}
                >
                  {addContentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Competition
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManualContentEntry;