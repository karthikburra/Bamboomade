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
      imageUrl: "/img/projects/bamboo-lamp-new.png",
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
    <section className="py-16 bg-gradient-to-b from-green-50/30 to-background dark:from-green-950/30 dark:to-background">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-green-800 dark:text-green-300 sm:text-4xl">
            From Our Journal
          </h2>
          <p className="mt-4 text-lg text-green-700 dark:text-green-400 max-w-2xl mx-auto">
            "Explore our thoughts, research, and insights on bamboo architecture and sustainable design practices."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Card key={article.id} className="overflow-hidden h-full flex flex-col">
              <div className="aspect-video w-full overflow-hidden bg-black/5 flex items-center justify-center">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardContent className="p-4 flex-grow">
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 mb-2">
                  <span>{article.date} • Medium Article</span>
                </div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 line-clamp-2">{article.title}</h3>
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 line-clamp-3">{article.description}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" size="sm" className="w-full border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
                    Read on Medium
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="https://medium.com/@bamboomade" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30">
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