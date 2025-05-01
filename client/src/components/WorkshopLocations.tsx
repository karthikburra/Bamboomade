import React from "react";
import { MapPin } from "lucide-react";

interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  date: string;
  description: string;
  coordinates: {
    x: number; // Percentage from left
    y: number; // Percentage from top
  };
}

const WorkshopLocations: React.FC = () => {
  const locations: Location[] = [
    {
      id: "icfai",
      name: "ICFAI School of Architecture",
      city: "Hyderabad",
      country: "India",
      date: "Nov 2024",
      description: "Upcoming architectural bamboo design workshop",
      coordinates: { x: 39, y: 61 } // Hyderabad position
    },
    {
      id: "sirpur",
      name: "Community Training at Sirpur",
      city: "Sirpur",
      country: "India",
      date: "Jan 2024",
      description: "Community training workshop",
      coordinates: { x: 43, y: 59 } // Chhattisgarh position
    },
    {
      id: "malaysia",
      name: "International Bamboo Festival",
      city: "Kuala Lumpur",
      country: "Malaysia",
      date: "Nov 2023",
      description: "Volunteer at the International Bamboo Festival",
      coordinates: { x: 75, y: 80 } // Kuala Lumpur position
    },
    {
      id: "manit",
      name: "MANIT",
      city: "Bhopal",
      country: "India",
      date: "Sept 2023",
      description: "03 days Workshop",
      coordinates: { x: 32, y: 55 } // Bhopal position
    },
    {
      id: "spa",
      name: "School of Planning and Architecture",
      city: "Delhi",
      country: "India",
      date: "Feb 2023",
      description: "05-day bond with the bamboo workshop",
      coordinates: { x: 32, y: 46 } // Delhi position
    },
    {
      id: "woxsen",
      name: "Woxsen University",
      city: "Hyderabad",
      country: "India",
      date: "Sept 2022",
      description: "03 days workshop",
      coordinates: { x: 39, y: 61 } // Hyderabad position
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-green-50/30 dark:to-green-950/30">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-green-800 dark:text-green-300 sm:text-4xl">
            Our Global Bamboo Workshops
          </h2>
          <p className="mt-4 text-lg text-green-700 dark:text-green-400 max-w-2xl mx-auto">
            Explore our bamboo workshops conducted across India and internationally in Malaysia.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl aspect-[16/9] bg-black rounded-lg overflow-hidden">
          {/* Map background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/img/india-map.png" alt="India and Southeast Asia Map" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Location pins */}
          {locations.map((location) => (
            <div
              key={location.id}
              className="absolute group"
              style={{
                left: `${location.coordinates.x}%`,
                top: `${location.coordinates.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="relative">
                <div className="flex flex-col items-center">
                  <MapPin className="h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] filter animate-pulse" />
                  <span className="text-white text-xs font-bold bg-black bg-opacity-50 px-1 rounded mt-1 whitespace-nowrap">
                    {location.city}
                  </span>
                </div>
                
                {/* Popup info */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-12 w-48 bg-white dark:bg-green-900 rounded shadow-lg p-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <h3 className="font-semibold text-green-900 dark:text-green-300">{location.name}</h3>
                  <p className="text-green-800 dark:text-green-400">{location.city}, {location.country}</p>
                  <p className="text-green-700 dark:text-green-500 text-xs">{location.date}</p>
                  <p className="text-green-600 dark:text-green-400 text-xs mt-1">{location.description}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 backdrop-blur-sm rounded p-2 text-xs z-10">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-white mr-1" />
              <span className="text-white">Workshop Locations</span>
            </div>
          </div>
        </div>

        {/* List view for mobile */}
        <div className="mt-12 lg:hidden">
          <h3 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-300 text-center">Workshop Locations</h3>
          <div className="space-y-4">
            {locations.map((location) => (
              <div key={location.id} className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-300">{location.name}</h4>
                <p className="text-green-800 dark:text-green-400">{location.city}, {location.country}</p>
                <p className="text-green-700 dark:text-green-500 text-sm">{location.date}</p>
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">{location.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkshopLocations;