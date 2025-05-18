import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";

interface Article {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  url: string;
}

const MediumArticles: React.FC = () => {
  // Article data from authentic sources
  const articles: Article[] = [
    {
      id: "affinity-for-bamboo",
      title: "An Affinity for Bamboo",
      description: "Dive into the fascinating world of bamboo and discover why this versatile plant has captured the hearts of designers, architects, and sustainability advocates around the globe.",
      imageUrl: "/img/medium/affinity-for-bamboo.jpg",
      date: "Apr 2023",
      url: "https://medium.com/@bamboomade/an-affinity-for-bamboo-63aa2deb7d25"
    },
    {
      id: "letter-to-mother-earth",
      title: "Letter to Mother Earth",
      description: "A heartfelt reflection on our relationship with nature and the importance of sustainable practices in honoring and preserving our planet for future generations.",
      imageUrl: "/img/medium/letter-to-mother-earth.jpg",
      date: "May 2023",
      url: "https://medium.com/@bamboomade/letter-to-mother-earth-a5e6470a2594"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-green-100 to-background dark:from-green-900 dark:to-background">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12 text-center px-4 sm:px-0">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-green-900 dark:text-green-200 sm:text-4xl">
            From Our Journal
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-green-800 dark:text-green-300 max-w-2xl mx-auto">
            "Explore our thoughts, research, and insights on bamboo architecture and sustainable design practices."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 px-4 sm:px-0">
          {articles.map((article) => (
            <Card key={article.id} className="overflow-hidden h-full flex flex-col">
              <div className="aspect-video w-full overflow-hidden bg-black/5 flex items-center justify-center">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-3 sm:p-4 flex-grow">
                <div className="flex items-center text-xs sm:text-sm text-green-600 dark:text-green-400 mb-1 sm:mb-2">
                  <span>{article.date} • Medium Article</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-300 line-clamp-2">{article.title}</h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-green-600 dark:text-green-400 line-clamp-3">{article.description}</p>
              </CardContent>
              <CardFooter className="p-3 sm:p-4 pt-0">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
                    Read on Medium
                    <ExternalLink className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* YouTube Video Section */}
        <div className="mt-10 sm:mt-16">
          <h3 className="text-xl sm:text-2xl font-semibold text-green-900 dark:text-green-200 text-center mb-6">
            Featured Video
          </h3>
          <div className="aspect-video w-full max-w-4xl mx-auto overflow-hidden rounded-lg shadow-md">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/tPF35tjKAjY" 
              title="Bamboo Architecture Video"
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 text-center px-4 sm:px-0">
          <a href="https://medium.com/@bamboomade" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto inline-block">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm sm:text-base border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
              View All Articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default MediumArticles;