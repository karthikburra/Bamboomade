import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Share2, 
  Instagram, 
  Twitter, 
  Facebook, 
  Linkedin,
  Youtube,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

interface SocialMediaPost {
  id: number;
  title: string;
  content: string;
  contentType: string;
  createdAt: Date;
  updatedAt: Date;
  mediaUrl?: string | null;
  source?: string | null;
  socialMediaInfo?: {
    platform?: string;
    postId?: string;
    profileUrl?: string;
    handle?: string;
    mediaUrls?: string[];
  } | null;
}

interface SocialMediaPostsProps {
  onPostClick?: (topic: string) => void;
}

const SocialMediaPosts: React.FC<SocialMediaPostsProps> = ({ onPostClick }) => {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSocialMediaPosts();
  }, []);

  const fetchSocialMediaPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest("GET", "/api/social-media-posts");
      if (!response.ok) {
        throw new Error("Failed to fetch social media posts");
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching social media posts:", err);
      setError("Failed to load social media content");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const getPlatformIcon = (platform?: string) => {
    if (!platform) return <MessageSquare className="h-4 w-4 mr-2" />;
    
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4 mr-2" />;
      case 'twitter':
      case 'x':
        return <Twitter className="h-4 w-4 mr-2" />;
      case 'facebook':
        return <Facebook className="h-4 w-4 mr-2" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4 mr-2" />;
      case 'youtube':
        return <Youtube className="h-4 w-4 mr-2" />;
      default:
        return <MessageSquare className="h-4 w-4 mr-2" />;
    }
  };
  
  const getPlatformColor = (platform?: string) => {
    if (!platform) return "bg-gray-800 text-gray-400 border-gray-700";
    
    switch (platform.toLowerCase()) {
      case 'instagram':
        return "bg-pink-900/70 text-pink-400 border border-pink-800";
      case 'twitter':
      case 'x':
        return "bg-blue-900/70 text-blue-400 border border-blue-800";
      case 'facebook':
        return "bg-blue-900/70 text-blue-400 border border-blue-800";
      case 'linkedin':
        return "bg-indigo-900/70 text-indigo-400 border border-indigo-800";
      case 'youtube':
        return "bg-red-900/70 text-red-400 border border-red-800";
      default:
        return "bg-gray-800 text-gray-400 border border-gray-700";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <Instagram className="h-5 w-5 mr-2 text-pink-500" />
            Social Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || posts.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
              <Instagram className="h-5 w-5 mr-2 text-pink-500" />
              Social Media
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full text-zinc-400 hover:text-secondary"
              title="Refresh social media posts"
              onClick={fetchSocialMediaPosts}
            >
              <RefreshCw className="h-3.5 w-3.5 text-secondary" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-zinc-400">
            {error || "No social media posts found. Check back soon for updates."}
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <Instagram className="h-5 w-5 mr-2 text-pink-500" />
            Social Media
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full text-zinc-400 hover:text-secondary"
            title="Refresh social media posts"
            onClick={fetchSocialMediaPosts}
          >
            <RefreshCw className="h-3.5 w-3.5 text-secondary" />
          </Button>
        </div>
        <CardDescription className="text-zinc-400">
          Latest updates from our social media channels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post) => {
            const platform = post.socialMediaInfo?.platform || post.contentType.split('_')[1] || 'social';
            
            return (
              <div 
                key={post.id} 
                className="border border-zinc-800 rounded-md p-4 bg-zinc-950/60 overflow-hidden"
                onClick={() => onPostClick && onPostClick(`Tell me about "${post.title}"`)}
              >
                {/* Post header with platform badge */}
                <div className="mb-2 flex justify-between items-start">
                  <Badge className={`px-2 py-1 text-xs flex items-center ${getPlatformColor(platform)}`}>
                    {getPlatformIcon(platform)}
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Badge>
                  <span className="text-xs text-zinc-500">{formatDate(post.createdAt)}</span>
                </div>
                
                {/* Post title */}
                <h3 className="text-sm font-medium text-zinc-300 mb-1 cursor-pointer hover:text-green-400 transition-colors">
                  {post.title}
                </h3>
                
                {/* Post content */}
                <p className="text-xs text-zinc-400 mb-2 line-clamp-3">{post.content}</p>
                
                {/* Post media if available */}
                {post.mediaUrl && (
                  <div className="mt-2 mb-2 overflow-hidden rounded-md">
                    <img 
                      src={post.mediaUrl} 
                      alt={post.title} 
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: '150px' }}
                    />
                  </div>
                )}
                
                {/* Source link if available */}
                {post.source && (
                  <div className="mt-2 text-xs">
                    <a 
                      href={post.source.startsWith('http') ? post.source : '#'} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:text-green-400 flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        if (!post.source?.startsWith('http')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      View Original
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialMediaPosts;