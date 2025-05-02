import React from "react";
import WorkshopDetail, { WorkshopHighlight, WorkshopImage } from "@/components/WorkshopDetail";

const InternationalBambooFestWorkshop: React.FC = () => {
  const highlights: WorkshopHighlight[] = [
    {
      id: "highlight-1",
      content: "We aim to grow alongside this incredible resource, contributing to its sustainable future worldwide. Attending the International Bamboo Festival has been an inspiring experience!"
    },
    {
      id: "highlight-2",
      content: "Connecting with passionate bamboo people and learning from their diverse approaches to bamboo design and construction."
    },
    {
      id: "highlight-3",
      content: "Connecting with Bamboo Architects globally and learning from their experiences was an extra step in our journey to make bamboo the primary material for building structures in India."
    }
  ];

  const images: WorkshopImage[] = [
    {
      url: "/img/workshops/bamboo-workshop-international.png",
      alt: "International Bamboo Festival participants",
      caption: "International workshop collaboration at Tadom Hill Resorts"
    },
    {
      url: "/img/projects/bamboo-model.png",
      alt: "Sustainable bamboo structure model",
      caption: "Eco-friendly architecture models created during the festival"
    },
    {
      url: "/img/projects/bamboo-lamp.png",
      alt: "Collaborative bamboo design",
      caption: "Cross-cultural bamboo design approaches"
    }
  ];

  return (
    <WorkshopDetail
      id="international-bamboo-fest"
      title="International Bamboo Festival '23"
      location="Kuala Lumpur, Malaysia"
      date="Nov 2023"
      duration="7 days workshop"
      description="At International Bamboo Festival, collaborating with Ewe Jin Low Better Bamboo Buildings to volunteer a bamboo workshop at Tadom Hill Resorts. During this time, we modelled sustainable bamboo structures, shared insights on eco-friendly architecture, and contributed in the worldwide push for sustainable living."
      highlights={highlights}
      images={images}
      prevWorkshopId="bond-with-bamboo"
      nextWorkshopId="manit-bhopal"
    />
  );
};

export default InternationalBambooFestWorkshop;