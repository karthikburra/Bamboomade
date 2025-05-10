import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Instagram, Linkedin, Youtube, ExternalLink } from 'lucide-react';

interface SocialMediaEmbedProps {
  platform: 'instagram' | 'youtube' | 'linkedin' | 'twitter';
  embedCode: string;
  title: string;
  link: string;
  description?: string;
}

const SocialMediaEmbed: React.FC<SocialMediaEmbedProps> = ({ 
  platform, 
  embedCode, 
  title, 
  link,
  description
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !embedCode) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create a wrapper and set its innerHTML to the embed code
    const embedWrapper = document.createElement('div');
    embedWrapper.innerHTML = embedCode;
    containerRef.current.appendChild(embedWrapper);

    // Load Instagram embed script if needed
    if (platform === 'instagram' && window.instgrm) {
      window.instgrm.Embeds.process();
    }

    // Load Twitter embed script if needed
    if (platform === 'twitter' && (window as any).twttr) {
      (window as any).twttr.widgets.load();
    }

    // Cleanup function 
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [embedCode, platform]);

  const renderIcon = () => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-500" />;
      case 'youtube':
        return <Youtube className="h-5 w-5 text-red-500" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5 text-blue-500" />;
      case 'twitter':
        return (
          <svg className="h-5 w-5 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      default:
        return <ExternalLink className="h-5 w-5 text-gray-500" />;
    }
  };

  // Generate platform-specific descriptions if none provided
  const getDescription = () => {
    if (description) return description;
    
    switch (platform) {
      case 'instagram':
        return "View this inspiring post about bamboo architecture on Instagram";
      case 'youtube':
        return "Watch this video about innovative bamboo design techniques";
      case 'linkedin':
        return "Read about the latest trends in sustainable bamboo construction";
      case 'twitter':
        return "Check out this discussion about bamboo architecture on X";
      default:
        return "Explore more bamboo-related content";
    }
  };

  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-900 h-full flex flex-col relative">
      <div 
        ref={containerRef} 
        className={`w-full flex-grow flex items-center justify-center bg-zinc-800/50 embed-container ${
          platform === 'instagram' ? 'instagram-embed' : 
          platform === 'youtube' ? 'youtube-embed' : 
          platform === 'linkedin' ? 'linkedin-embed' : ''
        }`}
        style={{
          padding: platform === 'instagram' ? '8px' : '0',
          minHeight: platform === 'youtube' ? '230px' : 
                    platform === 'linkedin' ? '300px' : 
                    platform === 'instagram' ? '300px' : '250px',
          maxHeight: '350px'
        }}
      >
        <div className="text-center text-zinc-500 text-sm">Loading embed...</div>
      </div>
      
      <div className="absolute top-2 right-2 z-10">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          <ExternalLink className="h-4 w-4 text-white" />
        </a>
      </div>
      
      <CardContent className="p-3 pb-1 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
        <div className="flex items-center gap-2 mb-1">
          {renderIcon()}
          <h3 className="font-semibold text-sm text-white">{title}</h3>
        </div>
        <p className="text-xs text-zinc-200 line-clamp-2">{getDescription()}</p>
      </CardContent>
    </Card>
  );
};

export default SocialMediaEmbed;

// For TypeScript support
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}