import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Youtube, ArrowRight, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

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

interface SocialMediaLinks {
  instagram?: string;
  youtube?: string;
}

interface SocialMediaData {
  content?: SocialMediaContent[];
  links?: SocialMediaLinks;
}

const SocialMediaCarousel: React.FC = () => {
  const [autoplayInterval, setAutoplayInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'instagram' | 'youtube'>('instagram');
  
  // Embla carousel hooks
  const [instagramRef, instagramApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [youtubeRef, youtubeApi] = useEmblaCarousel({ loop: true, align: 'start' });
  
  // Query to fetch social media content
  const { data: socialMediaData, isLoading } = useQuery<SocialMediaData>({
    queryKey: ['/api/social-media-content'],
    retry: 1,
    refetchOnWindowFocus: false
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
      });
  };

  // Extract Instagram and YouTube content
  const instagramContent = filterContentByPlatform('instagram');
  const youtubeContent = filterContentByPlatform('youtube');

  // Get social links
  const instagramLink = socialMediaData?.links?.instagram || 'https://www.instagram.com/bamboomadein/';
  const youtubeLink = socialMediaData?.links?.youtube || 'https://www.youtube.com/@bamboomade_in';

  // Carousel navigation functions
  const scrollPrev = useCallback(() => {
    if (activeTab === 'instagram' && instagramApi) {
      instagramApi.scrollPrev();
    } else if (activeTab === 'youtube' && youtubeApi) {
      youtubeApi.scrollPrev();
    }
  }, [activeTab, instagramApi, youtubeApi]);

  const scrollNext = useCallback(() => {
    if (activeTab === 'instagram' && instagramApi) {
      instagramApi.scrollNext();
    } else if (activeTab === 'youtube' && youtubeApi) {
      youtubeApi.scrollNext();
    }
  }, [activeTab, instagramApi, youtubeApi]);

  // Autoplay functionality
  useEffect(() => {
    // Clear any existing interval when component unmounts or tab changes
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }

    // Start autoplay
    const interval = setInterval(() => {
      scrollNext();
    }, 5000); // Change slide every 5 seconds
    
    setAutoplayInterval(interval);

    // Cleanup on component unmount or when tab changes
    return () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    };
  }, [activeTab, scrollNext, autoplayInterval]);

  // Loading placeholders
  const renderSkeletons = () => (
    <div className="flex gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="min-w-[280px] flex-shrink-0">
          <Card className="overflow-hidden border-zinc-800 bg-zinc-900">
            <div className={cn(
              "w-full bg-zinc-800 animate-pulse",
              activeTab === 'instagram' ? "aspect-square" : "aspect-video"
            )} />
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="h-4 w-3/4 bg-zinc-800 mb-2" />
              <Skeleton className="h-3 w-full bg-zinc-800 mb-1" />
              <Skeleton className="h-3 w-2/3 bg-zinc-800" />
            </CardContent>
          </Card>
        </div>
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
      <div className="overflow-hidden" ref={youtubeRef}>
        <div className="flex">
          {youtubeContent.map((item: SocialMediaContent) => (
            <div key={item.id} className="min-w-[280px] mr-4 flex-shrink-0">
              <Card className="overflow-hidden border-zinc-800 bg-zinc-900 h-full flex flex-col">
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
        <p className="text-zinc-400 text-center py-4">No Instagram posts available at the moment.</p>
      );
    }

    return (
      <div className="overflow-hidden" ref={instagramRef}>
        <div className="flex">
          {instagramContent.map((item: SocialMediaContent) => (
            <div key={item.id} className="min-w-[280px] mr-4 flex-shrink-0">
              <Card className="overflow-hidden border-zinc-800 bg-zinc-900 h-full flex flex-col">
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
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 border-zinc-700 p-0 text-zinc-400"
              onClick={scrollPrev}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 border-zinc-700 p-0 text-zinc-400"
              onClick={scrollNext}
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
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