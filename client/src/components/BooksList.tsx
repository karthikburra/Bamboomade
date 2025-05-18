import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, ExternalLink, Loader2, ShoppingCart, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BookItem {
  id: number;
  title: string;
  content: string;
  source: string | null;
  mediaUrl: string | null;
  contentType: string;
}

interface BooksListProps {
  onBookClick?: (book: BookItem) => void;
}

const BooksList: React.FC<BooksListProps> = ({ 
  onBookClick
}) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  // Query public knowledge content and filter for books
  const { data: allContent, isLoading, refetch } = useQuery({
    queryKey: ['/api/public/ai-knowledge'],
    retry: false,
  });
  
  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } catch (error) {
      console.error('Failed to refresh books:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Add small delay to show spinner
    }
  };

  // Filter active books from all content
  const books = React.useMemo(() => {
    if (!allContent || !Array.isArray(allContent)) return [];
    return allContent.filter(item => 
      item.contentType === 'book' && 
      item.status === 'active'
    );
  }, [allContent]);

  // Function to handle clicking on a book - redirect to purchase link
  const handleBookClick = (book: BookItem) => {
    if (book.source) {
      window.open(book.source, '_blank');
    } else if (onBookClick) {
      onBookClick(book);
    }
  };

  // Function to handle clicking on the purchase link
  const handlePurchaseClick = (e: React.MouseEvent, source: string) => {
    e.stopPropagation();
    window.open(source, '_blank');
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-lg h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-400 flex items-center gap-2 font-medium text-sm sm:text-base">
            <Book className="h-4 w-4" />
            Bamboo Books
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
      </CardHeader>
      
      <CardContent className="pb-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
          </div>
        ) : !books || books.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-zinc-500 text-sm">No books found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {books.map((book: BookItem) => (
              <div 
                key={book.id}
                className="bg-zinc-800/50 rounded-lg p-3 cursor-pointer hover:bg-zinc-800 transition"
                onClick={() => handleBookClick(book)}
              >
                <div className="flex items-start gap-3">
                  {book.mediaUrl && (
                    <div className="w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0">
                      <img 
                        src={book.mediaUrl} 
                        alt={book.title} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-zinc-200 font-medium text-sm sm:text-base">
                      {book.title}
                    </h3>
                    
                    <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                      {book.content}
                    </p>
                    
                    {book.source && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs border-green-800 bg-green-950/20 text-green-400 hover:bg-green-900/30"
                        onClick={(e) => handlePurchaseClick(e, book.source!)}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Purchase
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
        {books && books.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-zinc-400 text-xs hover:text-zinc-300"
            onClick={() => {
              // Find the books container and scroll to top
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

export default BooksList;