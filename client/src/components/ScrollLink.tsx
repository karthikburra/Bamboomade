import React from 'react';
import { Link } from 'wouter';

/**
 * Custom Link component that scrolls to top when clicked
 */
interface ScrollLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const ScrollLink: React.FC<ScrollLinkProps> = ({ 
  href, 
  children, 
  className, 
  onClick 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If there's a custom onClick handler, call it
    if (onClick) {
      onClick(e);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
};

export default ScrollLink;