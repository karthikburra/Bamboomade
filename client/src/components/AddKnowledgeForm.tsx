import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Upload, 
  FileText, 
  Calendar, 
  LinkIcon, 
  User, 
  Info,
  Check,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define the form schema with validation
const knowledgeFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  contentType: z.string({
    required_error: "Please select a content type",
  }),
  source: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  media: z.instanceof(File).optional(),
});

// Create a type for our form values
type KnowledgeFormValues = z.infer<typeof knowledgeFormSchema>;

export default function AddKnowledgeForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Form setup with defaultValues and validation
  const form = useForm<KnowledgeFormValues>({
    resolver: zodResolver(knowledgeFormSchema),
    defaultValues: {
      title: "",
      content: "",
      contentType: "webpage",
      source: "",
    },
  });

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (limit to 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 20MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      form.setValue("media", file);
    }
  };

  // Form submission handler
  const onSubmit = async (data: KnowledgeFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create form data for multipart/form-data request (for file uploads)
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("contentType", data.contentType);
      
      if (data.source) {
        formData.append("source", data.source);
      }
      
      if (selectedFile) {
        formData.append("mediaFile", selectedFile);
      }
      
      // Add current user (admin) ID
      formData.append("createdBy", "1"); // Assuming admin ID is 1
      
      // Send API request
      const response = await fetch("/api/ai-knowledge", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error adding knowledge content: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Show success toast
      toast({
        title: "Knowledge Added Successfully",
        description: "Your content has been added to the knowledge base",
        variant: "default",
      });
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      
    } catch (error) {
      console.error("Error adding knowledge:", error);
      toast({
        title: "Failed to Add Knowledge",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gray-950 border-gray-800">
      <CardHeader className="border-b border-gray-800 bg-gray-900/50">
        <CardTitle className="text-lg text-amber-500">Add Knowledge Content</CardTitle>
        <CardDescription>
          Add new content to the bamboo knowledge database
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a descriptive title" 
                      className="bg-gray-900 border-gray-700" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500">
                    A clear title that describes this content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Content Type Field */}
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Content Type</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="webpage">Web Page</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="manual">Manual or Guide</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="enthusiast">Bamboo Enthusiast</SelectItem>
                        <SelectItem value="fact">Fact</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription className="text-gray-500">
                    The type of content you are adding
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Source URL Field */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">
                    Source URL (Optional)
                  </FormLabel>
                  <FormControl>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-700 bg-gray-800 text-gray-400">
                        <LinkIcon className="h-4 w-4" />
                      </span>
                      <Input
                        placeholder="https://example.com/bamboo-article"
                        className="rounded-l-none bg-gray-900 border-gray-700"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-gray-500">
                    The URL where this content was found (if applicable)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Media Upload Field */}
            <div className="space-y-2">
              <FormLabel className="text-gray-300">
                Upload Media (Optional)
              </FormLabel>
              <div 
                className={`border-2 border-dashed rounded-md p-6 transition-colors
                  ${selectedFile ? 'border-amber-600/40 bg-amber-900/10' : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'}
                  flex flex-col items-center justify-center text-center`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-2 rounded-full bg-amber-900/20">
                      <Check className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="text-sm font-medium text-gray-300">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        form.setValue("media", undefined);
                      }}
                      className="mt-2 text-xs"
                      type="button"
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-gray-800 mb-2">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-sm text-gray-400 mb-1">
                      Drag and drop or click to upload
                    </div>
                    <div className="text-xs text-gray-500 max-w-xs">
                      Support for images, PDFs, and documents (max 20MB)
                    </div>
                  </>
                )}
                <Input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.md"
                  onChange={handleFileChange}
                />
                {!selectedFile && (
                  <label htmlFor="file-upload">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      type="button"
                    >
                      Select File
                    </Button>
                  </label>
                )}
              </div>
            </div>
            
            {/* Content Field */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the knowledge content here..."
                      className="min-h-[150px] bg-gray-900 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500">
                    The main content to be added to the knowledge base
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Info Message */}
            <div className="flex p-3 rounded-md bg-blue-900/20 border border-blue-800/30">
              <Info className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="mb-1 font-medium text-blue-400">Admin Only Feature</p>
                <p className="text-gray-400 text-xs">
                  New content will be added with 'pending' status. It will be available in the AI Knowledge Database once approved.
                </p>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add to Knowledge Base"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}