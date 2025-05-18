import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
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
}

interface ArchitecturalCompetitionsProps {
  onCompetitionClick?: (competition: Competition) => void;
}

const ArchitecturalCompetitions: React.FC<ArchitecturalCompetitionsProps> = ({ 
  onCompetitionClick
}) => {
  const { data: competitions, isLoading } = useQuery({
    queryKey: ['/api/ai-knowledge/competition'],
    retry: false,
  });

  // Function to handle clicking on a competition
  const handleCompetitionClick = (competition: Competition) => {
    if (onCompetitionClick) {
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
          <div className="space-y-3">
            {competitions.slice(0, 3).map((competition: Competition) => (
              <div 
                key={competition.id}
                className="bg-zinc-800/50 rounded-lg p-3 cursor-pointer hover:bg-zinc-800 transition"
                onClick={() => handleCompetitionClick(competition)}
              >
                <div className="flex items-start gap-3">
                  {competition.mediaUrl && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                      <img 
                        src={competition.mediaUrl} 
                        alt={competition.title} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-zinc-200 font-medium text-sm sm:text-base">
                      {competition.title}
                    </h3>
                    
                    {competition.organiserName && (
                      <p className="text-zinc-400 text-xs mt-1">
                        by {competition.organiserName}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {competition.submissionDeadline && (
                        <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deadline: {competition.submissionDeadline}
                        </Badge>
                      )}
                      
                      {competition.price && (
                        <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-green-300 flex items-center gap-1">
                          {competition.price}
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
            onClick={() => {/* Handle view all */}}
          >
            View all competitions
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ArchitecturalCompetitions;