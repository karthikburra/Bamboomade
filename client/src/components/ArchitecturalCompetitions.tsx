import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ExternalLink, Loader2, Trophy } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Competition {
  id: number;
  title: string;
  content: string;
  eventDate: string | null;
  eventLocation: string | null;
  registrationLink: string | null;
  organiserName: string | null;
  mediaUrl: string | null;
  submissionDeadline: string | null;
  price: string | null;
  contentType: string;
}

interface ArchitecturalCompetitionsProps {
  onCompetitionClick?: (competition: Competition) => void;
}

const ArchitecturalCompetitions: React.FC<ArchitecturalCompetitionsProps> = ({ 
  onCompetitionClick
}) => {
  // Query public knowledge content for competitions
  const { data: allContent, isLoading } = useQuery({
    queryKey: ['/api/public/ai-knowledge'],
    retry: false,
  });
  
  // Filter active competitions from all content
  const competitions = React.useMemo(() => {
    if (!allContent || !Array.isArray(allContent)) return [];
    return allContent.filter(item => 
      item.contentType === 'competition' && 
      item.status === 'active'
    );
  }, [allContent]);

  // Function to handle clicking on a competition - redirect to registration link
  const handleCompetitionClick = (competition: Competition) => {
    if (competition.registrationLink) {
      window.open(competition.registrationLink, '_blank');
    } else if (onCompetitionClick) {
      onCompetitionClick(competition);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-lg h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-400 flex items-center gap-2 font-medium text-sm sm:text-base">
            <Trophy className="h-4 w-4" />
            Architectural Competitions
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
          </div>
        ) : !competitions || competitions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-zinc-500 text-sm">No active competitions found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar scrollbar-w-1 scrollbar-thumb-zinc-500 scrollbar-track-transparent">
            {competitions.map((competition: Competition) => (
              <div 
                key={competition.id}
                className="bg-zinc-800/50 rounded-lg p-3 cursor-pointer hover:bg-zinc-800 transition"
                onClick={() => handleCompetitionClick(competition)}
              >
                <div className="flex flex-col gap-3">
                  <div className="w-full h-40 flex-shrink-0">
                    <img 
                      src={competition.mediaUrl || "/attached_assets/22222.JPG"} 
                      alt={competition.title} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-zinc-200 font-medium text-base">
                      {competition.title}
                    </h3>
                    
                    {competition.organiserName && (
                      <p className="text-zinc-400 text-xs mt-1">
                        by {competition.organiserName}
                      </p>
                    )}
                    
                    <div className="mt-2 text-zinc-300 text-sm line-clamp-3">
                      {competition.content && competition.content.substring(0, 180)}
                      {competition.content && competition.content.length > 180 ? '...' : ''}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(competition.submissionDeadline || competition.eventDate) && (
                        <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deadline: {competition.submissionDeadline || competition.eventDate}
                        </Badge>
                      )}
                      
                      {competition.price && (
                        <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-green-300 flex items-center gap-1">
                          {competition.price}
                        </Badge>
                      )}
                      
                      {competition.registrationLink && (
                        <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-blue-300 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Register
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1">
        {competitions && competitions.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-zinc-400 text-xs hover:text-zinc-300"
            onClick={() => {
              // Find the competitions container and scroll to top
              const container = document.querySelector(".max-h-\\[600px\\]");
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

export default ArchitecturalCompetitions;