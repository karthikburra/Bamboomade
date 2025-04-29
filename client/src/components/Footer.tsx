import React from "react";
import { Link } from "wouter";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn("bg-primary-950 text-primary-50", className)}>
      <div className="container max-w-screen-xl py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-4 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div>
              <span className="text-2xl font-bold text-primary-50">
                Bamboo<span className="text-secondary-400">Made</span>
              </span>
              <p className="mt-2 text-sm text-primary-200">
                Innovating sustainable architecture with bamboo since 2010
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-primary-200 hover:text-primary-50">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-primary-200 hover:text-primary-50">
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-primary-200 hover:text-primary-50">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-primary-200 hover:text-primary-50">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-3 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-100">
                  Services
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/gallery?category=architecture" className="text-base text-primary-300 hover:text-primary-50">
                      Architecture Projects
                    </Link>
                  </li>
                  <li>
                    <Link href="/gallery?category=workshop" className="text-base text-primary-300 hover:text-primary-50">
                      Workshops
                    </Link>
                  </li>
                  <li>
                    <Link href="/project-guidance" className="text-base text-primary-300 hover:text-primary-50">
                      Project Guidance
                    </Link>
                  </li>
                  <li>
                    <Link href="/ai-chat" className="text-base text-primary-300 hover:text-primary-50">
                      BambooMade AI
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-100">
                  Resources
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-primary-300 hover:text-primary-50">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-primary-300 hover:text-primary-50">
                      Research Papers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-primary-300 hover:text-primary-50">
                      Design Guidelines
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-primary-300 hover:text-primary-50">
                      Sustainability Reports
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-100">
                Contact Us
              </h3>
              <ul className="mt-4 space-y-4">
                <li className="flex">
                  <MapPin size={20} className="flex-shrink-0 text-primary-200" />
                  <span className="ml-3 text-base text-primary-300">
                    123 Bamboo Avenue, Green District, 400001
                  </span>
                </li>
                <li className="flex">
                  <Phone size={20} className="flex-shrink-0 text-primary-200" />
                  <span className="ml-3 text-base text-primary-300">
                    +91 8971690163
                  </span>
                </li>
                <li className="flex">
                  <Mail size={20} className="flex-shrink-0 text-primary-200" />
                  <span className="ml-3 text-base text-primary-300">
                    info@bamboomade.com
                  </span>
                </li>
                <li className="mt-8">
                  <a 
                    href="https://wa.me/918971690163" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md bg-secondary-600 py-2 px-4 text-base font-medium text-white hover:bg-secondary-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" className="mr-2">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-primary-800 pt-8">
          <p className="text-base text-primary-400 text-center">
            &copy; {new Date().getFullYear()} BambooMade. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
