import React from "react";
import Hero from "@/components/Hero";
import FeaturedProjects from "@/components/FeaturedProjects";
import WhyBambooMade from "@/components/WhyBambooMade";
import TestimonialsSection from "@/components/TestimonialsSection";
import CallToAction from "@/components/CallToAction";
import { Helmet } from "react-helmet";

const Home: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>BambooMade - Sustainable Bamboo Architecture</title>
        <meta name="description" content="BambooMade pioneers innovative and sustainable architectural solutions using bamboo, blending traditional craftsmanship with modern engineering." />
      </Helmet>
      
      <Hero />
      <FeaturedProjects />
      <WhyBambooMade />
      <TestimonialsSection />
      <CallToAction />
    </>
  );
};

export default Home;
