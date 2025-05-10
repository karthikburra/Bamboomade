import React, { useEffect } from 'react';

/**
 * Component to load the Instagram embed script
 * This is needed to properly render Instagram embeds
 */
const InstagramScript: React.FC = () => {
  useEffect(() => {
    // Check if Instagram script is already loaded
    if (!document.getElementById('instagram-embed-script')) {
      const script = document.createElement('script');
      script.id = 'instagram-embed-script';
      script.src = '//www.instagram.com/embed.js';
      script.async = true;
      script.defer = true;
      
      // Add the script to the document
      document.body.appendChild(script);
      
      // Process any existing Instagram embeds
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    } else if (window.instgrm) {
      // If script exists but embeds need processing
      window.instgrm.Embeds.process();
    }
    
    // Cleanup on unmount
    return () => {
      // We don't remove the script since other components might need it
    };
  }, []);
  
  return null;
};

export default InstagramScript;