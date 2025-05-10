import React from "react";
import {
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnthusiastSocialLinksProps {
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  personalWebsite?: string | null;
  githubUrl?: string | null;
}

export function EnthusiastSocialLinks({
  instagramUrl,
  linkedinUrl,
  twitterUrl,
  facebookUrl,
  youtubeUrl,
  personalWebsite,
  githubUrl,
}: EnthusiastSocialLinksProps) {
  // Only show the component if at least one social link is present
  const hasSocialLinks =
    instagramUrl ||
    linkedinUrl ||
    twitterUrl ||
    facebookUrl ||
    youtubeUrl ||
    personalWebsite ||
    githubUrl;

  if (!hasSocialLinks) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition-transform"
        >
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-yellow-500 p-[1px] hover:from-pink-600 hover:via-purple-600 hover:to-yellow-600"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
              <Instagram className="h-4 w-4 text-zinc-200" />
            </span>
          </Button>
        </a>
      )}
      
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition-transform"
        >
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 p-[1px] hover:from-blue-600 hover:to-blue-800"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
              <Linkedin className="h-4 w-4 text-zinc-200" />
            </span>
          </Button>
        </a>
      )}
      
      {twitterUrl && (
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition-transform"
        >
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-[1px] hover:from-blue-500 hover:to-blue-700"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
              <Twitter className="h-4 w-4 text-zinc-200" />
            </span>
          </Button>
        </a>
      )}
      
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition-transform"
        >
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 p-[1px] hover:from-blue-700 hover:to-blue-900"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
              <Facebook className="h-4 w-4 text-zinc-200" />
            </span>
          </Button>
        </a>
      )}
      
      {youtubeUrl && (
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition-transform"
        >
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 p-[1px] hover:from-red-600 hover:to-red-800"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
              <Youtube className="h-4 w-4 text-zinc-200" />
            </span>
          </Button>
        </a>
      )}
      
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition-transform"
        >
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-700 p-[1px] hover:from-zinc-600 hover:to-zinc-800"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
              <Github className="h-4 w-4 text-zinc-200" />
            </span>
          </Button>
        </a>
      )}
      
      {personalWebsite && (
        <a
          href={personalWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-105 transition-transform"
        >
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 p-[1px] hover:from-emerald-600 hover:to-emerald-800"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
              <Globe className="h-4 w-4 text-zinc-200" />
            </span>
          </Button>
        </a>
      )}
    </div>
  );
}

export default EnthusiastSocialLinks;