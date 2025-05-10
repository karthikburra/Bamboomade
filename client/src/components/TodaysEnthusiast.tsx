import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnthusiast = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/todays-enthusiast');
        if (!response.ok) {
          throw new Error('Failed to fetch today\'s bamboo enthusiast');
        }
        const data = await response.json();
        setEnthusiast(data);
      } catch (err) {
        console.error('Error fetching enthusiast:', err);
        setError('Could not load today\'s bamboo enthusiast');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnthusiast();
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
              <CardDescription className="text-zinc-400">
                Spotlighting innovators in sustainable bamboo design
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className="text-xs bg-teal-950/30 text-teal-400 border-teal-800/50"
              >
                Enthusiast
              </Badge>
            </div>
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
              Today's Bamboo Enthusiast
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Spotlighting innovators in sustainable bamboo design
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className="text-xs bg-amber-950/30 text-amber-400 border-amber-800/50"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Featured
            </Badge>
            <Badge 
              variant="outline" 
              className="text-xs bg-teal-950/30 text-teal-400 border-teal-800/50"
            >
              Enthusiast
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
              Added {formatDistanceToNow(new Date(enthusiast.createdAt), { addSuffix: true })}
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