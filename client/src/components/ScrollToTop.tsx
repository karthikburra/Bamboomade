import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Component that scrolls the window to the top whenever the route changes
 */
export const ScrollToTop: React.FC = () => {
  const [location] = useLocation();
  
  useEffect(() => {
    // Scroll to top when location changes
    window.scrollTo(0, 0);
  }, [location]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;