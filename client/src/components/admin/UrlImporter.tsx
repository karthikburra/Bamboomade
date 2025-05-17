import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Globe, Link2, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImportedContentPreview {
  title: string;
  contentType: string;
  content: string;
  url: string;
}

const UrlImporter: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [preview, setPreview] = useState<ImportedContentPreview | null>(null);
  const [contentType, setContentType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  const handleTypeChange = (value: string) => {
    setContentType(value);
    if (preview) {
      setPreview({
        ...preview,
        contentType: value
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (preview) {
      setPreview({
        ...preview,
        title: e.target.value
      });
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (preview) {
      setPreview({
        ...preview,
        content: e.target.value
      });
    }
  };

  const handleImport = async () => {
    if (!url) {
      setError('Please enter a URL to import');
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      setPreview(null);

      const response = await apiRequest("POST", "/api/admin/import-url", { url });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import URL');
      }
      
      const data = await response.json();
      setPreview({
        title: data.title,
        contentType: data.contentType,
        content: data.content,
        url
      });
      
      // Auto-set the content type based on the detected type
      setContentType(data.contentType);
      
    } catch (err) {
      console.error("Error importing URL:", err);
      setError(err instanceof Error ? err.message : 'Failed to import content from URL');
      toast({
        title: "Import Failed",
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    
    try {
      setIsImporting(true);
      
      // If the content type was changed, update it in the preview
      const contentToSave = {
        ...preview,
        contentType: contentType || preview.contentType
      };
      
      const response = await apiRequest("POST", "/api/admin/save-imported-content", contentToSave);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save content');
      }
      
      const data = await response.json();
      
      toast({
        title: "Content Saved",
        description: `"${preview.title}" has been added to your knowledge base.`,
        variant: "default"
      });
      
      // Reset form
      setUrl('');
      setPreview(null);
      setContentType('');
      
    } catch (err) {
      console.error("Error saving content:", err);
      toast({
        title: "Save Failed",
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Globe className="h-5 w-5" />
          URL Content Importer
        </CardTitle>
        <CardDescription>
          Add content to your knowledge base by importing it directly from a URL
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* URL Input Section */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="url-input">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="url-input"
                placeholder="https://example.com/article-about-bamboo"
                value={url}
                onChange={handleUrlChange}
                disabled={isImporting}
                className="flex-1"
              />
              <Button 
                onClick={handleImport} 
                disabled={isImporting || !url}
                className="whitespace-nowrap"
              >
                {isImporting && !preview ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Import Content
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>
          
          {/* Preview Section */}
          {preview && (
            <div className="space-y-4 mt-4 border border-border rounded-md p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Content Preview</h3>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1 hover:underline"
                  >
                    View Original <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Left column - Edit fields */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="content-title">Title</Label>
                      <Input
                        id="content-title"
                        value={preview.title}
                        onChange={handleTitleChange}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="content-preview">Content</Label>
                      <Textarea
                        id="content-preview"
                        value={preview.content}
                        onChange={handleContentChange}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Right column - Content type */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="content-type">Content Type</Label>
                      <Select 
                        value={contentType} 
                        onValueChange={handleTypeChange}
                      >
                        <SelectTrigger id="content-type">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="webpage">Webpage</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="fact">Bamboo Fact</SelectItem>
                          <SelectItem value="enthusiast">Bamboo Enthusiast</SelectItem>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Social media specific fields could go here */}
                    {contentType === 'social_media' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="social-platform">Platform</Label>
                        <Select defaultValue="instagram">
                          <SelectTrigger id="social-platform">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {preview && (
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isImporting}
            className="w-full md:w-auto"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save to Knowledge Base'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UrlImporter;