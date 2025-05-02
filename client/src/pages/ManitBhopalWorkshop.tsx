import React from "react";
import WorkshopDetail, { WorkshopHighlight, WorkshopImage } from "@/components/WorkshopDetail";

const ManitBhopalWorkshop: React.FC = () => {
  const highlights: WorkshopHighlight[] = [
    {
      id: "highlight-1",
      content: "We are delighted to have participants with diverse experiences and expertise as part of the workshop. We incorporated Bamboo Joinery and weaving techniques, making it easier to seamlessly integrate these skills into product design and interior decor."
    },
    {
      id: "highlight-2",
      content: "Providing practical, hands-on experience in bamboo joinery and weaving to deepen understanding of bamboo material and enable to design products utilizing this versatile material."
    },
    {
      id: "highlight-3",
      content: "Make presentations and detailed drawings to bring your bamboo ideas to life, with focus on professional documentation skills needed for bamboo product design."
    }
  ];

  const images: WorkshopImage[] = [
    {
      url: "/img/projects/bamboo-model.png",
      alt: "MANIT Bhopal Bamboo Workshop",
      caption: "National-level Bamboo Joinery and Craft Workshop"
    },
    {
      url: "/img/projects/bamboo-workshop-training.png",
      alt: "Hands-on bamboo joinery training",
      caption: "Participants learning bamboo joinery techniques"
    },
    {
      url: "/img/projects/bamboo-lamp.png",
      alt: "Bamboo product design",
      caption: "Creative bamboo products designed by participants"
    }
  ];

  return (
    <WorkshopDetail
      id="manit-bhopal"
      title="MANIT Bhopal Bamboo Craft & Joinery Workshop"
      location="Bhopal, India"
      date="Sept 2023"
      duration="3 days workshop"
      description="Conducted in partnership with COA TRC, Bhopal, and the IIA Bhopal Centre, this was a transformative 3-day National-level Bamboo Joinery and Craft workshop to empower participants with the knowledge and confidence to embrace bamboo as their primary material for designing products and create detailed drawings to bring bamboo-based ideas to life."
      highlights={highlights}
      images={images}
      prevWorkshopId="international-bamboo-fest"
      nextWorkshopId="sirpur"
    />
  );
};

export default ManitBhopalWorkshop;