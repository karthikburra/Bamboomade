import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Instagram, Linkedin, Youtube, ExternalLink } from 'lucide-react';

interface SocialMediaEmbedProps {
  platform: 'instagram' | 'youtube' | 'linkedin' | 'twitter';
  embedCode: string;
  title: string;
  link: string;
}

const SocialMediaEmbed: React.FC<SocialMediaEmbedProps> = ({ 
  platform, 
  embedCode, 
  title, 
  link 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !embedCode) return;

    // Create a wrapper and set its innerHTML to the embed code
    const embedWrapper = document.createElement('div');
    embedWrapper.innerHTML = embedCode;

    // Clear any existing content and append the new embed
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(embedWrapper);

    // Load Instagram embed script if needed
    if (platform === 'instagram' && window.instgrm) {
      window.instgrm.Embeds.process();
    }

    // Load Twitter embed script if needed
    if (platform === 'twitter' && (window as any).twttr) {
      (window as any).twttr.widgets.load();
    }
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

  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-900 h-full flex flex-col">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {renderIcon()}
          <h3 className="font-medium text-sm text-zinc-200">{title}</h3>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div 
        ref={containerRef} 
        className={`w-full flex-grow flex items-center justify-center bg-zinc-800/50 embed-container ${
          platform === 'instagram' ? 'instagram-embed' : 
          platform === 'youtube' ? 'youtube-embed' : 
          platform === 'linkedin' ? 'linkedin-embed' : ''
        }`}
        style={{
          padding: platform === 'instagram' ? '8px' : '0',
          minHeight: platform === 'youtube' ? '315px' : 
                    platform === 'linkedin' ? '500px' : 
                    platform === 'instagram' ? '450px' : '350px'
        }}
      >
        <div className="text-center text-zinc-500 text-sm">Loading embed...</div>
      </div>
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