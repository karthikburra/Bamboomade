import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EnthusiastSocialLinks } from "./EnthusiastSocialLinks";
import { Skeleton } from "@/components/ui/skeleton";

interface EnthusiastProfile {
  id: number;
  title: string;
  content: string;
  contentType: string;
  mediaUrl: string | null;
  contactEmail: string | null;
  phoneNumber: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  personalWebsite: string | null;
}

export function TodaysEnthusiast() {
  const [enthusiast, setEnthusiast] = useState<EnthusiastProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnthusiast = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(
          "GET",
          "/api/todays-enthusiast",
          null
        );
        const data = await response.json();
        setEnthusiast(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch today's enthusiast", err);
        setError("Failed to load today's enthusiast");
      } finally {
        setLoading(false);
      }
    };

    fetchEnthusiast();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <Card className="shadow-xl border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden h-full">
        <CardHeader className="pb-2 relative">
          <div className="absolute top-0 left-0 right-0 h-full opacity-10 bg-[radial-gradient(circle_at_30%_-20%,_#047857_0%,_transparent_50%)]"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Skeleton className="h-7 w-40" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-4 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-20 w-full mt-4" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !enthusiast) {
    return (
      <Card className="shadow-xl border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden h-full">
        <CardHeader className="pb-2 relative">
          <div className="absolute top-0 left-0 right-0 h-full opacity-10 bg-[radial-gradient(circle_at_30%_-20%,_#047857_0%,_transparent_50%)]"></div>
          <div className="relative">
            <CardTitle className="text-lg font-medium text-zinc-100 flex items-center">
              <User2 className="h-5 w-5 mr-2 text-emerald-400" />
              Today's Bamboo Enthusiast
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-zinc-400 text-center">
            {error || "Unable to load today's enthusiast."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Content state
  return (
    <Card className="shadow-xl border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden h-full">
      <CardHeader className="pb-2 relative">
        <div className="absolute top-0 left-0 right-0 h-full opacity-10 bg-[radial-gradient(circle_at_30%_-20%,_#047857_0%,_transparent_50%)]"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center">
            <CardTitle className="text-lg font-medium text-zinc-100 flex items-center">
              <User2 className="h-5 w-5 mr-2 text-emerald-400" />
              Today's Bamboo Enthusiast
            </CardTitle>
            <CardDescription className="text-zinc-400 ml-2">
              Featured profile
            </CardDescription>
          </div>
          <div className="flex items-center">
            <span className="bg-emerald-400/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium">
              Spotlight
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-4 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start mb-4">
          <Avatar className="h-24 w-24 border-2 border-emerald-500/20">
            <AvatarImage src={enthusiast.mediaUrl || ""} alt={enthusiast.title} />
            <AvatarFallback className="bg-emerald-950 text-emerald-200 text-xl">
              {enthusiast.title
                .split(" ")
                .map((word) => word[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-semibold text-zinc-100 mb-1">
              {enthusiast.title}
            </h3>
            {enthusiast.contactEmail && (
              <a
                href={`mailto:${enthusiast.contactEmail}`}
                className="text-zinc-400 hover:text-emerald-300 transition-colors text-sm mb-1 block"
              >
                {enthusiast.contactEmail}
              </a>
            )}
            {enthusiast.phoneNumber && (
              <a
                href={`tel:${enthusiast.phoneNumber}`}
                className="text-zinc-400 hover:text-emerald-300 transition-colors text-sm block"
              >
                {enthusiast.phoneNumber}
              </a>
            )}
          </div>
        </div>

        <div className="text-zinc-300 text-sm mt-4 mb-6 line-clamp-4">
          {enthusiast.content}
        </div>

        <EnthusiastSocialLinks
          instagramUrl={enthusiast.instagramUrl}
          linkedinUrl={enthusiast.linkedinUrl}
          twitterUrl={enthusiast.twitterUrl}
          facebookUrl={enthusiast.facebookUrl}
          youtubeUrl={enthusiast.youtubeUrl}
          personalWebsite={enthusiast.personalWebsite}
        />

        <div className="mt-6 pt-4 border-t border-zinc-800/50">
          <a 
            href={`/ai-knowledge-database?contentId=${enthusiast.id}`}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center"
          >
            View full profile in Knowledge Database
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default TodaysEnthusiast;