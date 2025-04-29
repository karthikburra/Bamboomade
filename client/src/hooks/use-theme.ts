import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem("bamboomade-theme") as Theme | null;
    if (savedTheme) {
      return savedTheme;
    }
    
    // If no saved preference, check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    
    // Default to light theme
    return "light";
  });

  // Update the class on the document when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    // Save theme to localStorage
    localStorage.setItem("bamboomade-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
}
