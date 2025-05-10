import React from 'react';
import { Instagram, Linkedin, Twitter, Facebook, Youtube, Globe, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  githubUrl
}: EnthusiastSocialLinksProps) {
  const socialLinks = [
    { url: instagramUrl, icon: Instagram, color: 'text-pink-500 hover:text-pink-400' },
    { url: linkedinUrl, icon: Linkedin, color: 'text-blue-600 hover:text-blue-500' },
    { url: twitterUrl, icon: Twitter, color: 'text-sky-500 hover:text-sky-400' },
    { url: facebookUrl, icon: Facebook, color: 'text-blue-700 hover:text-blue-600' },
    { url: youtubeUrl, icon: Youtube, color: 'text-red-600 hover:text-red-500' },
    { url: personalWebsite, icon: Globe, color: 'text-green-500 hover:text-green-400' },
    { url: githubUrl, icon: Github, color: 'text-gray-400 hover:text-gray-300' }
  ];

  // Filter out null or undefined URLs
  const availableSocialLinks = socialLinks.filter(link => link.url);

  if (availableSocialLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {availableSocialLinks.map((link, index) => {
        const IconComponent = link.icon;
        return (
          <a 
            key={index}
            href={link.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button
              variant="outline"
              size="icon"
              className={`h-7 w-7 rounded-full bg-zinc-800 border-zinc-700 ${link.color}`}
            >
              <IconComponent className="h-3.5 w-3.5" />
              <span className="sr-only">
                {link.icon.name}
              </span>
            </Button>
          </a>
        );
      })}
    </div>
  );
}

export default EnthusiastSocialLinks;