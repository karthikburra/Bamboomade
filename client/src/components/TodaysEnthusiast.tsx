import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Sparkles, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EnthusiastSocialLinks from './EnthusiastSocialLinks';
import { formatDistanceToNow } from 'date-fns';

interface EnthusiastProfile {
  id: number;
  title: string;
  content: string;
  contentType: string;
  mediaUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  personalWebsite: string | null;
  githubUrl: string | null;
  createdAt: Date;
}

export function TodaysEnthusiast() {
  const [enthusiast, setEnthusiast] = useState<EnthusiastProfile | null>(null);
  const [allEnthusiasts, setAllEnthusiasts] = useState<EnthusiastProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAllEnthusiasts = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching enthusiasts from API...');
      const response = await fetch('/api/todays-enthusiast?all=true');
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`Failed to fetch bamboo enthusiasts: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      console.log('Enthusiasts data received:', data);
      setAllEnthusiasts(data);
      
      // Show a random enthusiast from the list
      if (data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setEnthusiast(data[randomIndex]);
      }
    } catch (err) {
      console.error('Error fetching enthusiasts:', err);
      setError('Could not load bamboo enthusiasts');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = () => {
    if (allEnthusiasts.length <= 1) return;
    
    setIsRefreshing(true);
    
    // Get a random enthusiast that's different from the current one
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * allEnthusiasts.length);
    } while (allEnthusiasts[newIndex].id === enthusiast?.id && allEnthusiasts.length > 1);
    
    setEnthusiast(allEnthusiasts[newIndex]);
    
    // Show refresh animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    fetchAllEnthusiasts();
  }, []);

  if (isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900 relative">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
            <User className="h-5 w-5 mr-2 text-amber-500" />
            Today's Bamboo Enthusiast
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Spotlighting innovators in sustainable bamboo design
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="ml-4 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-24 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !enthusiast) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
                <User className="h-5 w-5 mr-2 text-amber-500" />
                Today's Bamboo Enthusiast
              </CardTitle>

            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full text-zinc-400 hover:text-secondary"
              title="Refresh enthusiast profiles"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3.5 w-3.5 text-secondary" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-zinc-400">No bamboo enthusiast profile available today.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract first name for avatar fallback
  const nameParts = enthusiast.title.split(' ');
  const firstInitial = nameParts[0] ? nameParts[0][0] : 'B';
  const secondInitial = nameParts[1] ? nameParts[1][0] : 'E';
  const avatarFallback = `${firstInitial}${secondInitial}`;

  return (
    <Card className="border-zinc-800 bg-zinc-900 relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium text-zinc-200 flex items-center">
              <User className="h-5 w-5 mr-2 text-amber-500" />
              Bamboo Enthusiast
            </CardTitle>

          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-400 hover:text-amber-400 -mt-1 -mr-2"
            onClick={handleRefresh}
            disabled={isRefreshing || allEnthusiasts.length <= 1}
          >
            <RefreshCw className={`h-4 w-4 text-secondary ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-start mb-4">
          <Avatar className="h-12 w-12 border border-zinc-700">
            {enthusiast.mediaUrl ? (
              <AvatarImage src={enthusiast.mediaUrl} alt={enthusiast.title} />
            ) : null}
            <AvatarFallback className="bg-amber-900/30 text-amber-400 border-amber-700">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <h3 className="text-md font-medium text-zinc-200">{enthusiast.title}</h3>
            <p className="text-sm text-zinc-400">
              Bamboo Architect & Designer
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-zinc-300 line-clamp-4">{enthusiast.content}</p>
        </div>
        
        <div className="space-y-2 text-sm">
          {enthusiast.contactEmail && (
            <div className="flex items-center text-zinc-400">
              <Mail className="h-3.5 w-3.5 mr-2 text-amber-500" />
              <a 
                href={`mailto:${enthusiast.contactEmail}`} 
                className="hover:text-amber-400 transition-colors"
              >
                {enthusiast.contactEmail}
              </a>
            </div>
          )}
          
          {enthusiast.contactPhone && (
            <div className="flex items-center text-zinc-400">
              <Phone className="h-3.5 w-3.5 mr-2 text-amber-500" />
              <a 
                href={`tel:${enthusiast.contactPhone}`}
                className="hover:text-amber-400 transition-colors"
              >
                {enthusiast.contactPhone}
              </a>
            </div>
          )}
        </div>
        
        <EnthusiastSocialLinks
          instagramUrl={enthusiast.instagramUrl}
          linkedinUrl={enthusiast.linkedinUrl}
          twitterUrl={enthusiast.twitterUrl}
          facebookUrl={enthusiast.facebookUrl}
          youtubeUrl={enthusiast.youtubeUrl}
          personalWebsite={enthusiast.personalWebsite}
          githubUrl={enthusiast.githubUrl}
        />
      </CardContent>
      

    </Card>
  );
}

export default TodaysEnthusiast;