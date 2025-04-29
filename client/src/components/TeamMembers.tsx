import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SiLinkedin } from "react-icons/si";
import karthikImage from "@assets/karthik burra.png";
import dollyImage from "@assets/Dolly_Chandrawanshi.jpeg";
import krishnaiahPic from "@assets/krishnaiah.png";
import teamMember3 from "@assets/team_member3.png";
import anjilammaPic from "@assets/anjilamma.png";

interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  linkedinUrl?: string;
}

const TeamMember: React.FC<TeamMemberProps> = ({ 
  name, 
  role, 
  bio, 
  imageUrl, 
  linkedinUrl 
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover object-center" 
        />
      </div>
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-1 text-green-800 dark:text-green-300">{name}</h3>
        <p className="text-green-600 dark:text-green-400 font-medium mb-3">{role}</p>
        <p className="text-green-700 dark:text-green-200 text-sm mb-4">{bio}</p>
        {linkedinUrl && (
          <a 
            href={linkedinUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            <SiLinkedin className="h-5 w-5 mr-2" />
            Connect on LinkedIn
          </a>
        )}
      </CardContent>
    </Card>
  );
};

const TeamMembers: React.FC = () => {
  const teamMembers = [
    {
      name: "Ar. Karthik Burra",
      role: "Founder",
      bio: "M.Des. Industrial Design - Srishti institute of Art Design and Technology B.Arch - CSIIT Hyderabad. He is an Industrious designer with extensive experience in large-scale Architectural projects and Bamboo product design as well as User Experience design (Ux designer).",
      imageUrl: karthikImage,
      linkedinUrl: "https://www.linkedin.com/in/karthik-burra-75a326a1/",
    },
    {
      name: "Ar. Dolly Chandrawanshi",
      role: "Co-Founder",
      bio: "B.Arch - NIT Raipur. Dolly is an architect with a deep passion for traditional and sustainable design. Her childhood village home, made of mud, bamboo & timber, inspired her to explore the potential of local materials and techniques.",
      imageUrl: dollyImage,
      linkedinUrl: "https://www.linkedin.com/in/ar-dolly-chandrawanshi-1786801b1/",
    },
    {
      name: "Krishnaiah",
      role: "Artisan",
      bio: "Highly skilled bamboo craftsman specializing in traditional weaving patterns.",
      imageUrl: krishnaiahPic,
    },
    {
      name: "Anjilamma",
      role: "Master Weaver",
      bio: "A highly skilled bamboo weaver with expertise in creating intricate patterns and designs. Her dedication to preserving traditional techniques while innovating new applications has been invaluable to our team.",
      imageUrl: anjilammaPic,
    },
    {
      name: "Narender",
      role: "Carpenter",
      bio: "Expert woodworker with specialized knowledge in bamboo-wood joint techniques.",
      imageUrl: teamMember3,
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-green-800 dark:text-green-300 sm:text-4xl">
            Our Team
          </h2>
          <p className="mt-4 text-lg text-green-700 dark:text-green-400 max-w-2xl mx-auto">
            Meet the passionate professionals and artisans behind BambooMade's innovative designs.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member, index) => (
            <TeamMember
              key={index}
              name={member.name}
              role={member.role}
              bio={member.bio}
              imageUrl={member.imageUrl}
              linkedinUrl={member.linkedinUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamMembers;