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
import { ExternalLink, FileText, ArrowRight, CalendarDays } from 'lucide-react';
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
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (articles.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-green-500" />
            Recent Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-zinc-400">
            New information from our sources will appear here. Check back later for updates.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-green-500" />
          Recent Articles & Resources
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Latest content from external websites, blogs, and publications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {articles.slice(0, 3).map((article) => (
          <div key={article.id} className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
            <h3 className="text-sm font-medium text-zinc-300 mb-1">
              {article.title}
            </h3>
            <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{article.content}</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-xs text-zinc-500">
                <CalendarDays className="h-3 w-3 mr-1" />
                {formatDate(article.createdAt)}
              </div>
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
                <Button
                  variant="ghost"
                  size="sm" 
                  className="h-5 px-1.5 text-xs text-green-500 hover:text-green-400 hover:bg-zinc-800"
                  onClick={() => onArticleClick && onArticleClick(`Tell me about ${article.title}`)}
                >
                  Read More
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      {articles.length > 3 && (
        <CardFooter className="px-6 pt-0 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={() => onArticleClick && onArticleClick("What are the recent updates in bamboo architecture?")}
          >
            <span>View More Articles</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default RecentArticles;