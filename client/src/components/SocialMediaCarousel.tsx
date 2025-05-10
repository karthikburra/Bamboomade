import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Youtube, ArrowRight, ExternalLink, Loader, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Define types for AI knowledge content
interface AIKnowledgeContent {
  id: number;
  title: string;
  content: string;
  source: string;
  contentType: string;
  status: string;
  mediaUrl: string | null;
  mediaType: string | null;
  socialMediaInfo: {
    platform?: string;
    postId?: string;
    profileUrl?: string;
    handle?: string;
    mediaUrls?: string[];
  } | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

const SocialMediaCarousel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'instagram' | 'youtube'>('instagram');
  
  // Query to fetch knowledge base content
  const { data: knowledgeData, isLoading } = useQuery<AIKnowledgeContent[]>({
    queryKey: ['/api/ai-knowledge'],
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Function to filter content based on content type
  const filterContentByType = (type: 'instagram' | 'youtube') => {
    if (!knowledgeData || !Array.isArray(knowledgeData)) {
      return [];
    }
    
    // Filter social media content based on contentType or socialMediaInfo.platform
    return knowledgeData
      .filter((item: AIKnowledgeContent) => {
        if (item.contentType !== 'social') return false;
        
        // Check if it's from the selected platform
        const platform = item.socialMediaInfo?.platform?.toLowerCase() || '';
        return platform.includes(type);
      })
      .sort((a: AIKnowledgeContent, b: AIKnowledgeContent) => {
        // Sort by createdAt (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  };

  // Extract Instagram and YouTube content - using useMemo to prevent recomputing on every render
  const instagramContent = React.useMemo(() => filterContentByType('instagram'), [knowledgeData]);
  const youtubeContent = React.useMemo(() => filterContentByType('youtube'), [knowledgeData]);

  // Social media links
  const instagramLink = 'https://www.instagram.com/bamboomadein/';
  const youtubeLink = 'https://www.youtube.com/@bamboomade_in';

  // Loading placeholders with animation
  const renderSkeletons = () => (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i}>
            <Card className="overflow-hidden border-zinc-800 bg-zinc-900">
              <div className={cn(
                "w-full bg-zinc-800 animate-pulse",
                activeTab === 'instagram' ? "aspect-square" : "aspect-video"
              )}>
                {/* Pulsating loading indicator */}
                <div className="flex items-center justify-center h-full">
                  {activeTab === 'instagram' ? (
                    <Instagram className="h-10 w-10 text-pink-500/20 animate-pulse" />
                  ) : (
                    <Youtube className="h-10 w-10 text-red-500/20 animate-pulse" />
                  )}
                </div>
              </div>
              <CardContent className="p-3 sm:p-4">
                <Skeleton className="h-4 w-3/4 bg-zinc-800 mb-2" />
                <Skeleton className="h-3 w-full bg-zinc-800 mb-1" />
                <Skeleton className="h-3 w-2/3 bg-zinc-800" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <div className="text-center mt-4 text-zinc-500 text-sm">
        <div className="inline-flex items-center">
          <Loader className="h-3 w-3 mr-2 animate-spin" />
          Loading {activeTab === 'instagram' ? 'Instagram' : 'YouTube'} content...
        </div>
      </div>
    </div>
  );

  // Render YouTube content
  const renderYoutubeContent = () => {
    if (youtubeContent.length === 0) {
      return (
        <div className="text-center py-8 px-4">
          <Youtube className="h-10 w-10 text-red-500/40 mx-auto mb-3" />
          <p className="text-zinc-400 mb-2">No YouTube videos available at the moment.</p>
          <a 
            href={youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-red-400 hover:text-red-300 flex items-center justify-center"
          >
            Visit our YouTube channel <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      );
    }

    return (
      <div className="overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {youtubeContent.map((item: AIKnowledgeContent) => (
            <div key={item.id}>
              <Card className="overflow-hidden border-zinc-800 bg-zinc-900 h-full flex flex-col">
                <a 
                  href={item.source || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block relative aspect-video"
                >
                  {item.mediaUrl ? (
                    <img 
                      src={item.mediaUrl} 
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
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                    {item.content?.split('\n')[0]?.replace(/^#+ /, '') || 'Watch this bamboo-related video'}
                  </p>
                  <div className="mt-auto">
                    <a 
                      href={item.source || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-red-400 flex items-center hover:underline mt-1"
                    >
                      Watch on YouTube <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Instagram content
  const renderInstagramContent = () => {
    if (instagramContent.length === 0) {
      return (
        <div className="text-center py-8 px-4">
          <Instagram className="h-10 w-10 text-pink-500/40 mx-auto mb-3" />
          <p className="text-zinc-400 mb-2">No Instagram posts available at the moment.</p>
          <a 
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-pink-400 hover:text-pink-300 flex items-center justify-center"
          >
            Visit our Instagram page <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      );
    }

    return (
      <div className="overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {instagramContent.map((item: AIKnowledgeContent) => (
            <div key={item.id}>
              <Card className="overflow-hidden border-zinc-800 bg-zinc-900 h-full flex flex-col">
                <a 
                  href={item.source || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block relative aspect-square"
                >
                  {item.mediaUrl ? (
                    <img 
                      src={item.mediaUrl} 
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
                      <div className="text-white text-xs line-clamp-2">
                        {item.content?.split('\n')[0]?.replace(/^#+ /, '') || item.title}
                      </div>
                    </div>
                  </div>
                </a>
                <CardContent className="p-3 sm:p-4 flex-grow flex flex-col">
                  <h3 className="font-medium text-sm text-zinc-200 mb-1 line-clamp-1">{item.title}</h3>
                  <div className="mt-auto">
                    <a 
                      href={item.source || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-pink-400 flex items-center hover:underline mt-1"
                    >
                      View on Instagram <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-md border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
              {activeTab === 'instagram' ? (
                <Instagram className="h-5 w-5 mr-2 text-pink-500" />
              ) : (
                <Youtube className="h-5 w-5 mr-2 text-red-500" />
              )}
              Social Media
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {activeTab === 'instagram' 
                ? 'Latest bamboo-related posts from Instagram' 
                : 'Latest bamboo architecture videos from YouTube'}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 border-zinc-700 p-0"
              onClick={() => setActiveTab('instagram')}
              data-active={activeTab === 'instagram'}
              aria-label="Show Instagram content"
            >
              <Instagram className={cn(
                "h-4 w-4", 
                activeTab === 'instagram' ? "text-pink-500" : "text-zinc-400"
              )} />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 border-zinc-700 p-0"
              onClick={() => setActiveTab('youtube')}
              data-active={activeTab === 'youtube'}
              aria-label="Show YouTube content"
            >
              <Youtube className={cn(
                "h-4 w-4", 
                activeTab === 'youtube' ? "text-red-500" : "text-zinc-400"
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? renderSkeletons() : (
          activeTab === 'instagram' ? renderInstagramContent() : renderYoutubeContent()
        )}
        
        <div className="flex justify-end items-center mt-4">
          <a 
            href={activeTab === 'instagram' ? instagramLink : youtubeLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "text-xs border-zinc-700 text-zinc-300",
                activeTab === 'instagram' 
                  ? "hover:bg-pink-900/20 hover:text-pink-300" 
                  : "hover:bg-red-900/20 hover:text-red-300"
              )}
            >
              {activeTab === 'instagram' ? 'View more on Instagram' : 'View more on YouTube'}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialMediaCarousel;