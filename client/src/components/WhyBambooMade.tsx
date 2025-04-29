import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LeafyGreen, 
  Award, 
  Lightbulb, 
  BookOpen, 
  Users, 
  Recycle 
} from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <Card className="border-0 shadow-none bg-primary-50/50 dark:bg-primary-950/20">
      <CardContent className="pt-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
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
      icon: <LeafyGreen size={24} />,
      title: "Sustainable Materials",
      description: "We exclusively use responsibly harvested bamboo, a fast-growing and renewable resource that helps reduce deforestation.",
    },
    {
      icon: <Award size={24} />,
      title: "Expert Craftsmanship",
      description: "Our team combines traditional bamboo crafting techniques with innovative engineering for durable, beautiful structures.",
    },
    {
      icon: <Lightbulb size={24} />,
      title: "Innovative Design",
      description: "We push the boundaries of bamboo architecture with creative designs that showcase bamboo's unique properties.",
    },
    {
      icon: <BookOpen size={24} />,
      title: "Educational Workshops",
      description: "Learn bamboo construction techniques through our hands-on workshops for students, professionals, and enthusiasts.",
    },
    {
      icon: <Users size={24} />,
      title: "Student Counseling",
      description: "We provide specialized guidance to architecture students interested in sustainable bamboo construction methods.",
    },
    {
      icon: <Recycle size={24} />,
      title: "Carbon Negative",
      description: "Our bamboo structures sequester more carbon than is released during their construction, helping combat climate change.",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-primary-50/30 dark:to-primary-950/30">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why Choose BambooMade
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We're dedicated to pioneering sustainable architecture through innovative bamboo applications.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyBambooMade;
