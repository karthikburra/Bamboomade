import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

// Icons
import { Trash2, Pencil, Plus, Upload, RefreshCcw, Archive, PlusCircle, FileText, Link as LinkIcon, Calendar, Info, Download, SaveAll, Upload as UploadIcon } from 'lucide-react';

// Schema validation for AI knowledge content form
const aiKnowledgeFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  content: z.string().min(10, { message: "Content must be at least 10 characters." }),
  source: z.string().optional(),
  contentType: z.string({ required_error: "Please select a content type." }),
  status: z.string().default("active"),
});

// Types for AI knowledge content
interface AiKnowledgeContent {
  id: number;
  title: string;
  content: string;
  source: string | null;
  contentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

// Define import schema for Google Drive link
const googleDriveImportSchema = z.object({
  url: z.string()
    .url({ message: "Please enter a valid URL" })
    .refine((val) => val.includes("drive.google.com"), {
      message: "URL must be a Google Drive link",
    }),
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  contentType: z.string({ required_error: "Please select a content type." }),
  status: z.string().default("active"),
});

const AIKnowledgeManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<AiKnowledgeContent | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [importedContent, setImportedContent] = useState<string>("");
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportingBackup, setIsImportingBackup] = useState(false);
  
  // Form setup
  const form = useForm<z.infer<typeof aiKnowledgeFormSchema>>({
    resolver: zodResolver(aiKnowledgeFormSchema),
    defaultValues: {
      title: "",
      content: "",
      source: "",
      contentType: "",
      status: "active",
    },
  });
  
  // Query to fetch all AI knowledge content
  const { data: knowledgeContent, isLoading, isError } = useQuery({
    queryKey: ['/api/ai-knowledge'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai-knowledge');
      const data = await response.json();
      return data as AiKnowledgeContent[];
    },
  });
  
  // Mutation to add new AI knowledge content
  const addMutation = useMutation({
    mutationFn: async (data: z.infer<typeof aiKnowledgeFormSchema>) => {
      const response = await apiRequest('POST', '/api/ai-knowledge', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Knowledge content added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add knowledge content: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to update existing AI knowledge content
  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof aiKnowledgeFormSchema> & { id: number }) => {
      const { id, ...rest } = data;
      const response = await apiRequest('PUT', `/api/ai-knowledge/${id}`, rest);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Knowledge content updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      setIsEditDialogOpen(false);
      setCurrentContent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update knowledge content: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to delete AI knowledge content
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/ai-knowledge/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Knowledge content deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete knowledge content: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission for adding new content
  const onSubmit = (data: z.infer<typeof aiKnowledgeFormSchema>) => {
    addMutation.mutate(data);
  };
  
  // Handle form submission for updating content
  const onUpdate = (data: z.infer<typeof aiKnowledgeFormSchema>) => {
    if (currentContent) {
      updateMutation.mutate({
        ...data,
        id: currentContent.id,
      });
    }
  };
  
  // Open edit dialog and set current content
  const handleEditClick = (content: AiKnowledgeContent) => {
    setCurrentContent(content);
    form.reset({
      title: content.title,
      content: content.content,
      source: content.source || "",
      contentType: content.contentType,
      status: content.status,
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle delete confirmation 
  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };
  
  // Filter content based on active tab
  // Setup for Google Drive import form
  const importForm = useForm<z.infer<typeof googleDriveImportSchema>>({
    resolver: zodResolver(googleDriveImportSchema),
    defaultValues: {
      url: "",
      title: "",
      contentType: "document",
      status: "active",
    },
  });
  
  // Mutation to extract content from Google Drive
  const extractMutation = useMutation({
    mutationFn: async (data: { url: string }) => {
      const response = await apiRequest('POST', '/api/ai-knowledge/extract-from-drive', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content extracted",
        description: "Successfully extracted content from Google Drive",
      });
      setImportedContent(data.contentPreview || "");
      
      // Pre-fill the add content form with the extracted content
      form.setValue("content", data.contentPreview || "");
      form.setValue("title", importForm.getValues().title);
      form.setValue("contentType", importForm.getValues().contentType);
      form.setValue("status", importForm.getValues().status);
      form.setValue("source", importForm.getValues().url);
      
      // Close import dialog and open add dialog
      setIsImportDialogOpen(false);
      setIsAddDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to extract content: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission for importing from Google Drive
  const onImport = (data: z.infer<typeof googleDriveImportSchema>) => {
    extractMutation.mutate({ url: data.url });
  };
  
  // Handle exporting AI knowledge content
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/ai-knowledge/backup/export');
      
      if (!response.ok) {
        throw new Error('Failed to export backup');
      }
      
      const data = await response.blob();
      const downloadUrl = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `ai-knowledge-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Backup Exported",
        description: "AI knowledge backup has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error exporting backup:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle file input change for backup file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackupFile(e.target.files[0]);
    }
  };
  
  // Mutation to import backup
  const importBackupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/ai-knowledge/backup/import', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Backup Imported",
        description: `Successfully imported ${data.imported} items with ${data.errors} errors.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
      setIsRestoreDialogOpen(false);
      setBackupFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: `Failed to import backup: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle importing backup
  const handleImportBackup = async () => {
    if (!backupFile) {
      toast({
        title: "No File Selected",
        description: "Please select a backup file to import.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsImportingBackup(true);
      const fileContent = await backupFile.text();
      const backupData = JSON.parse(fileContent);
      
      // Validate backup structure
      if (!backupData || !backupData.data || !Array.isArray(backupData.data) || 
          !backupData.timestamp || !backupData.checksum) {
        throw new Error("Invalid backup format");
      }
      
      importBackupMutation.mutate(backupData);
    } catch (error) {
      console.error('Error importing backup:', error);
      toast({
        title: "Import Failed",
        description: `Failed to process backup file: ${error instanceof Error ? error.message : 'Invalid backup format'}`,
        variant: "destructive",
      });
      setIsImportingBackup(false);
    }
  };

  const filteredContent = knowledgeContent?.filter(item => {
    if (activeTab === "all") return true;
    return item.contentType === activeTab;
  });
  
  // Group items by content type for statistics
  const contentTypeCount = knowledgeContent?.reduce((acc, item) => {
    acc[item.contentType] = (acc[item.contentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  return (
    <div className="w-full px-[24px] py-6 md:py-8 bg-background text-foreground min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold">AI Knowledge Management</h1>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="flex-1 md:flex-none dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-700"
            onClick={() => {
              setIsImportDialogOpen(true);
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Import from Drive</span>
          </Button>
          <Button 
            className="flex-1 md:flex-none dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
            onClick={() => {
              form.reset();
              setIsAddDialogOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Add New Content</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2 px-3 py-3 md:px-6 md:py-4">
            <CardTitle className="text-sm md:text-lg dark:text-gray-100">Total Content</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <p className="text-xl md:text-3xl font-bold dark:text-white">{knowledgeContent?.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2 px-3 py-3 md:px-6 md:py-4">
            <CardTitle className="text-sm md:text-lg dark:text-gray-100">Documents</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <p className="text-xl md:text-3xl font-bold dark:text-white">{contentTypeCount['document'] || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2 px-3 py-3 md:px-6 md:py-4">
            <CardTitle className="text-sm md:text-lg dark:text-gray-100">Events</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <p className="text-xl md:text-3xl font-bold dark:text-white">{contentTypeCount['event'] || 0}</p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2 px-3 py-3 md:px-6 md:py-4">
            <CardTitle className="text-sm md:text-lg dark:text-gray-100">Websites</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <p className="text-xl md:text-3xl font-bold dark:text-white">{contentTypeCount['webpage'] || 0}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full flex overflow-x-auto no-scrollbar justify-start md:justify-center dark:bg-gray-800 dark:text-gray-200">
          <TabsTrigger value="all" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">All</TabsTrigger>
          <TabsTrigger value="document" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Documents</TabsTrigger>
          <TabsTrigger value="event" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Events</TabsTrigger>
          <TabsTrigger value="webpage" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Websites</TabsTrigger>
          <TabsTrigger value="manual" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Manual</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : isError ? (
            <Alert variant="destructive" className="dark:bg-red-900 dark:border-red-800 dark:text-white">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to fetch knowledge content. Please try again later.</AlertDescription>
            </Alert>
          ) : filteredContent && filteredContent.length > 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-0 overflow-x-auto">
                <div className="hidden md:block"> {/* Table for medium and larger screens */}
                  <Table className="dark:text-gray-200">
                    <TableHeader className="dark:bg-gray-900">
                      <TableRow className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableHead className="dark:text-gray-300">Title</TableHead>
                        <TableHead className="dark:text-gray-300">Type</TableHead>
                        <TableHead className="dark:text-gray-300">Source</TableHead>
                        <TableHead className="dark:text-gray-300">Status</TableHead>
                        <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map((item) => (
                        <TableRow key={item.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                          <TableCell className="font-medium dark:text-white">{item.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                              {item.contentType === 'document' && <FileText className="h-3 w-3 mr-1" />}
                              {item.contentType === 'webpage' && <LinkIcon className="h-3 w-3 mr-1" />}
                              {item.contentType === 'event' && <Calendar className="h-3 w-3 mr-1" />}
                              {item.contentType === 'manual' && <Info className="h-3 w-3 mr-1" />}
                              {item.contentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.source ? (
                              <a href={item.source} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline flex items-center">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                {item.source}
                              </a>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={item.status === 'active' ? 'default' : 'secondary'}
                              className={item.status === 'active' 
                                ? "dark:bg-green-700 dark:text-white" 
                                : "dark:bg-gray-600 dark:text-gray-200"}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} className="dark:hover:bg-gray-700 dark:text-gray-200">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="dark:hover:bg-gray-700 dark:text-gray-200">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Mobile card layout for small screens */}
                <div className="md:hidden">
                  {filteredContent.map((item) => (
                    <div key={item.id} className="p-4 border-b dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg dark:text-white">{item.title}</h3>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)} className="h-8 w-8 p-0 dark:hover:bg-gray-700 dark:text-gray-200">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-8 w-8 p-0 dark:hover:bg-gray-700 dark:text-gray-200">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Type:</span>
                          <Badge variant="outline" className="ml-2 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            {item.contentType === 'document' && <FileText className="h-3 w-3 mr-1" />}
                            {item.contentType === 'webpage' && <LinkIcon className="h-3 w-3 mr-1" />}
                            {item.contentType === 'event' && <Calendar className="h-3 w-3 mr-1" />}
                            {item.contentType === 'manual' && <Info className="h-3 w-3 mr-1" />}
                            {item.contentType}
                          </Badge>
                        </div>
                        
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Status:</span>
                          <Badge 
                            variant={item.status === 'active' ? 'default' : 'secondary'}
                            className={`ml-2 ${item.status === 'active' 
                              ? "dark:bg-green-700 dark:text-white" 
                              : "dark:bg-gray-600 dark:text-gray-200"}`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {item.source && (
                        <div className="mt-2 text-sm truncate">
                          <span className="text-gray-500 dark:text-gray-400">Source:</span>
                          <a href={item.source} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 dark:text-blue-400 hover:underline inline-flex items-center">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            {item.source}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No knowledge content found.</p>
                <Button 
                  onClick={() => {
                    form.reset();
                    setIsAddDialogOpen(true);
                  }}
                  className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Content
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Content Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add New Knowledge Content</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Add content to improve the AI knowledge base. This can be documents, events, or websites.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a descriptive title" 
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="document" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Document</SelectItem>
                        <SelectItem value="webpage" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Web Page</SelectItem>
                        <SelectItem value="event" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Event</SelectItem>
                        <SelectItem value="manual" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="dark:text-gray-400">
                      Select the type of content you are adding.
                    </FormDescription>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Source URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/document or Google Drive URL" 
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="dark:text-gray-400">
                      Enter the URL where this content can be found (optional).
                    </FormDescription>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the content or paste from a document" 
                        className="min-h-[200px] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="dark:text-gray-400">
                      The content will be used by the AI to answer user questions.
                    </FormDescription>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="active" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Active</SelectItem>
                        <SelectItem value="archived" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="dark:text-gray-400">
                      Active content will be used by the AI. Archived content will be ignored.
                    </FormDescription>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addMutation.isPending}
                  className="dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                >
                  {addMutation.isPending ? "Adding..." : "Add Content"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Import from Google Drive Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Import from Google Drive</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Enter the Google Drive document URL to extract its content.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...importForm}>
            <form onSubmit={importForm.handleSubmit(onImport)} className="space-y-4">
              <FormField
                control={importForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Google Drive URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://docs.google.com/document/d/..."
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="dark:text-gray-400">
                      Paste the shared link to your Google Drive document.
                    </FormDescription>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={importForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a title for this content" 
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={importForm.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="document" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Document</SelectItem>
                        <SelectItem value="webpage" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Web Page</SelectItem>
                        <SelectItem value="event" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Event</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(false)}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={extractMutation.isPending}
                  className="dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                >
                  {extractMutation.isPending ? "Extracting..." : "Extract Content"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Content Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Knowledge Content</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Update the content in the AI knowledge base.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a descriptive title" 
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="document" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Document</SelectItem>
                        <SelectItem value="webpage" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Web Page</SelectItem>
                        <SelectItem value="event" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Event</SelectItem>
                        <SelectItem value="manual" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Source URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/document or Google Drive URL" 
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="dark:text-gray-400">
                      Enter the URL where this content can be found (optional).
                    </FormDescription>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the content or paste from a document" 
                        className="min-h-[200px] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="active" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Active</SelectItem>
                        <SelectItem value="archived" className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:bg-gray-700">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="dark:text-red-400" />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIKnowledgeManagement;