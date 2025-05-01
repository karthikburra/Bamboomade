import React from "react";
import Hero from "@/components/Hero";
import FeaturedProjects from "@/components/FeaturedProjects";
import WhyBambooMade from "@/components/WhyBambooMade";
import CallToAction from "@/components/CallToAction";
import TeamMembers from "@/components/TeamMembers";
import WorkshopLocations from "@/components/WorkshopLocations";
import { Helmet } from "react-helmet";

const Home: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>BambooMade - Beyond Tradition: Building a Sustainable Modern Future</title>
        <meta name="description" content="BambooMade provides bamboo workshops, architectural solutions, and student project guidance. We specialize in sustainable design using bamboo as a versatile building material." />
      </Helmet>
      
      <Hero />
      <WhyBambooMade />
      <FeaturedProjects />
      {/* <WorkshopLocations /> */}
      <TeamMembers />
      <CallToAction />
    </>
  );
};

export default Home;
