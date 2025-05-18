import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ContentImage = {
  id: number;
  title: string;
  contentType: string;
  mediaUrl: string;
  description: string;
};

type ContentImageResponse = {
  success: boolean;
  count: number;
  images: ContentImage[];
};

export default function ContentGallery({ onImageClick }: { onImageClick?: (topic: string) => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [contentImages, setContentImages] = useState<ContentImage[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all content with images
  const { data, isLoading: queryLoading, error, refetch } = useQuery({
    queryKey: ['/api/ai-knowledge'],
    retry: false,
  });
  
  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } catch (error) {
      console.error('Failed to refresh gallery:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Add small delay to show spinner
    }
  };

  useEffect(() => {
    if (data && !queryLoading) {
      // Filter for content with images
      const imagesData = data
        .filter((item: any) => 
          item.status === 'active' && 
          item.mediaUrl && 
          item.mediaUrl.trim() !== ''
        )
        .map((item: any) => ({
          id: item.id,
          title: item.title || 'Untitled',
          contentType: item.contentType || 'unknown',
          mediaUrl: item.mediaUrl,
          description: item.content ? 
            (item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '')) : 
            'No description available'
        }));
      
      setContentImages(imagesData);
      setIsLoading(false);
    }
  }, [data, queryLoading]);

  // Get content type display name
  const getContentTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'event': 'Event',
      'book': 'Book',
      'enthusiast': 'Enthusiast',
      'social_media': 'Social Media',
      'competition': 'Competition',
      'article': 'Article',
      'fact': 'Fact',
      'document': 'Document'
    };
    
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get badge color based on content type
  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'event': 'bg-blue-500/20 text-blue-300',
      'book': 'bg-amber-500/20 text-amber-300',
      'enthusiast': 'bg-green-500/20 text-green-300',
      'social_media': 'bg-purple-500/20 text-purple-300',
      'competition': 'bg-pink-500/20 text-pink-300',
      'article': 'bg-sky-500/20 text-sky-300',
      'fact': 'bg-lime-500/20 text-lime-300',
      'document': 'bg-orange-500/20 text-orange-300'
    };
    
    return colorMap[type] || 'bg-gray-500/20 text-gray-300';
  };

  const handleImageClick = (content: ContentImage) => {
    if (onImageClick) {
      onImageClick(content.title);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-zinc-100">
              <div className="flex items-center">
                <ImageIcon className="h-4 w-4 mr-2 text-green-500" />
                <span>Content Gallery</span>
              </div>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-zinc-400 hover:text-green-400 -mt-1 -mr-2"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 text-secondary ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Visual content from the knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center pt-4 pb-6">
          <Loader2 className="h-6 w-6 animate-spin text-green-500" />
          <span className="ml-2 text-sm text-zinc-400">Loading gallery...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-zinc-100">
            <div className="flex items-center">
              <ImageIcon className="h-4 w-4 mr-2 text-green-500" />
              <span>Content Gallery</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <p className="text-sm text-zinc-400">Unable to load content gallery.</p>
        </CardContent>
      </Card>
    );
  }

  if (contentImages.length === 0) {
    return (
      <Card className="h-full bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-zinc-100">
            <div className="flex items-center">
              <ImageIcon className="h-4 w-4 mr-2 text-green-500" />
              <span>Content Gallery</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <p className="text-sm text-zinc-400">No images available in the knowledge base.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-zinc-100">
          <div className="flex items-center">
            <ImageIcon className="h-4 w-4 mr-2 text-green-500" />
            <span>Content Gallery</span>
          </div>
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          {contentImages.length} visual items from the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 pb-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {contentImages.map((content) => (
            <div 
              key={content.id} 
              className="relative rounded overflow-hidden aspect-square cursor-pointer transition-all hover:opacity-90"
              onClick={() => handleImageClick(content)}
            >
              <img 
                src={content.mediaUrl} 
                alt={content.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback for broken images
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMyNDI0MjQiLz48cGF0aCBkPSJNNzIgNjhIODJWODJINzJWNjhaIiBmaWxsPSIjMzREM0UyIi8+PHBhdGggZD0iTTgyIDY4SDkyVjU4SDgyVjY4WiIgZmlsbD0iIzM0RDNFMiIvPjxwYXRoIGQ9Ik05MiA1OEgxMDJWNDhIOTJWNThaIiBmaWxsPSIjMzREQUEyIi8+PHBhdGggZD0iTTEwMiA1OEgxMTJWNjhIMTAyVjU4WiIgZmlsbD0iIzM0REFBMiIvPjxwYXRoIGQ9Ik0xMTIgNjhIMTIyVjgySDExMlY2OFoiIGZpbGw9IiMzNERBQTIiLz48cGF0aCBkPSJNMTIyIDgySDEzMlY5MkgxMjJWODJaIiBmaWxsPSIjMzREQUEyIi8+PHBhdGggZD0iTTEzMiA5MkgxNDJWMTAySDE0MlY5MloiIGZpbGw9IiM2QkQ5QTQiLz48cGF0aCBkPSJNMTMyIDEwMkgxMjJWMTEySDE0Mkg1Mkw2MiAxMDJIOTJIOTJIOTJIMTAySDF0MkgxMjJMMTMyIDEwMloiIGZpbGw9IiM2QkQ5QTQiLz48cGF0aCBkPSJNMTIyIDExMkg2MlYxMjJIMTIyVjExMloiIGZpbGw9IiM2QkQ5QTQiLz48cGF0aCBkPSJNMTIyIDEyMkg2MlYxMzJIMTIyVjEyMloiIGZpbGw9IiM2QkQ5QTQiLz48cGF0aCBkPSJNNjIgMTEySDUyVjEyMkg2MlYxMTJaIiBmaWxsPSIjNkJEOUE0Ii8+PHBhdGggZD0iTTUyIDEyMkg0MlYxMzJINTJWMTIyWiIgZmlsbD0iIzZCRDlBNCIvPjxwYXRoIGQ9Ik00MiAxMzJMMzIgMTQySDUyVjEzMkg0MloiIGZpbGw9IiM2QkQ5QTQiLz48cGF0aCBkPSJNNTIgMTQySDE1MFYxNTJINjJWMTQySDUyWiIgZmlsbD0iIzZCRDlBNCIvPjxwYXRoIGQ9Ik02MiA5Mkw4MiA5MlY4MkgxMDJWOTJIMTEyVjEwMkg5Mkg5Mkg5Mkg2Mkg2MlY5MloiIGZpbGw9IiM2QkQ5QTQiLz48L3N2Zz4=';
                }}
              />
              <Badge className={`absolute top-2 right-2 ${getTypeColor(content.contentType)}`}>
                {getContentTypeDisplay(content.contentType)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
      {contentImages.length > 6 && (
        <CardFooter className="pt-3 pb-3 flex justify-center">
          <p className="text-xs text-zinc-500">
            {contentImages.length} items available
          </p>
        </CardFooter>
      )}
    </Card>
  );
}