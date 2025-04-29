import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Import leaf images
import leaf1 from "@assets/Group.png";
import leaf2 from "@assets/Group-1.png";
import leaf3 from "@assets/Group-2.png";
import leaf4 from "@assets/Group-3.png";
import leaf5 from "@assets/Group-4.png";
import leaf6 from "@assets/Vector.png";
import leaf7 from "@assets/Vector-1.png";

interface Leaf {
  id: number;
  src: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  initialX: number;
  initialY: number;
}

const AnimatedLeaves: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  // Initialize leaves and window size
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Call once to set initial size
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Generate strategically placed leaves with increased density (30% more)
    const leafSources = [leaf1, leaf2, leaf3, leaf4, leaf5, leaf6, leaf7];
    const leafCount = 10; // Increased from 7 to 10 (approx 30% more)
    const initialLeaves: Leaf[] = [];

    // Create leaves in specific areas of the page with more positions
    // This creates a more balanced and natural look with increased density
    const positions = [
      // Original positions
      { x: window.innerWidth * 0.1, y: window.innerHeight * 0.2 }, // Top left
      { x: window.innerWidth * 0.85, y: window.innerHeight * 0.15 }, // Top right
      { x: window.innerWidth * 0.75, y: window.innerHeight * 0.5 }, // Middle right
      { x: window.innerWidth * 0.2, y: window.innerHeight * 0.6 }, // Middle left
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.3 }, // Top middle
      { x: window.innerWidth * 0.9, y: window.innerHeight * 0.85 }, // Bottom right
      { x: window.innerWidth * 0.15, y: window.innerHeight * 0.9 }, // Bottom left
      
      // Additional positions for increased density
      { x: window.innerWidth * 0.3, y: window.innerHeight * 0.25 }, // Upper left-center
      { x: window.innerWidth * 0.65, y: window.innerHeight * 0.35 }, // Upper right-center
      { x: window.innerWidth * 0.4, y: window.innerHeight * 0.7 }, // Lower left-center
      { x: window.innerWidth * 0.6, y: window.innerHeight * 0.8 }, // Lower right-center
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.6 }, // Center
    ];

    // Add primary leaves at defined positions
    for (let i = 0; i < leafCount; i++) {
      const position = positions[i % positions.length];
      // Add some randomness to the predetermined positions
      const randomOffsetX = (Math.random() - 0.5) * 150;
      const randomOffsetY = (Math.random() - 0.5) * 150;
      
      initialLeaves.push({
        id: i,
        src: leafSources[i % leafSources.length],
        x: position.x + randomOffsetX,
        y: position.y + randomOffsetY,
        rotation: Math.random() * 360,
        scale: 0.4 + Math.random() * 0.4, // Scale between 0.4 and 0.8 (smaller)
        initialX: position.x + randomOffsetX,
        initialY: position.y + randomOffsetY,
      });
    }
    
    // Add additional scattered leaves for greater density
    for (let i = 0; i < 3; i++) { // Adding 3 more leaves for extra density
      // Place these leaves in more random positions
      const randomX = Math.random() * window.innerWidth;
      const randomY = Math.random() * window.innerHeight;
      
      initialLeaves.push({
        id: leafCount + i,
        src: leafSources[Math.floor(Math.random() * leafSources.length)], // Random leaf image
        x: randomX,
        y: randomY,
        rotation: Math.random() * 360,
        scale: 0.3 + Math.random() * 0.3, // Slightly smaller
        initialX: randomX,
        initialY: randomY,
      });
    }

    setLeaves(initialLeaves);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Update leaf positions based on mouse position
  useEffect(() => {
    if (leaves.length === 0) return;

    const updateLeaves = () => {
      setLeaves((prevLeaves) =>
        prevLeaves.map((leaf) => {
          // Calculate distance from mouse to leaf
          const dx = mousePosition.x - leaf.x;
          const dy = mousePosition.y - leaf.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // The closer the leaf is to the mouse, the more it moves
          const maxDistance = 300; // Max distance for influence
          const influence = Math.max(0, 1 - distance / maxDistance);
          
          // Apply a gentle repulsion effect
          let newX = leaf.x;
          let newY = leaf.y;
          
          if (distance < maxDistance) {
            // Move away from the mouse with a dampening effect
            const repelStrength = 0.5;
            newX = leaf.x - (dx * influence * repelStrength);
            newY = leaf.y - (dy * influence * repelStrength);
          } else {
            // Slowly return to initial position when mouse is far away
            newX = leaf.x + (leaf.initialX - leaf.x) * 0.01;
            newY = leaf.y + (leaf.initialY - leaf.y) * 0.01;
          }
          
          // Ensure leaves stay within the screen bounds
          newX = Math.max(0, Math.min(windowSize.width, newX));
          newY = Math.max(0, Math.min(windowSize.height, newY));
          
          return {
            ...leaf,
            x: newX,
            y: newY,
            rotation: leaf.rotation + influence * 5, // Add gentle rotation based on influence
          };
        })
      );
    };

    const animationId = requestAnimationFrame(updateLeaves);
    return () => cancelAnimationFrame(animationId);
  }, [mousePosition, leaves, windowSize]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-50">
      {leaves.map((leaf) => (
        <motion.img
          key={leaf.id}
          src={leaf.src}
          className="absolute"
          style={{
            top: leaf.y,
            left: leaf.x,
            height: leaf.src.includes("Vector") ? "70px" : "50px", // Slightly smaller leaves
            width: "auto",
            opacity: 0.5, // More transparent for subtlety
            zIndex: 100,
            filter: "blur(0.5px)", // Very slight blur for depth
          }}
          animate={{
            rotate: leaf.rotation,
            scale: leaf.scale,
          }}
          transition={{
            type: "spring",
            damping: 15,          // Increased damping for smoother motion
            stiffness: 30,        // Lower stiffness for gentler movement
            mass: 0.8,            // Slightly lighter feel
            velocity: 0.5,        // Lower initial velocity
          }}
          draggable="false"
        />
      ))}
    </div>
  );
};

export default AnimatedLeaves;