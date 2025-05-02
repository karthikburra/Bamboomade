import React from "react";
import WorkshopDetail, { WorkshopHighlight, WorkshopImage } from "@/components/WorkshopDetail";

const BondWithBambooWorkshop: React.FC = () => {
  const highlights: WorkshopHighlight[] = [
    {
      id: "highlight-1",
      content: "Hands-on model making and form exploration were integral to our curriculum, providing a practical approach to designing bamboo buildings."
    },
    {
      id: "highlight-2",
      content: "We incorporated Bamboo Joinery and weaving techniques into our teachings for easy integration into product design, interiors, and architectural details."
    },
    {
      id: "highlight-3",
      content: "Participants showcased creative products like Tulip lamp, Pathway light, Pendant light, Bamboo planter, Bamboo Trestle bench, Tic Tac Toe Table, and more at the end of the workshop."
    }
  ];

  const images: WorkshopImage[] = [
    {
      url: "/img/projects/spa-delhi.png",
      alt: "Bamboo pendant lamp with elegant strips design",
      caption: "Bamboo pendant lamp created during the SPA Delhi workshop"
    },
    {
      url: "/img/projects/bamboo-model.png",
      alt: "Bamboo architectural model",
      caption: "Architectural model made with bamboo"
    },
    {
      url: "/img/projects/bamboo-lamp-new.png",
      alt: "Bamboo lamp design",
      caption: "Creative bamboo lamp designed by participants"
    }
  ];

  return (
    <WorkshopDetail
      id="bond-with-bamboo"
      title="Bond With Bamboo Workshop"
      location="Delhi, India"
      date="Mar 2023"
      duration="5 days workshop"
      description="The inclusive bamboo workshop at SPA Delhi welcomed participants from diverse backgrounds. Sharing knowledge with students, professionals, researchers, and professors was an extraordinary achievement. The resounding success of the 5-day workshop fuels our inspiration to integrate bamboo into architectural curriculum and studios."
      highlights={highlights}
      images={images}
      nextWorkshopId="international-bamboo-fest"
    />
  );
};

export default BondWithBambooWorkshop;