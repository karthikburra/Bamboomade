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
    <Card className="overflow-hidden border-zinc-800 bg-zinc-950 h-full w-full flex flex-col relative group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div 
        ref={containerRef} 
        className={`w-full flex-grow flex items-center justify-center bg-zinc-800/50 embed-container ${
          platform === 'instagram' ? 'instagram-embed' : 
          platform === 'youtube' ? 'youtube-embed' : 
          platform === 'linkedin' ? 'linkedin-embed' : ''
        }`}
        style={{
          padding: platform === 'instagram' ? '8px' : '0',
          minHeight: '250px',
          maxHeight: platform === 'youtube' || platform === 'linkedin' || platform === 'instagram' ? 'none' : '350px',
          height: platform === 'youtube' || platform === 'linkedin' || platform === 'instagram' ? '100%' : 'auto'
        }}
      >
        <div className="text-center text-zinc-500 text-sm">Loading embed...</div>
      </div>
      
      {/* Platform badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
          platform === 'instagram' ? 'bg-gradient-to-r from-purple-600 to-pink-500' : 
          platform === 'youtube' ? 'bg-gradient-to-r from-red-600 to-red-700' : 
          platform === 'linkedin' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
          platform === 'twitter' ? 'bg-gradient-to-r from-sky-400 to-sky-500' : 
          'bg-gradient-to-r from-zinc-700 to-zinc-800'
        } shadow-lg`}>
          {renderIcon()}
          <span className="text-xs font-medium text-white capitalize">
            {platform}
          </span>
        </div>
      </div>
      
      {/* External link */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
        >
          <ExternalLink className="h-4 w-4 text-white" />
        </a>
      </div>
      
      {/* Content overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
      
      {/* Content info */}
      <CardContent className="p-4 absolute bottom-0 left-0 right-0 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <div className="mb-2">
          <h3 className="font-semibold text-base text-white group-hover:text-amber-300 transition-colors">{title}</h3>
          <p className="text-sm text-zinc-200 line-clamp-2 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">{getDescription()}</p>
        </div>
        
        <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 px-2 py-1 rounded bg-black/30 backdrop-blur-sm"
          >
            View full {platform === 'youtube' ? 'video' : 'post'} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
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