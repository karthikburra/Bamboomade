import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';

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
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Icons
import { 
  Trash2, Pencil, Plus, Upload, RefreshCcw, Archive, PlusCircle, 
  FileText, Link as LinkIcon, Calendar, Info, Download, SaveAll, 
  Upload as UploadIcon, Database, Code, Search, Sparkles, Send, 
  MessageSquare, Brain, Lightbulb, Menu, BookOpen, GraduationCap,
  Globe, Settings, Book, FileCheck, BookOpen as BookIcon,
  X, Loader2, LayoutGrid, Edit
} from 'lucide-react';

// Import Admin Components
import AdminTabs from '@/components/AdminTabs';

// Import AI Training Chat
import AITrainingChat from '@/components/AITrainingChat';

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

// Types for rule content
interface RuleItem {
  id: string;
  title: string;
  content: string;
  type: string;
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
  // State hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isSqlDialogOpen, setIsSqlDialogOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<AiKnowledgeContent | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [importedContent, setImportedContent] = useState<string>("");
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportingBackup, setIsImportingBackup] = useState(false);
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM content");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  
  // AI Training Chat Interface
  const [aiChatOpen, setAiChatOpen] = useState(false);
  
  // Direct AI Analysis feature
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    title: string;
    contentType: string;
  } | null>(null);
  
  // Function to analyze content directly in the input
  const handleAnalyzeContent = async () => {
    if (aiAnalysisText.trim().length < 10) return;
    
    setIsAnalyzing(true);
    try {
      const response = await apiRequest('POST', '/api/ai-knowledge/analyze', {
        content: aiAnalysisText
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }
      
      const data = await response.json();
      setAiAnalysisResult({
        title: data.title || 'Untitled Content',
        contentType: data.contentType || 'document'
      });
      
      toast({
        title: "Content Analyzed",
        description: "AI has analyzed your content and suggested categorization.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: `Failed to analyze content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Function to save analyzed content directly
  const handleDirectSave = async (title: string, contentType: string, content: string) => {
    if (!title || !contentType || !content) {
      toast({
        title: "Missing Information",
        description: "Title, content type, and content are required",
        variant: "destructive",
      });
      return;
    }
    
    addMutation.mutate({
      title,
      contentType,
      content,
      status: 'active',
    });
    
    // Reset analysis state after saving
    setAiAnalysisText('');
    setAiAnalysisResult(null);
  };
  
  // Navigation state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AiKnowledgeContent | null>(null);
  const [isRuleSelected, setIsRuleSelected] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RuleItem | null>(null);
  
  // Predefined rules for training
  const trainingRules: RuleItem[] = [
    { 
      id: 'rule1', 
      title: 'Response Guidelines', 
      content: 'Guidelines for how the AI should respond to questions about bamboo architecture.',
      type: 'rule'
    },
    { 
      id: 'rule2', 
      title: 'Default Behavior', 
      content: 'Default behavior settings for the AI in various situations.',
      type: 'rule'
    },
    { 
      id: 'rule3', 
      title: 'Training Examples', 
      content: 'Example QA pairs to guide the AI in responding to common questions.',
      type: 'rule'
    },
  ];
  
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
    } finally {
      setIsImportingBackup(false);
    }
  };
  
  // Handle SQL query execution
  const executeSqlQuery = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a SQL query to execute.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsExecutingSql(true);
      
      const response = await apiRequest('POST', '/api/ai-knowledge/query', { query: sqlQuery });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to execute query");
      }
      
      const data = await response.json();
      
      setSqlResult(data);
      
      toast({
        title: "Query Executed",
        description: `Found ${data.result.count} result(s) in ${data.result.executionTime}ms`,
      });
    } catch (error) {
      console.error('Error executing SQL query:', error);
      toast({
        title: "Query Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExecutingSql(false);
    }
  };
  
  // Handle when content is added through AI Training
  const handleContentAdded = (content: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/ai-knowledge'] });
    toast({
      title: "Content Added",
      description: "New content has been added to the knowledge base.",
    });
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
  
  // Group content by category and subcategory for the sidebar
  const categorizedContent = React.useMemo(() => {
    if (!knowledgeContent) return {};
    
    // Create a map to organize items by content type
    const result: Record<string, AiKnowledgeContent[]> = {};
    
    knowledgeContent.forEach(item => {
      if (!result[item.contentType]) {
        result[item.contentType] = [];
      }
      result[item.contentType].push(item);
    });
    
    return result;
  }, [knowledgeContent]);
  
  // Format title of content for display in sidebar
  const formatSidebarTitle = (item: AiKnowledgeContent, index: number) => {
    return `${item.contentType} ${index}: ${item.title.length > 20 ? item.title.substring(0, 17) + '...' : item.title}`;
  };
  
  // Handle selection of an item from the sidebar
  const handleItemSelect = (item: AiKnowledgeContent) => {
    setSelectedItem(item);
    setSelectedCategory(item.contentType);
    setIsRuleSelected(false);
  };
  
  // Handle selection of a rule
  const handleRuleSelect = (rule: RuleItem) => {
    setSelectedRule(rule);
    setIsRuleSelected(true);
    setSelectedItem(null);
  };
  

  
  // Fix variant type error
  const fixedVariant = (variant: string): "default" | "destructive" | null | undefined => {
    if (variant === "warning") return "default";
    return variant as "default" | "destructive" | null | undefined;
  };

  // Sidebar navigation component
  const Sidebar = () => {
    const categoryIcons: Record<string, React.ReactNode> = {
      document: <FileText className="h-4 w-4 mr-2" />,
      event: <Calendar className="h-4 w-4 mr-2" />,
      webpage: <Globe className="h-4 w-4 mr-2" />,
      manual: <Book className="h-4 w-4 mr-2" />,
    };
    
    return (
      <div className="w-64 h-full border-r dark:border-gray-700 dark:bg-gray-900 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex items-center">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mr-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-3 h-3 text-primary-foreground"
            >
              <path d="M21 12.5c0 .3-.1.6-.2.9"></path>
              <path d="M14 19.5c-.4 0-.8-.1-1.2-.3"></path>
              <path d="M3 13l0-.3c0-3.3 2.7-6 6-6 1.6 0 3.1.6 4.2 1.8"></path>
              <path d="M13 22H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"></path>
              <path d="M18 22a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
              <path d="m16.5 19 3-3"></path>
              <path d="M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
            </svg>
          </div>
          <h3 className="font-semibold text-lg">Knowledge Base</h3>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="px-3 py-2">
            {/* Stats cards in sidebar */}
            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium text-muted-foreground dark:text-gray-400 px-2">Content Statistics</div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between rounded-md bg-muted/40 dark:bg-gray-800 py-2 px-3">
                  <div className="flex items-center">
                    <LayoutGrid className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">Total Content Items</span>
                  </div>
                  <Badge className="ml-2 bg-primary text-primary-foreground">{knowledgeContent?.length || 0}</Badge>
                </div>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            {Object.entries(categorizedContent).map(([category, items]) => (
              <div key={category} className="mb-4">
                <div 
                  className={cn(
                    "flex items-center py-1.5 px-2 rounded text-sm font-medium cursor-pointer",
                    selectedCategory === category ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => setSelectedCategory(prev => prev === category ? null : category)}
                >
                  {categoryIcons[category] || <FileText className="h-4 w-4 mr-2" />}
                  <span>
                    {category === 'document' && 'Documents'}
                    {category === 'event' && 'Workshops & Events'}
                    {category === 'webpage' && 'External Resources'}
                    {category === 'manual' && 'Manuals & Guides'}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground dark:text-gray-400">{items.length}</span>
                </div>
                
                {selectedCategory === category && items.length > 0 && (
                  <div className="mt-1 ml-6 space-y-1 text-sm">
                    {items.map((item, idx) => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex items-center py-1.5 px-2 rounded cursor-pointer",
                          selectedItem?.id === item.id ? "bg-accent/80 text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground dark:text-gray-400"
                        )}
                        onClick={() => handleItemSelect(item)}
                      >
                        {category === 'document' && <FileText className="h-3.5 w-3.5 mr-2 flex-shrink-0" />}
                        {category === 'event' && <Calendar className="h-3.5 w-3.5 mr-2 flex-shrink-0" />}
                        {category === 'webpage' && <Globe className="h-3.5 w-3.5 mr-2 flex-shrink-0" />}
                        {category === 'manual' && <Book className="h-3.5 w-3.5 mr-2 flex-shrink-0" />}
                        <span className="truncate">{item.title.length > 25 ? item.title.substring(0, 22) + '...' : item.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <Separator className="my-3" />
            
            <div className="mb-4">
              <div 
                className={cn(
                  "flex items-center py-1.5 px-2 rounded text-sm font-medium cursor-pointer",
                  selectedCategory === 'rules' ? "bg-accent" : "hover:bg-accent/50"
                )}
                onClick={() => setSelectedCategory(prev => prev === 'rules' ? null : 'rules')}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                <span>Rules & Training</span>
                <span className="ml-auto text-xs text-muted-foreground dark:text-gray-400">{trainingRules.length}</span>
              </div>
              
              {selectedCategory === 'rules' && (
                <div className="mt-1 ml-6 space-y-1 text-sm">
                  {trainingRules.map((rule, idx) => (
                    <div 
                      key={rule.id} 
                      className={cn(
                        "flex items-center py-1.5 px-2 rounded cursor-pointer",
                        selectedRule?.id === rule.id ? "bg-accent/80 text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground dark:text-gray-400"
                      )}
                      onClick={() => handleRuleSelect(rule)}
                    >
                      {rule.title === 'Response Guidelines' && <FileCheck className="h-3.5 w-3.5 mr-2 flex-shrink-0" />}
                      {rule.title === 'Default Behavior' && <Settings className="h-3.5 w-3.5 mr-2 flex-shrink-0" />}
                      {rule.title === 'Training Examples' && <BookIcon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />}
                      <span className="truncate">{rule.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        {/* Bottom sidebar actions */}
        <div className="p-3 pt-2 border-t dark:border-gray-700 space-y-2">
          <Button
            variant="default"
            className="w-full justify-start text-sm bg-primary dark:text-primary-foreground"
            onClick={() => {
              form.reset();
              setIsAddDialogOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Content
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start text-sm dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-700"
            onClick={() => setIsSqlDialogOpen(true)}
          >
            <Database className="h-4 w-4 mr-2" />
            SQL Query
          </Button>
          
          <Select>
            <SelectTrigger className="w-full justify-start text-sm dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <SaveAll className="h-4 w-4 mr-2" />
                <span>Data Management</span>
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="import" onClick={() => setIsImportDialogOpen(true)}>
                <div className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Import from Drive</span>
                </div>
              </SelectItem>
              <SelectItem 
                value="export" 
                onClick={handleExportBackup}
                disabled={isExporting || knowledgeContent?.length === 0}
              >
                <div className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  <span>{isExporting ? "Exporting..." : "Export Backup"}</span>
                </div>
              </SelectItem>
              <SelectItem value="restore" onClick={() => setIsRestoreDialogOpen(true)}>
                <div className="flex items-center">
                  <SaveAll className="mr-2 h-4 w-4" />
                  <span>Restore Backup</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          

        </div>
      </div>
    );
  };
  
  // Content display component when an item is selected
  const ContentDisplay = ({ item }: { item: AiKnowledgeContent | null }) => {
    if (!item && !isRuleSelected) return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">Select content from sidebar</h3>
          <p className="text-muted-foreground">
            Choose an item from the sidebar to view its details or use the content analysis box below to add new knowledge.
          </p>
        </div>
      </div>
    );
    
    if (isRuleSelected && selectedRule) {
      return (
        <div className="p-6 h-full overflow-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{selectedRule.title}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="capitalize">Rule</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Rule
              </Button>
            </div>
          </div>
          
          <div className="mt-6 prose dark:prose-invert max-w-none">
            <p>{selectedRule.content}</p>
            
            {selectedRule.title === 'Response Guidelines' && (
              <div className="mt-4 p-4 bg-accent/30 rounded">
                <h3>Response Format Guidelines</h3>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>Always respond in clear, simple language accessible to non-technical users</li>
                  <li>For bamboo architecture questions, prioritize practical advice over theoretical details</li>
                  <li>When discussing workshops, include pricing, location and difficulty level</li>
                  <li>For project-specific questions, emphasize feasibility and regional considerations</li>
                  <li>Always offer alternatives when a specific technique or material is not recommended</li>
                </ol>
              </div>
            )}
            
            {selectedRule.title === 'Default Behavior' && (
              <div className="mt-4 p-4 bg-accent/30 rounded">
                <h3>Default Behavior Settings</h3>
                <ul className="list-disc ml-5 space-y-2">
                  <li><strong>Uncertainty handling:</strong> Acknowledge limitations and offer to connect with human experts</li>
                  <li><strong>Knowledge boundaries:</strong> Stay within bamboo architecture expertise, decline unrelated topics</li>
                  <li><strong>Resource linking:</strong> Refer to specific BambooMade workshops and services when relevant</li>
                  <li><strong>Content prioritization:</strong> Focus on practical application over theory</li>
                  <li><strong>Regional adaptation:</strong> Adjust recommendations based on user's regional context</li>
                </ul>
              </div>
            )}
            
            {selectedRule.title === 'Training Examples' && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-accent/30 rounded">
                  <h4 className="text-sm font-medium mb-2">Example 1: Workshop Question</h4>
                  <div className="space-y-2">
                    <p className="bg-muted/50 p-2 rounded"><strong>Q:</strong> Do you have any workshops on bamboo joinery?</p>
                    <p className="bg-primary/10 p-2 rounded"><strong>A:</strong> Yes, we offer specialized workshops on bamboo joinery techniques! Our "Fundamentals of Bamboo Joinery" workshop covers traditional and modern connecting methods, runs for 2 days, and costs ₹7,500 for professionals and ₹5,000 for students. The next session is scheduled for [date] in Hyderabad. Would you like me to share the detailed curriculum or help you register?</p>
                  </div>
                </div>
                
                <div className="p-4 bg-accent/30 rounded">
                  <h4 className="text-sm font-medium mb-2">Example 2: Technical Question</h4>
                  <div className="space-y-2">
                    <p className="bg-muted/50 p-2 rounded"><strong>Q:</strong> What's the best bamboo species for a pergola in a coastal area?</p>
                    <p className="bg-primary/10 p-2 rounded"><strong>A:</strong> For coastal areas, Dendrocalamus stocksii (Solid Bamboo) is ideal for pergolas due to its salt-air resistance and structural strength. Bambusa bambos is another good option if treated properly. The key for coastal applications is proper treatment against moisture and insects. I recommend our specialized bamboo treatment workshop that covers these specific scenarios, or you can book a project guidance session for personalized advice on your specific location.</p>
                  </div>
                </div>
                
                <div className="p-4 bg-accent/30 rounded">
                  <h4 className="text-sm font-medium mb-2">Example 3: Project Request</h4>
                  <div className="space-y-2">
                    <p className="bg-muted/50 p-2 rounded"><strong>Q:</strong> Can you help me design a bamboo treehouse?</p>
                    <p className="bg-primary/10 p-2 rounded"><strong>A:</strong> I'd be happy to discuss bamboo treehouse design concepts! For a complete design, you'd benefit from our project guidance service where our experts can provide personalized advice. Sessions start at ₹500 for 30 minutes (students) or ₹1000 for 30 minutes (professionals). If you'd prefer to learn the design principles yourself, our "Bamboo Structural Design" workshop covers load calculations and joineries needed for elevated structures. Would you like details about booking a guidance session or attending our upcoming workshops?</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (!item) return null;
    
    return (
      <div className="p-6 h-full overflow-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="capitalize">
                {item.contentType === 'document' && <FileText className="h-3 w-3 mr-1" />}
                {item.contentType === 'webpage' && <Globe className="h-3 w-3 mr-1" />}
                {item.contentType === 'event' && <Calendar className="h-3 w-3 mr-1" />}
                {item.contentType === 'manual' && <Book className="h-3 w-3 mr-1" />}
                {item.contentType}
              </Badge>
              <span>•</span>
              <span>Status: {item.status}</span>
              <span>•</span>
              <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        {item.source && (
          <div className="mb-4 p-3 bg-accent/30 rounded flex items-center">
            <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
            <a 
              href={item.source} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline break-all"
            >
              {item.source}
            </a>
          </div>
        )}
        
        <div className="mt-6 prose dark:prose-invert max-w-none">
          {item.content.split('\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </div>
    );
  };

  const [_, navigate] = useLocation();
  const [adminTab, setAdminTab] = useState("knowledge");
  
  const handleTabChange = (tab: string) => {
    setAdminTab(tab);
  };
  
  return (
    <>
      <Helmet>
        <title>AI Knowledge Management | BambooMade</title>
        <meta name="description" content="Manage AI knowledge base for BambooMade platform" />
      </Helmet>
      
      <div className="bg-background min-h-screen py-8">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          {/* AdminTabs moved above the header */}
          <AdminTabs defaultTab="knowledge" onTabChange={handleTabChange}>
            <TabsContent value="knowledge" className="p-0 border-0">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  AI Knowledge Management
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Manage the content used to train the AI assistant for bamboo architecture queries.
                </p>
              </div>
              <div className="w-full bg-background text-foreground">
                {/* AI Training Chat Component */}
                <AITrainingChat 
                  open={aiChatOpen} 
                  onClose={() => setAiChatOpen(false)} 
                  onContentAdded={handleContentAdded} 
                />
                
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="fixed bottom-4 right-4 z-50 md:hidden bg-primary text-primary-foreground shadow-lg rounded-full h-12 w-12"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
                
                {/* Mobile sidebar */}
                <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                  <SheetContent side="left" className="p-0 w-[280px]">
                    <Sidebar />
                  </SheetContent>
                </Sheet>
                
                {/* Main layout with sidebar and content */}
                <div className="flex h-[calc(100vh-12rem)]">
                  {/* Desktop sidebar - hidden on mobile */}
                  <div className="hidden md:block h-full">
                    <Sidebar />
                  </div>
                  
                  {/* Main content area */}
                  <div className="flex-1 overflow-auto">
          {/* Header with action buttons */}
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-4 h-4 text-primary-foreground"
                >
                  <path d="M21 12.5c0 .3-.1.6-.2.9"></path>
                  <path d="M14 19.5c-.4 0-.8-.1-1.2-.3"></path>
                  <path d="M3 13l0-.3c0-3.3 2.7-6 6-6 1.6 0 3.1.6 4.2 1.8"></path>
                  <path d="M13 22H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"></path>
                  <path d="M18 22a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
                  <path d="m16.5 19 3-3"></path>
                  <path d="M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">AI Knowledge Management</h1>
            </div>
          </div>
          
          {/* Content display area */}
          <div className="flex flex-col h-[calc(100vh-14rem)]">
            <div className="flex-1 overflow-auto">
              {selectedItem || isRuleSelected ? (
                <ContentDisplay item={selectedItem} />
              ) : isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : isError ? (
                <div className="p-6">
                  <Alert variant="destructive" className="dark:bg-red-900 dark:border-red-800 dark:text-white">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to fetch knowledge content. Please try again later.</AlertDescription>
                  </Alert>
                </div>
              ) : knowledgeContent?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="max-w-md">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No knowledge content yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Add your first content item to start building your AI knowledge base.
                    </p>
                    <Button
                      onClick={() => {
                        form.reset();
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Content
                    </Button>
                  </div>
                </div>
              ) : (
                <ContentDisplay item={null} />
              )}
            </div>
            
            {/* Direct AI Training input at bottom */}
            <div className="p-4 border-t dark:border-gray-700 bg-background">
              <div className="flex flex-col gap-2">
                {/* Analysis results section */}
                {aiAnalysisResult && (
                  <div className="mb-3 bg-accent/20 p-3 rounded-md dark:bg-gray-800/80 border dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">Content Analysis</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => setAiAnalysisResult(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Detected Type</p>
                        <div className="flex items-center">
                          {aiAnalysisResult.contentType === 'document' && <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-500" />}
                          {aiAnalysisResult.contentType === 'event' && <Calendar className="h-3.5 w-3.5 mr-1.5 text-green-500" />}
                          {aiAnalysisResult.contentType === 'webpage' && <Globe className="h-3.5 w-3.5 mr-1.5 text-purple-500" />}
                          <span className="font-medium text-sm capitalize">{aiAnalysisResult.contentType}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Suggested Title</p>
                        <p className="font-medium text-sm">{aiAnalysisResult.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          form.reset();
                          form.setValue('title', aiAnalysisResult.title);
                          form.setValue('contentType', aiAnalysisResult.contentType);
                          form.setValue('content', aiAnalysisText);
                          form.setValue('status', 'active');
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit Before Adding
                      </Button>
                      <Button 
                        size="sm"
                        className="h-7 text-xs bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
                        onClick={() => handleDirectSave(aiAnalysisResult.title, aiAnalysisResult.contentType, aiAnalysisText)}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                        Add to Knowledge Base
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Text input area */}
                <div className="relative">
                  <Textarea
                    placeholder="Enter content to analyze and add to the knowledge base..."
                    className="min-h-[100px] pr-16 resize-none dark:bg-gray-800 dark:border-gray-700"
                    value={aiAnalysisText}
                    onChange={(e) => setAiAnalysisText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        handleAnalyzeContent();
                      }
                    }}
                  />
                  <Button
                    className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
                    onClick={handleAnalyzeContent}
                    disabled={isAnalyzing || aiAnalysisText.trim().length < 10}
                    title="Analyze content (Ctrl+Enter)"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  <span>{isAnalyzing ? "Analyzing content..." : "Enter content and click the analyze button"}</span>
                  <span className="text-right">
                    Press <kbd className="px-1.5 py-0.5 bg-muted rounded border dark:bg-gray-700 dark:border-gray-600">Ctrl+Enter</kbd> to analyze
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge 
                    variant="outline"
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setAiAnalysisText("The Bamboo Sustainable Building Workshop is a hands-on 3-day program covering bamboo selection, treatment, joinery techniques, and construction methods. The workshop costs ₹8,000 for professionals and ₹5,500 for students, with the next session scheduled for June 15-17, 2025 in Hyderabad.")}
                  >
                    <Calendar className="h-3 w-3 mr-1.5" />
                    Event sample
                  </Badge>
                  <Badge 
                    variant="outline"
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setAiAnalysisText("Bambusa Bambos is a thorny bamboo species native to India, characterized by its thick-walled culms that can reach heights of 30 meters. It's widely used in construction, paper production, and furniture making due to its exceptional strength-to-weight ratio.")}
                  >
                    <FileText className="h-3 w-3 mr-1.5" />
                    Document sample
                  </Badge>
                  <Badge 
                    variant="outline"
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setAiAnalysisText("The International Bamboo Architecture Biennale website showcases innovative bamboo structures from around the world. Visit www.bamboobiennale.org to explore the gallery of award-winning designs, access research papers on sustainable bamboo construction, and learn about upcoming exhibitions.")}
                  >
                    <Globe className="h-3 w-3 mr-1.5" />
                    Website sample
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Content Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Add New Knowledge Content</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Add content to the AI knowledge base. This will be used to train the AI assistant.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a descriptive title" {...field} className="dark:bg-gray-700 dark:border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="webpage">Website</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="dark:text-gray-400">
                      Categorize the content to make it easier to find and use.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/source-link" 
                        {...field} 
                        className="dark:bg-gray-700 dark:border-gray-600" 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription className="dark:text-gray-400">
                      Optional link to the source of this content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the knowledge content here..." 
                        className="min-h-[200px] dark:bg-gray-700 dark:border-gray-600" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="dark:text-gray-400">
                      Only active content will be used to train the AI.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Adding..." : "Add Content"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Content Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Content</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Edit existing content in the AI knowledge base.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a descriptive title" {...field} className="dark:bg-gray-700 dark:border-gray-600" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="webpage">Website</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/source-link" 
                        {...field} 
                        className="dark:bg-gray-700 dark:border-gray-600"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the knowledge content here..." 
                        className="min-h-[200px] dark:bg-gray-700 dark:border-gray-600" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Content"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Import from Google Drive Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Import from Google Drive</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Import content from a Google Drive document or spreadsheet.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...importForm}>
            <form onSubmit={importForm.handleSubmit(onImport)} className="space-y-6">
              <FormField
                control={importForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Drive URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://docs.google.com/document/d/..." 
                        {...field} 
                        className="dark:bg-gray-700 dark:border-gray-600"
                      />
                    </FormControl>
                    <FormDescription className="dark:text-gray-400">
                      Paste the link to a Google Drive document or spreadsheet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={importForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a descriptive title" 
                        {...field} 
                        className="dark:bg-gray-700 dark:border-gray-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={importForm.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="webpage">Website</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(false)}
                  className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={extractMutation.isPending}>
                  {extractMutation.isPending ? "Importing..." : "Import"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Restore Backup Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Restore Backup</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Restore AI knowledge content from a backup file.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="backup-file">Backup File</Label>
              <Input 
                id="backup-file" 
                type="file" 
                accept=".json" 
                onChange={handleFileChange} 
                className="dark:bg-gray-700 dark:border-gray-600"
              />
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Select a JSON backup file exported from this system.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsRestoreDialogOpen(false)}
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button onClick={handleImportBackup} disabled={isImportingBackup || !backupFile}>
                {isImportingBackup ? "Restoring..." : "Restore Backup"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* SQL Query Dialog */}
      <Dialog open={isSqlDialogOpen} onOpenChange={setIsSqlDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>SQL Query</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Execute SQL queries to view or modify the AI knowledge content database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sql-query">SQL Query</Label>
              <Textarea 
                id="sql-query" 
                value={sqlQuery} 
                onChange={(e) => setSqlQuery(e.target.value)} 
                placeholder="SELECT * FROM content" 
                className="min-h-[100px] font-mono dark:bg-gray-700 dark:border-gray-600" 
              />
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Enter a SQL query to execute against the AI knowledge content database.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={executeSqlQuery} disabled={isExecutingSql}>
                {isExecutingSql ? "Executing..." : "Execute Query"}
              </Button>
            </div>
            
            {sqlResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium dark:text-white">Results</h3>
                  <Badge variant="outline" className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    {sqlResult.result.count} records in {sqlResult.result.executionTime}ms
                  </Badge>
                </div>
                
                <ScrollArea className="h-[300px] border rounded-md p-4 dark:border-gray-700 dark:bg-gray-900">
                  <pre className="text-sm font-mono whitespace-pre-wrap dark:text-gray-300">
                    {JSON.stringify(sqlResult.result.rows, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
            </div>
          </TabsContent>
        </AdminTabs>
      </div>
    </div>
  </>
);
};

export default AIKnowledgeManagement;