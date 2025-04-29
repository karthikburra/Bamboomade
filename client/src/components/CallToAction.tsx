import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, MessageSquare } from "lucide-react";

const CallToAction: React.FC = () => {
  return (
    <section className="py-16 bg-primary-900 text-primary-50">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to collaborate on your next bamboo project?
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto">
            Whether you're an architecture student, a professor, or representing an institution,
            we're here to help you bring your sustainable bamboo vision to life.
          </p>
          
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/contact">
              <Button
                size="lg"
                className="w-full bg-white text-primary-900 hover:bg-primary-50"
              >
                <Phone className="mr-2 h-4 w-4" />
                Contact Us
              </Button>
            </Link>
            
            <Link href="/project-guidance">
              <Button
                size="lg"
                className="w-full bg-secondary-600 hover:bg-secondary-700 text-white"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Project Guidance
              </Button>
            </Link>
            
            <Link href="/ai-chat">
              <Button
                size="lg"
                className="w-full bg-primary-800 hover:bg-primary-700 text-white"
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
