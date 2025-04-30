import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brush, 
  Construction, 
  Home, 
  UsersRound
} from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  imageUrl: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description, imageUrl }) => {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
      </div>
      <CardContent className="pt-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
          {icon}
        </div>
        <h3 className="mb-2 text-xl font-medium text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const WhyBambooMade: React.FC = () => {
  const features = [
    {
      icon: <Brush size={24} />,
      title: "Art and Craft",
      description: "Bamboo weavers skillfully twist and intertwine thin strips, creating beautiful patterns with nature's versatile gift.",
      imageUrl: "/img/projects/bamboo-mirror.png"
    },
    {
      icon: <Construction size={24} />,
      title: "Bamboo Joinery",
      description: "Immerse yourself in a bamboo furniture design journey, crafting timeless pieces, harmonizing nature's design.",
      imageUrl: "/img/projects/bamboo-joinery.png"
    },
    {
      icon: <Home size={24} />,
      title: "Design Studios",
      description: "Architectural Design Studio, focusing on bamboo's potential as a sustainable building material.",
      imageUrl: "/img/projects/bamboo-structure.png"
    },
    {
      icon: <UsersRound size={24} />,
      title: "Community Trainings",
      description: "Bamboo workshop is to equip villagers with essential bamboo crafting skills, fostering self-sustainability and economic empowerment.",
      imageUrl: "/img/projects/bamboo-chair.png"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-green-50/30 dark:to-green-950/30">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-green-800 dark:text-green-300 sm:text-4xl">
            We Curate Bamboo Workshops
          </h2>
          <p className="mt-4 text-lg text-green-700 dark:text-green-400 max-w-2xl mx-auto">
            Our experience and expertise help create sustainable solutions with bamboo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              imageUrl={feature.imageUrl}
            />
          ))}
        </div>
        
        <div className="mt-16 text-center bg-green-50 dark:bg-green-900/20 p-8 rounded-lg">
          <h3 className="text-2xl font-semibold mb-4 text-green-800 dark:text-green-300">Our Experience</h3>
          <p className="text-lg text-green-700 dark:text-green-200 max-w-3xl mx-auto">
            "Through our successfully conducted workshops, we have ignited creativity, empowered participants, and built a strong foundation for Bamboo centric design."
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhyBambooMade;
