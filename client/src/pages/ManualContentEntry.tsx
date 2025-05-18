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
  Info, Upload, Save, Check
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

  // Bamboo Fact form state
  const [factData, setFactData] = useState({
    fact: '',
    source: ''
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

  const handleFactChange = (e) => {
    const { name, value } = e.target;
    setFactData(prev => ({ ...prev, [name]: value }));
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
    mutationFn: (data) => apiRequest('POST', '/api/ai-knowledge/add', data),
    onSuccess: () => {
      toast({
        title: "Content added",
        description: "The content has been successfully added to the knowledge base.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge/list'] });
      
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
        <TabsList className="grid grid-cols-6 mb-8 bg-gray-900/80 border border-gray-800">
          <TabsTrigger value="event" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4" /> Event
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <MessageSquare className="h-4 w-4" /> Blog
          </TabsTrigger>
          <TabsTrigger value="book" className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Book className="h-4 w-4" /> Book
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
      </Tabs>
    </div>
  );
};

export default ManualContentEntry;