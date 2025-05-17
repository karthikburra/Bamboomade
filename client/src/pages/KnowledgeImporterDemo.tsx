import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { Loader2, AlertCircle, Check, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration only
const DEMO_RESULTS = {
  success: true,
  message: "Content imported successfully",
  data: {
    id: 123,
    title: "Bamboo as a Sustainable Building Material",
    contentType: "article",
    source: "https://example.com/bamboo-architecture",
    extractedDate: "2024-05-15"
  }
};

export default function KnowledgeImporterDemo() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<null | typeof DEMO_RESULTS>(null);
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
      // Simulate API call
      setIsLoading(true);
      setResult(null);
      
      // Artificial delay to simulate server processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Demo result
      setResult(DEMO_RESULTS);
      
      toast({
        title: "Demo import successful",
        description: "This is a demonstration of how content would be imported.",
      });
    } catch (error) {
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
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Importer (Demo)</h1>
        <p className="text-muted-foreground mt-2">
          This page demonstrates how the Knowledge Importer would work.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add Content from URL</CardTitle>
          <CardDescription>
            Provide any webpage URL to extract and add its content to the Bamboo One knowledge base.
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
            The system would automatically extract and categorize the content using AI.
          </p>
        </CardFooter>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">1. Extract</h3>
              <p className="text-sm text-muted-foreground">
                The system pulls content from the webpage, cleaning up unnecessary elements like ads and navigation.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">2. Categorize</h3>
              <p className="text-sm text-muted-foreground">
                AI analyzes the content to determine its type: article, event, social media, etc.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">3. Summarize</h3>
              <p className="text-sm text-muted-foreground">
                The content is concisely summarized to extract the most relevant bamboo information.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">4. Extract Facts</h3>
              <p className="text-sm text-muted-foreground">
                Interesting bamboo facts are identified and saved separately for use throughout the site.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
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
                      <p><strong>Date:</strong> {result.data.extractedDate}</p>
                    )}
                  </div>
                </div>
              )}
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">✓ Quickly build your knowledge base from any source</p>
              <p className="text-sm">✓ Automatic categorization and organization</p>
              <p className="text-sm">✓ Extract facts for use in Bamboo One interface</p>
              <p className="text-sm">✓ Keep content organized and structured</p>
              <p className="text-sm">✓ Import from articles, blogs, research papers, and more</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <Button variant="outline" onClick={() => setLocation("/")}>
          <Link className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}