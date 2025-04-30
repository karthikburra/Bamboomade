import { useEffect } from "react";

// Only dark theme is supported
type Theme = "dark";

export function useTheme() {
  // Always use dark theme
  const theme: Theme = "dark";

  // Set dark mode on initial render
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add("dark");
    
    // Save preference to localStorage for consistency
    localStorage.setItem("bamboomade-theme", "dark");
  }, []);

  // Empty function to maintain API compatibility
  const toggleTheme = () => {
    // No-op since we only support dark mode
    console.log("Only dark mode is supported");
  };

  return { theme, toggleTheme };
}
