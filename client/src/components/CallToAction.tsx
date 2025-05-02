import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, MessageSquare } from "lucide-react";

const CallToAction: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-black to-green-950/60 text-green-50">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight sm:text-4xl px-2">
            Ready to collaborate on your next bamboo project?
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg max-w-2xl mx-auto px-2">
            Whether you're an architecture student, a professor, or representing an institution,
            we're here to help you bring your sustainable bamboo vision to life.
          </p>
          
          <div className="mt-6 sm:mt-10 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3 px-2 sm:px-0">
            <Link href="/contact" className="w-full">
              <Button
                size="lg"
                className="w-full text-sm sm:text-base py-5 sm:py-6 bg-green-800 text-white hover:bg-green-700"
              >
                <Phone className="mr-2 h-4 w-4" />
                Contact Us
              </Button>
            </Link>
            
            <Link href="/project-guidance" className="w-full">
              <Button
                size="lg"
                className="w-full text-sm sm:text-base py-5 sm:py-6 bg-green-600 hover:bg-green-500 text-white"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Book Project Guidance</span>
                <span className="inline sm:hidden">Project Guidance</span>
              </Button>
            </Link>
            
            <Link href="/ai-chat" className="w-full">
              <Button
                size="lg"
                className="w-full text-sm sm:text-base py-5 sm:py-6 bg-green-500 hover:bg-green-400 text-white"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Try BambooMade AI
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
