import React from 'react';
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
  ExternalLink, 
  FileText, 
  ArrowRight, 
  CalendarDays, 
  Globe, 
  Newspaper,
  MessageSquare,
  BookOpen,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Music,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export interface RecentArticle {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  source: string | null;
}

interface RecentArticlesProps {
  articles: RecentArticle[];
  onArticleClick?: (topic: string) => void;
}

const RecentArticles: React.FC<RecentArticlesProps> = ({ articles, onArticleClick }) => {
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const getSourceDomain = (url: string) => {
    try {
      // Extract just the domain name for display
      const domain = new URL(url).hostname.replace('www.', '');
      
      // Special case for common article platforms
      if (domain.includes('medium.com')) return 'Medium';
      if (domain.includes('wordpress.com')) return 'WordPress';
      if (domain.includes('blogger.com')) return 'Blogger';
      if (domain.includes('substack.com')) return 'Substack';
      
      // Book sources
      if (domain.includes('amazon') || domain.includes('amzn.')) return 'Amazon';
      if (domain.includes('goodreads.com')) return 'Goodreads';
      if (domain.includes('books.google.com')) return 'Google Books';
      
      return domain;
    } catch {
      return url;
    }
  };
  
  const getPlatformIcon = (url: string) => {
    if (!url) return <Globe className="h-3 w-3 mr-1" />;
    
    const domain = url.toLowerCase();
    
    // Article platforms
    if (domain.includes('medium.com')) return <Newspaper className="h-3 w-3 mr-1" />;
    if (domain.includes('wordpress.com') || domain.includes('wp.com')) return <BookOpen className="h-3 w-3 mr-1" />;
    if (domain.includes('blogger.com') || domain.includes('blogspot.com')) return <MessageSquare className="h-3 w-3 mr-1" />;
    if (domain.includes('substack.com')) return <Newspaper className="h-3 w-3 mr-1" />;
    
    // Book platforms
    if (domain.includes('amazon') || domain.includes('amzn.')) return <BookOpen className="h-3 w-3 mr-1" />;
    if (domain.includes('goodreads.com')) return <BookOpen className="h-3 w-3 mr-1" />;
    if (domain.includes('books.google.com')) return <BookOpen className="h-3 w-3 mr-1" />;
    
    // Social media platforms
    if (domain.includes('twitter.com') || domain.includes('x.com')) return <Twitter className="h-3 w-3 mr-1" />;
    if (domain.includes('facebook.com') || domain.includes('fb.com')) return <Facebook className="h-3 w-3 mr-1" />;
    if (domain.includes('instagram.com')) return <Instagram className="h-3 w-3 mr-1" />;
    if (domain.includes('linkedin.com')) return <BookOpen className="h-3 w-3 mr-1" />;
    
    // Video platforms
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) return <Youtube className="h-3 w-3 mr-1" />;
    if (domain.includes('vimeo.com')) return <Music className="h-3 w-3 mr-1" />;
    
    // Check for common article indicators in URL path
    try {
      const path = new URL(url).pathname.toLowerCase();
      if (
        path.includes('/blog/') || 
        path.includes('/article/') || 
        path.includes('/post/') || 
        path.includes('/news/')
      ) {
        return <Newspaper className="h-3 w-3 mr-1" />;
      }
      
      // Check for book indicators in URL path
      if (
        path.includes('/book/') || 
        path.includes('/books/') || 
        path.includes('/ebook/') || 
        path.includes('/publication/')
      ) {
        return <BookOpen className="h-3 w-3 mr-1" />;
      }
    } catch {
      // If URL parsing fails, return default icon
    }
    
    // Default for other sources
    return <Globe className="h-3 w-3 mr-1" />;
  };
  
  const getContentType = (url: string): string => {
    if (!url) return "Website";
    
    const domain = url.toLowerCase();
    
    // Social media
    if (domain.includes('facebook.com') || domain.includes('fb.com') || 
        domain.includes('instagram.com') || domain.includes('twitter.com') || 
        domain.includes('x.com') || domain.includes('linkedin.com')) {
      return "Social";
    }
    
    // Video platforms
    if (domain.includes('youtube.com') || domain.includes('youtu.be') || 
        domain.includes('vimeo.com')) {
      return "Video";
    }
    
    // Article platforms
    if (domain.includes('medium.com') || domain.includes('wordpress.com') || 
        domain.includes('blogger.com') || domain.includes('substack.com')) {
      return "Article";
    }
    
    // Book platforms
    if (domain.includes('amazon') || domain.includes('amzn.') || 
        domain.includes('goodreads.com') || domain.includes('books.google.com')) {
      return "Book";
    }
    
    // Check URL path for indicators
    try {
      const path = new URL(url).pathname.toLowerCase();
      if (path.includes('/blog/') || path.includes('/article/') || 
          path.includes('/post/') || path.includes('/news/')) {
        return "Article";
      }
      
      if (path.includes('/book/') || path.includes('/books/') || 
          path.includes('/ebook/') || path.includes('/publication/')) {
        return "Book";
      }
    } catch {
      // If URL parsing fails, return default
    }
    
    return "Website";
  };
  
  const getContentTypeColor = (contentType: string): string => {
    switch(contentType) {
      case "Social":
        return "bg-pink-900/70 text-pink-400 border border-pink-800";
      case "Video":
        return "bg-red-900/70 text-red-400 border border-red-800";
      case "Article":
        return "bg-purple-900/70 text-purple-400 border border-purple-800";
      case "Book":
        return "bg-orange-900/70 text-orange-400 border border-orange-800";
      default:
        return "bg-green-900/70 text-green-400 border border-green-800";
    }
  };

  if (articles.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-500" />
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full text-zinc-400 hover:text-secondary"
              title="Refresh articles and resources"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3.5 w-3.5 text-secondary" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-zinc-400">
            External articles, books, and resources from our trusted sources will appear here. 
            These rotate daily, so check back often for new content.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-green-500" />
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full text-zinc-400 hover:text-secondary"
            title="Refresh articles and resources"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5 text-secondary" />
          </Button>
        </div>
        <CardDescription className="text-zinc-400">
          Content from external websites, blogs, books, and publications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {articles.slice(0, 3).map((article) => {
          const contentType = article.source ? getContentType(article.source) : "Website";
          
          return (
            <div key={article.id} className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
              <h3 
                className="text-sm font-medium text-zinc-300 mb-1 cursor-pointer hover:text-green-400 transition-colors"
                onClick={() => onArticleClick && onArticleClick(`Tell me about ${article.title}`)}
              >
                {article.title}
              </h3>
              <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{article.content}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {/* Content Type Tag */}
                  {article.source && article.source.startsWith('http') && (
                    <Badge 
                      className={`mr-2 px-2 py-0.5 text-xs rounded-md flex items-center ${getContentTypeColor(contentType)}`}
                    >
                      {getPlatformIcon(article.source)}
                      {contentType}
                    </Badge>
                  )}
                  
                  {/* Date */}
                  <div className="flex items-center text-xs text-zinc-500">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {formatDate(article.createdAt)}
                  </div>
                </div>
                
                {/* Source Link */}
                <div className="flex space-x-2">
                  {article.source && (
                    <a 
                      href={article.source.startsWith('http') ? article.source : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-500 hover:text-green-400 flex items-center"
                      onClick={(e) => {
                        if (!article.source?.startsWith('http')) {
                          e.preventDefault();
                        }
                        
                        // Track click in Google Analytics
                        if (typeof window !== 'undefined' && (window as any).gtag && article.source?.startsWith('http')) {
                          (window as any).gtag('event', 'article_click', {
                            'event_category': 'AI_Chat',
                            'event_label': article.source
                          });
                        }
                      }}
                    >
                      {article.source.startsWith('http') 
                        ? getSourceDomain(article.source)
                        : article.source}
                      {article.source.startsWith('http') && (
                        <ExternalLink className="h-3 w-3 ml-1" />
                      )}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
      {articles.length > 3 && (
        <CardFooter className="px-6 pt-0 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={() => onArticleClick && onArticleClick("What are the recent updates in bamboo architecture?")}
          >
            <span>View More Resources</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default RecentArticles;