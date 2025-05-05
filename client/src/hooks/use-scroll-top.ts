import { useEffect } from "react";

/**
 * Hook that scrolls the window to the top when a component mounts
 */
export function useScrollTop() {
  useEffect(() => {
    // Scroll to top immediately
    window.scrollTo(0, 0);
    
    // Add a slight delay to ensure the scroll works even after the page renders
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
}

export default useScrollTop;