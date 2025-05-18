import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ExternalLink, Loader2, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ResourceItem {
  id: number;
  title: string;
  content: string;
  source: string | null;
  mediaUrl: string | null;
  contentType: string;
}

interface ArticlesResourcesProps {
  onResourceClick?: (resource: ResourceItem) => void;
}

const ArticlesResources: React.FC<ArticlesResourcesProps> = ({ 
  onResourceClick
}) => {
  // Query public knowledge content
  const { data: allContent, isLoading } = useQuery({
    queryKey: ['/api/public/ai-knowledge'],
    retry: false,
  });

  // Filter active resources (blogs, documents, webpages, blog_posts) from all content
  const resources = React.useMemo(() => {
    if (!allContent || !Array.isArray(allContent)) return [];
    return allContent.filter(item => 
      (item.contentType === 'blog' || 
       item.contentType === 'document' || 
       item.contentType === 'blog_post' || 
       item.contentType === 'webpage' || 
       (item.contentType === 'social' && item.title && item.title.toLowerCase().includes('article'))) &&
      item.status === 'active'
    );
  }, [allContent]);

  // Function to handle clicking on a resource - redirect to source link
  const handleResourceClick = (resource: ResourceItem) => {
    if (resource.source) {
      window.open(resource.source, '_blank');
    } else if (onResourceClick) {
      onResourceClick(resource);
    }
  };

  // Get appropriate icon for resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'blog':
      case 'blog_post':
        return <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-amber-300">Blog</Badge>;
      case 'document':
        return <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-blue-300">Document</Badge>;
      case 'webpage':
        return <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-green-300">Webpage</Badge>;
      case 'social':
        return <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-purple-300">Article</Badge>;
      default:
        return <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300">Resource</Badge>;
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-lg h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-400 flex items-center gap-2 font-medium text-sm sm:text-base">
            <FileText className="h-4 w-4" />
            Articles & Resources
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
          </div>
        ) : !resources || resources.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-zinc-500 text-sm">No resources found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar scrollbar-w-1 scrollbar-thumb-zinc-500 scrollbar-track-transparent">
            {resources.map((resource: ResourceItem) => (
              <div 
                key={resource.id}
                className="bg-zinc-800/50 rounded-lg p-3 cursor-pointer hover:bg-zinc-800 transition"
                onClick={() => handleResourceClick(resource)}
              >
                <div className="flex items-start gap-3">
                  {resource.mediaUrl && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                      <img 
                        src={resource.mediaUrl} 
                        alt={resource.title} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-zinc-200 font-medium text-sm sm:text-base mb-1">
                        {resource.title}
                      </h3>
                      {getResourceIcon(resource.contentType)}
                    </div>
                    
                    <p className="text-zinc-400 text-xs line-clamp-2 mb-2">
                      {resource.content}
                    </p>
                    
                    {resource.source && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 text-xs border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(resource.source!, '_blank');
                        }}
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        View Source
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1">
        {resources && resources.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-zinc-400 text-xs hover:text-zinc-300"
            onClick={() => {
              // Find the resources container and scroll to top
              const container = document.querySelector(".max-h-\\[400px\\]");
              if (container) {
                container.scrollTop = 0;
              }
            }}
          >
            Scroll to top
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ArticlesResources;