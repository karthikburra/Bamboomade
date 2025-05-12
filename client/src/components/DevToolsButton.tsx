import React from "react";
import { useLocation } from "wouter";

// Only show in development mode
const isDev = process.env.NODE_ENV === 'development';

const DevToolsButton: React.FC = () => {
  const [, navigate] = useLocation();

  if (!isDev) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-amber-600 hover:bg-amber-700 text-white rounded-full w-12 h-12 flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110"
      onClick={() => navigate("/dev-tools")}
      title="Developer Tools"
    >
      <span className="text-xl">🛠️</span>
    </div>
  );
};

export default DevToolsButton;