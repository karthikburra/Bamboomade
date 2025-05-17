import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { Loader2, Link, AlertCircle, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function KnowledgeImporter() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string; data?: any} | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleImport = async () => {
    if (!url) {
      toast({
        title: "URL required",
        description: "Please provide a valid URL to import content.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await apiRequest("POST", "/api/import-url", { url });
      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: data.message || "Import completed successfully",
        data: data.data
      });
      
      if (response.ok) {
        toast({
          title: "Import successful",
          description: "Content has been extracted and added to the knowledge base.",
        });
      } else {
        toast({
          title: "Import failed",
          description: data.message || "Failed to import content from the URL.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while importing content."
      });
      
      toast({
        title: "Import error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Importer</h1>
        <p className="text-muted-foreground mt-2">
          Import content from any URL to enhance the Bamboo One knowledge base.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add Content from URL</CardTitle>
          <CardDescription>
            Provide any webpage URL to extract and add its content to the knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              placeholder="https://example.com/bamboo-article" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleImport} 
              disabled={isLoading || !url}
              className="sm:w-auto w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Content"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground">
            The system will automatically extract and categorize the content.
          </p>
        </CardFooter>
      </Card>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"} className="mb-6">
          <div className="flex items-center gap-2">
            {result.success ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? "Import successful" : "Import failed"}</AlertTitle>
          </div>
          <AlertDescription className="mt-2">
            {result.message}
          </AlertDescription>
          
          {result.success && result.data && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Extracted Information:</h4>
              <div className="bg-secondary p-4 rounded-md text-sm">
                <p><strong>Title:</strong> {result.data.title}</p>
                <p><strong>Type:</strong> {result.data.contentType}</p>
                <p><strong>Source:</strong> {result.data.source}</p>
                {result.data.extractedDate && (
                  <p><strong>Date:</strong> {new Date(result.data.extractedDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          )}
        </Alert>
      )}

      <div className="flex justify-between items-center mt-8">
        <Button variant="outline" onClick={() => setLocation("/admin")}>
          <Link className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        
        <Button variant="outline" onClick={() => setLocation("/bamboo-one")}>
          View in Bamboo One
        </Button>
      </div>
    </div>
  );
}