import React from "react";
import WorkshopDetail, { WorkshopHighlight, WorkshopImage } from "@/components/WorkshopDetail";

const BambooLightingWorkshop: React.FC = () => {
  const highlights: WorkshopHighlight[] = [
    {
      id: "highlight-1",
      content: "Hands-on experience creating bamboo lamp designs using sustainable bamboo strips and traditional weaving techniques."
    },
    {
      id: "highlight-2",
      content: "Exploration of lighting design principles including form, function, light diffusion, and aesthetic appeal."
    },
    {
      id: "highlight-3",
      content: "Integration of modern lighting components with traditional bamboo craftsmanship for contemporary sustainable designs."
    }
  ];

  const images: WorkshopImage[] = [
    {
      url: "/img/projects/bamboo-lamp-new.png",
      alt: "Bamboo pendant lamp with elegant strips design",
      caption: "Bamboo pendant lamp designed and created during the workshop"
    },
    {
      url: "/img/projects/bamboo-workshop-training.png",
      alt: "Participants creating bamboo lamps",
      caption: "Workshop participants learning bamboo lamp making techniques"
    },
    {
      url: "/img/projects/bamboo-model.png",
      alt: "Various bamboo lamp designs",
      caption: "Multiple lighting design approaches explored in the workshop"
    }
  ];

  return (
    <WorkshopDetail
      id="bamboo-lighting"
      title="Bamboo Lighting Design Workshop"
      location="Hyderabad, India"
      date="Feb 2023"
      duration="5 days workshop"
      description="A specialized workshop focused on the art of crafting elegant and sustainable bamboo lighting solutions. Participants explored various bamboo preparation techniques, lighting design principles, and created their own unique bamboo lamps combining traditional craftsmanship with contemporary design aesthetics."
      highlights={highlights}
      images={images}
      prevWorkshopId="sirpur"
    />
  );
};

export default BambooLightingWorkshop;