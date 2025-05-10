import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Youtube, ArrowRight, ExternalLink, Loader, Globe, Linkedin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import SocialMediaEmbed from './SocialMediaEmbed';
import InstagramScript from './InstagramScript';

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
  const [activeTab, setActiveTab] = useState<'instagram' | 'youtube' | 'embedded'>('embedded');
  
  // Query to fetch knowledge base content
  const { data: knowledgeData, isLoading } = useQuery<AIKnowledgeContent[]>({
    queryKey: ['/api/ai-knowledge'],
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Sample embedded social media content
  const embeddedContent = [
    {
      id: 'instagram1',
      platform: 'instagram' as const,
      title: 'Bamboo Structure Workshop',
      link: 'https://www.instagram.com/p/CsrKkOdvqMB/',
      embedCode: '<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/CsrKkOdvqMB/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"> <a href="https://www.instagram.com/p/CsrKkOdvqMB/?utm_source=ig_embed&amp;utm_campaign=loading" style=" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank"> <div style=" display: flex; flex-direction: row; align-items: center;"> <div style="background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;"></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center;"> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;"></div> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;"></div></div></div><div style="padding: 19% 0;"></div> <div style="display:block; height:50px; margin:0 auto 12px; width:50px;"><svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1" xmlns="https://www.w3.org/2000/svg" xmlns:xlink="https://www.w3.org/1999/xlink"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-511.000000, -20.000000)" fill="#000000"><g><path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path></g></g></g></svg></div><div style="padding-top: 8px;"> <div style=" color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;">View this post on Instagram</div></div><div style="padding: 12.5% 0;"></div> <div style="display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;"><div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);"></div> <div style="background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;"></div> <div style="background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);"></div></div><div style="margin-left: 8px;"> <div style=" background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;"></div> <div style=" width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)"></div></div><div style="margin-left: auto;"> <div style=" width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);"></div> <div style=" background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);"></div> <div style=" width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);"></div></div></div> <div style="display: flex; flex-direction: column; flex-grow: 1; justify-content: center; margin-bottom: 24px;"> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 224px;"></div> <div style=" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 144px;"></div></div></a><p style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;"><a href="https://www.instagram.com/p/CsrKkOdvqMB/?utm_source=ig_embed&amp;utm_campaign=loading" style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none;" target="_blank">A post shared by Bamboo Made (@bamboomadein)</a></p></div></blockquote>',
    },
    {
      id: 'youtube1',
      platform: 'youtube' as const,
      title: 'Building with Bamboo',
      link: 'https://www.youtube.com/embed/xJ7z6hxIpT0',
      embedCode: '<iframe width="100%" height="315" src="https://www.youtube.com/embed/xJ7z6hxIpT0" title="Building with Bamboo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    },
    {
      id: 'linkedin1',
      platform: 'linkedin' as const,
      title: 'Bamboo Architecture Innovations',
      link: 'https://www.linkedin.com/embed/feed/update/urn:li:share:7163126645051609089',
      embedCode: '<iframe src="https://www.linkedin.com/embed/feed/update/urn:li:share:7163126645051609089" height="570" width="100%" frameborder="0" allowfullscreen="" title="Embedded post"></iframe>',
    },
    {
      id: 'youtube2',
      platform: 'youtube' as const,
      title: 'Bamboo Architecture Workshop',
      link: 'https://www.youtube.com/embed/TcxRkr15QIA',
      embedCode: '<iframe width="100%" height="315" src="https://www.youtube.com/embed/TcxRkr15QIA" title="Bamboo Architecture Workshop" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
    },
  ];

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

  // Process Instagram embeds when embedded tab is active
  useEffect(() => {
    if (activeTab === 'embedded') {
      // Process with a slight delay to ensure embeds are in the DOM
      const timer = setTimeout(() => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab]);
  
  // Render embedded social media content
  const renderEmbeddedContent = () => {
    if (embeddedContent.length === 0) {
      return (
        <div className="text-center py-8 px-4">
          <Loader className="h-10 w-10 text-amber-500/40 mx-auto mb-3" />
          <p className="text-zinc-400 mb-2">No embedded content available at the moment.</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden">
        {/* Include the Instagram script component when showing embeds */}
        <InstagramScript />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {embeddedContent.map((item) => (
            <div key={item.id} className="h-full min-h-80">
              <SocialMediaEmbed 
                platform={item.platform}
                embedCode={item.embedCode}
                title={item.title}
                link={item.link}
              />
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
              ) : activeTab === 'youtube' ? (
                <Youtube className="h-5 w-5 mr-2 text-red-500" />
              ) : (
                <Linkedin className="h-5 w-5 mr-2 text-blue-500" />
              )}
              Social Media
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {activeTab === 'instagram' 
                ? 'Latest bamboo-related posts from Instagram' 
                : activeTab === 'youtube'
                ? 'Latest bamboo architecture videos from YouTube'
                : 'Embedded social media content'}
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
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 border-zinc-700 p-0"
              onClick={() => setActiveTab('embedded')}
              data-active={activeTab === 'embedded'}
              aria-label="Show embedded content"
            >
              <Linkedin className={cn(
                "h-4 w-4", 
                activeTab === 'embedded' ? "text-blue-500" : "text-zinc-400"
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {activeTab === 'embedded' 
          ? renderEmbeddedContent() 
          : isLoading 
            ? renderSkeletons() 
            : (
                activeTab === 'instagram' 
                  ? renderInstagramContent() 
                  : renderYoutubeContent()
              )
        }
        
        {activeTab !== 'embedded' && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaCarousel;