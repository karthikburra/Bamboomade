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
import bamboo from "@assets/bamboo.png";

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

    // Add bamboo stalks in strategic positions
    const bambooCount = 3; // Add 3 bamboo stalks
    const bambooPositions = [
      { x: window.innerWidth * 0.05, y: window.innerHeight * 0.6 }, // Left side
      { x: window.innerWidth * 0.95, y: window.innerHeight * 0.35 }, // Right side
      { x: window.innerWidth * 0.8, y: window.innerHeight * 0.75 }, // Bottom right
    ];
    
    // Add bamboo stalks with different styles
    for (let i = 0; i < bambooCount; i++) {
      const position = bambooPositions[i % bambooPositions.length];
      // Add some randomness to the predetermined positions
      const randomOffsetX = (Math.random() - 0.5) * 100;
      const randomOffsetY = (Math.random() - 0.5) * 100;
      
      initialLeaves.push({
        id: leafCount + 3 + i, // Continue from where we left off with leaves
        src: bamboo,
        x: position.x + randomOffsetX,
        y: position.y + randomOffsetY,
        rotation: (Math.random() - 0.5) * 30, // Less rotation for bamboo (-15 to 15 degrees)
        scale: 0.7 + Math.random() * 0.6, // Larger than leaves (0.7 to 1.3)
        initialX: position.x + randomOffsetX,
        initialY: position.y + randomOffsetY,
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
          // Check if this is a bamboo stalk
          const isBamboo = leaf.src === bamboo;
          
          // Calculate distance from mouse to leaf
          const dx = mousePosition.x - leaf.x;
          const dy = mousePosition.y - leaf.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // The closer the leaf is to the mouse, the more it moves
          const maxDistance = isBamboo ? 400 : 300; // Bamboo has wider influence range
          const influence = Math.max(0, 1 - distance / maxDistance);
          
          // Apply a gentle repulsion effect
          let newX = leaf.x;
          let newY = leaf.y;
          
          if (distance < maxDistance) {
            // Different movement for bamboo vs leaves
            if (isBamboo) {
              // Bamboo sways more side-to-side (x-axis) than up-down
              const sideStrength = 0.6;
              const verticalStrength = 0.2;
              newX = leaf.x - (dx * influence * sideStrength);
              newY = leaf.y - (dy * influence * verticalStrength);
            } else {
              // Leaves move away from the mouse with a dampening effect
              const repelStrength = 0.5;
              newX = leaf.x - (dx * influence * repelStrength);
              newY = leaf.y - (dy * influence * repelStrength);
            }
          } else {
            // Slowly return to initial position when mouse is far away
            // Bamboo returns more slowly
            const returnRate = isBamboo ? 0.005 : 0.01;
            newX = leaf.x + (leaf.initialX - leaf.x) * returnRate;
            newY = leaf.y + (leaf.initialY - leaf.y) * returnRate;
          }
          
          // Ensure leaves stay within the screen bounds
          newX = Math.max(0, Math.min(windowSize.width, newX));
          newY = Math.max(0, Math.min(windowSize.height, newY));
          
          return {
            ...leaf,
            x: newX,
            y: newY,
            // Different rotation behavior for bamboo vs leaves
            rotation: isBamboo 
              ? leaf.rotation + (influence * 2) // Bamboo rotates less
              : leaf.rotation + (influence * 5), // Leaves rotate more
          };
        })
      );
    };

    const animationId = requestAnimationFrame(updateLeaves);
    return () => cancelAnimationFrame(animationId);
  }, [mousePosition, leaves, windowSize]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-50">
      {leaves.map((leaf) => {
        const isBamboo = leaf.src === bamboo;
        return (
          <motion.img
            key={leaf.id}
            src={leaf.src}
            className="absolute"
            style={{
              top: leaf.y,
              left: leaf.x,
              height: isBamboo 
                ? "180px" // Taller bamboo
                : leaf.src.includes("Vector") ? "70px" : "50px", // Leaves
              width: "auto",
              opacity: isBamboo ? 0.7 : 0.5, // Bamboo less transparent
              zIndex: isBamboo ? 80 : 100, // Bamboo behind leaves
              filter: isBamboo ? "brightness(1.1) blur(0px)" : "blur(0.5px)", // No blur for bamboo
              transformOrigin: isBamboo ? "bottom center" : "center", // Bamboo pivots from bottom
            }}
            animate={{
              rotate: leaf.rotation,
              scale: leaf.scale,
            }}
            transition={{
              type: "spring",
              damping: isBamboo ? 20 : 15, // Bamboo more stable
              stiffness: isBamboo ? 15 : 30, // Bamboo sways slower
              mass: isBamboo ? 1.2 : 0.8, // Bamboo heavier
              velocity: isBamboo ? 0.3 : 0.5, // Bamboo moves slower
            }}
            draggable="false"
          />
        );
      })}
    </div>
  );
};

export default AnimatedLeaves;