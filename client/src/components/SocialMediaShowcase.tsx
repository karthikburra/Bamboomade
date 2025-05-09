import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Youtube, ArrowRight, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Define types for social media content
interface SocialMediaContent {
  id: number;
  title: string;
  platformType: 'instagram' | 'youtube';
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
  publishedAt: string;
  featured: boolean;
}

const SocialMediaShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('instagram');
  
  // Query to fetch social media content
  const { data: socialMediaData, isLoading } = useQuery({
    queryKey: ['/api/social-media-content'],
    retry: 1,
    refetchOnWindowFocus: false,
    // If the API returns an error, we'll just show a fallback UI
    // so we don't want to show error messages to the user
    useErrorBoundary: false
  });

  // Function to filter content based on platform type
  const filterContentByPlatform = (platform: 'instagram' | 'youtube') => {
    if (!socialMediaData || !Array.isArray(socialMediaData.content)) {
      return [];
    }
    
    return socialMediaData.content
      .filter((item: SocialMediaContent) => item.platformType === platform)
      .sort((a: SocialMediaContent, b: SocialMediaContent) => {
        // Sort by featured first, then by publishedAt (newest first)
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, 3); // Get only the top 3 items
  };

  // Extract Instagram and YouTube content
  const instagramContent = filterContentByPlatform('instagram');
  const youtubeContent = filterContentByPlatform('youtube');

  // Get social links
  const instagramLink = socialMediaData?.links?.instagram || 'https://www.instagram.com/bamboomadein/';
  const youtubeLink = socialMediaData?.links?.youtube || 'https://www.youtube.com/@bamboomade_in';

  // Loading placeholders
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border-zinc-800 bg-zinc-900">
          <div className="aspect-video w-full bg-zinc-800 animate-pulse" />
          <CardContent className="p-3 sm:p-4">
            <Skeleton className="h-4 w-3/4 bg-zinc-800 mb-2" />
            <Skeleton className="h-3 w-full bg-zinc-800 mb-1" />
            <Skeleton className="h-3 w-2/3 bg-zinc-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render YouTube content
  const renderYoutubeContent = () => {
    if (youtubeContent.length === 0) {
      return (
        <p className="text-zinc-400 text-center py-4">No YouTube videos available at the moment.</p>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {youtubeContent.map((item: SocialMediaContent) => (
          <Card key={item.id} className="overflow-hidden border-zinc-800 bg-zinc-900 flex flex-col">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative aspect-video"
            >
              {item.thumbnailUrl ? (
                <img 
                  src={item.thumbnailUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Youtube className="h-12 w-12 text-red-500 opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-red-600 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </a>
            <CardContent className="p-3 sm:p-4 flex-grow flex flex-col">
              <h3 className="font-medium text-sm text-zinc-200 mb-1 line-clamp-2">{item.title}</h3>
              {item.description && (
                <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{item.description}</p>
              )}
              <div className="mt-auto">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-red-400 flex items-center hover:underline mt-1"
                >
                  Watch on YouTube <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render Instagram content
  const renderInstagramContent = () => {
    if (instagramContent.length === 0) {
      return (
        <p className="text-zinc-400 text-center py-4">No Instagram posts available at the moment.</p>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {instagramContent.map((item: SocialMediaContent) => (
          <Card key={item.id} className="overflow-hidden border-zinc-800 bg-zinc-900 flex flex-col">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative aspect-square"
            >
              {item.thumbnailUrl ? (
                <img 
                  src={item.thumbnailUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Instagram className="h-12 w-12 text-pink-500 opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end opacity-0 hover:opacity-100 transition-opacity">
                <div className="p-3 w-full">
                  <div className="text-white text-xs line-clamp-2">{item.description || item.title}</div>
                </div>
              </div>
            </a>
            <CardContent className="p-3 sm:p-4 flex-grow flex flex-col">
              <h3 className="font-medium text-sm text-zinc-200 mb-1 line-clamp-1">{item.title}</h3>
              <div className="mt-auto">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-pink-400 flex items-center hover:underline mt-1"
                >
                  View on Instagram <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-md border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg sm:text-xl text-zinc-200">
            <span className="mr-2">Connect with Us</span>
            <span className="text-xs sm:text-sm font-normal text-zinc-400">Updated weekly</span>
          </CardTitle>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-800 border-zinc-700">
            <TabsTrigger 
              value="instagram" 
              className="data-[state=active]:bg-pink-700 data-[state=active]:text-white"
            >
              <Instagram className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Instagram</span>
            </TabsTrigger>
            <TabsTrigger 
              value="youtube" 
              className="data-[state=active]:bg-red-700 data-[state=active]:text-white"
            >
              <Youtube className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">YouTube</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-4">
        <TabsContent value="instagram" className="mt-0">
          {isLoading ? renderSkeletons() : renderInstagramContent()}
          <div className="flex justify-center mt-4">
            <a 
              href={instagramLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="sm" className="text-xs border-zinc-700 text-zinc-300 hover:bg-pink-900/20 hover:text-pink-300">
                Follow us on Instagram
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </a>
          </div>
        </TabsContent>
        <TabsContent value="youtube" className="mt-0">
          {isLoading ? renderSkeletons() : renderYoutubeContent()}
          <div className="flex justify-center mt-4">
            <a 
              href={youtubeLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="sm" className="text-xs border-zinc-700 text-zinc-300 hover:bg-red-900/20 hover:text-red-300">
                Subscribe on YouTube
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </a>
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default SocialMediaShowcase;