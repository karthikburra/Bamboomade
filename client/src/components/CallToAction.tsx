import React from "react";
import ScrollLink from "@/components/ScrollLink";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, MessageSquare } from "lucide-react";

const CallToAction: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-black to-green-950">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-green-300 mb-4">
          Ready to Collaborate on Your Next Bamboo Project?
        </h2>
        <p className="text-xl text-green-400 max-w-2xl mx-auto mb-8">
          Whether you're an architecture student, a professor, or representing an institution,
          we're here to help you bring your sustainable bamboo vision to life.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <ScrollLink href="/contact" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-green-700 hover:bg-green-600 text-white"
            >
              <Phone className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
          </ScrollLink>
          
          <ScrollLink href="/project-guidance" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white"
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Book Project Guidance</span>
              <span className="inline sm:hidden">Project Guidance</span>
            </Button>
          </ScrollLink>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;