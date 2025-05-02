import React from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Building2,
  Calendar,
  Construction,
  Filter,
  Users,
  Workflow
} from "lucide-react";
import { 
  Card, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import WhatsAppContact from "@/components/WhatsAppContact";
import { Project } from "@shared/schema";

const OurWorks: React.FC = () => {
  // Set filter to "all" by default, since we're not showing filter buttons anymore
  const filter = "all";
  
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Display all projects since we're not filtering anymore
  const filteredProjects = projects;

  return (
    <>
      <Helmet>
        <title>Our Works | BambooMade</title>
      </Helmet>

      <section className="py-16 bg-gradient-to-b from-green-950/40 to-background">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-green-300 sm:text-4xl">
              Our Experience
            </h2>
            <p className="mt-4 text-lg text-green-400 max-w-2xl mx-auto">
              "Through our successfully conducted workshops, we have ignited creativity, empowered participants, and built a strong foundation for Bamboo centric design."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Workshop cards will be fetched from API in the future */}
            <Card className="overflow-hidden h-full flex flex-col">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src="/attached_assets/IMG-20230920-WA0054 2.png"
                  alt="Bamboo Joinery Workshop"
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardContent className="p-4 flex-grow">
                <div className="flex items-center text-sm text-green-400 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>2 days | September 2023</span>
                </div>
                <h3 className="text-lg font-semibold text-green-300 line-clamp-2">Bamboo Joinery Workshop</h3>
                <p className="mt-2 text-sm text-green-400 line-clamp-3">Hands-on workshop teaching traditional and modern bamboo joinery techniques for architectural applications.</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full border-green-700 text-green-400 hover:bg-green-950/30">
                  View Details
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="overflow-hidden h-full flex flex-col">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src="/attached_assets/IMG-20230920-WA0061 2.png"
                  alt="Sustainable Design Studio"
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardContent className="p-4 flex-grow">
                <div className="flex items-center text-sm text-green-400 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>5 days | August 2023</span>
                </div>
                <h3 className="text-lg font-semibold text-green-300 line-clamp-2">Sustainable Design Studio</h3>
                <p className="mt-2 text-sm text-green-400 line-clamp-3">Immersive design studio focusing on sustainable architectural principles using bamboo as a primary material.</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden h-full flex flex-col">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src="/attached_assets/IMG_20240128_163057719 1.png"
                  alt="Campus Bamboo Workshop"
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardContent className="p-4 flex-grow">
                <div className="flex items-center text-sm text-green-400 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>3 days | January 2024</span>
                </div>
                <h3 className="text-lg font-semibold text-green-300 line-clamp-2">Campus Bamboo Workshop</h3>
                <p className="mt-2 text-sm text-green-400 line-clamp-3">Collaborative workshop with architecture students creating bamboo installations on university campus.</p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden h-full flex flex-col">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src="/attached_assets/IMG-3071 1 (1).png"
                  alt="Bamboo Furniture Design"
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardContent className="p-4 flex-grow">
                <div className="flex items-center text-sm text-green-400 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>4 days | December 2023</span>
                </div>
                <h3 className="text-lg font-semibold text-green-300 line-clamp-2">Bamboo Furniture Design</h3>
                <p className="mt-2 text-sm text-green-400 line-clamp-3">Workshop focused on designing and crafting functional bamboo furniture with sustainable techniques.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-background">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-green-300 mb-4">
              Our Bamboo Works
            </h1>
            <p className="text-xl text-green-400 max-w-2xl mx-auto">
              Explore our portfolio of architectural designs, workshops, and bamboo craftwork that showcase innovation and sustainability.
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden border-green-900/30 bg-green-950/20 hover:bg-green-950/30 transition-colors">
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105 duration-500"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-green-300 mb-2">{project.title}</h3>
                    <p className="text-green-400 mb-4">{project.description}</p>
                    <span className="inline-flex items-center rounded-full bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-300">
                      {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {projects.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium text-green-300 mb-4">No projects found</h3>
              <p className="text-green-400 mb-6">Check back later for our upcoming projects</p>
            </div>
          )}
        </div>
      </section>
      
      <section className="py-16 bg-gradient-to-b from-background to-green-950/30">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-green-300 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-green-400 max-w-2xl mx-auto">
              We offer a range of professional services to help you incorporate bamboo into your architectural and design projects.
            </p>
          </div>
          
          <Tabs defaultValue="consultations" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto bg-green-950/40">
              <TabsTrigger value="consultations" className="py-3 data-[state=active]:bg-green-800 data-[state=active]:text-white">
                Consultations
              </TabsTrigger>
              <TabsTrigger value="workshops" className="py-3 data-[state=active]:bg-green-800 data-[state=active]:text-white">
                Workshops
              </TabsTrigger>
              <TabsTrigger value="projects" className="py-3 data-[state=active]:bg-green-800 data-[state=active]:text-white">
                Project Guidance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="consultations" className="pt-8 pb-4">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-green-300 mb-3">Expert Bamboo Consultations</h3>
                  <p className="text-green-400 mb-6">
                    Get professional advice from our bamboo experts on material selection, design considerations, and implementation strategies for your project.
                  </p>
                  <ul className="space-y-2 text-green-400 mb-6">
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Material assessment and selection guidance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Design concept evaluations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Structural feasibility analysis</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Sustainability and environmental impact assessment</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-green-950/40 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-green-300 mb-4">Contact Us for a Consultation</h4>
                  <p className="text-green-400 mb-6">
                    Reach out to discuss your project needs and schedule a consultation with our bamboo experts.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <WhatsAppContact 
                      phoneNumber="8971690163" 
                      message="Hello, I'm interested in a bamboo consultation for my project. Can you provide more information?"
                      variant="default"
                      className="bg-green-700 hover:bg-green-600 text-white w-full sm:w-auto"
                    />
                    <Button 
                      variant="outline"
                      className="border-green-700 text-green-400 hover:bg-green-950/30 w-full sm:w-auto"
                    >
                      Email Us
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="workshops" className="pt-8 pb-4">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-green-300 mb-3">Bamboo Design Workshops</h3>
                  <p className="text-green-400 mb-6">
                    Participate in our hands-on workshops to learn bamboo crafting, joinery techniques, and construction methods from experienced artisans.
                  </p>
                  <ul className="space-y-2 text-green-400 mb-6">
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Bamboo joinery and treatment workshops</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Furniture design and crafting</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Architectural model making</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Community and group training programs</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-green-950/40 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-green-300 mb-4">Schedule a Workshop</h4>
                  <p className="text-green-400 mb-6">
                    Our workshops can be customized for individuals, groups, or institutions. Contact us to schedule or inquire about upcoming workshops.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <WhatsAppContact 
                      phoneNumber="8971690163" 
                      message="Hello, I'm interested in attending/scheduling a bamboo workshop. Can you provide more details?"
                      variant="default"
                      className="bg-green-700 hover:bg-green-600 text-white w-full sm:w-auto"
                    />
                    <Button 
                      variant="outline"
                      className="border-green-700 text-green-400 hover:bg-green-950/30 w-full sm:w-auto"
                    >
                      View Calendar
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="projects" className="pt-8 pb-4">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-green-300 mb-3">Student Project Guidance</h3>
                  <p className="text-green-400 mb-6">
                    Get personalized guidance for your academic or personal bamboo projects from our experienced designers and architects.
                  </p>
                  <ul className="space-y-2 text-green-400 mb-6">
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>One-on-one mentorship sessions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Design review and feedback</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Technical problem-solving assistance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-300 mr-2">•</span>
                      <span>Material and technique recommendations</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-green-950/40 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-green-300 mb-4">Book a Guidance Session</h4>
                  <p className="text-green-400 mb-6">
                    Schedule a session with our experts to get specialized guidance for your bamboo project needs.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      variant="default"
                      onClick={() => window.location.href = "/project-guidance"}
                      className="bg-green-700 hover:bg-green-600 text-white w-full sm:w-auto"
                    >
                      Book a Session
                    </Button>
                    <WhatsAppContact 
                      phoneNumber="8971690163" 
                      message="Hello, I'm interested in project guidance for my bamboo project. Can we discuss the details?"
                      variant="outline"
                      className="border-green-700 text-green-400 hover:bg-green-950/30 w-full sm:w-auto"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      <Separator className="bg-green-900/30" />
      
      <section className="py-16">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-green-300 mb-4">
            Ready to Collaborate?
          </h2>
          <p className="text-xl text-green-400 max-w-2xl mx-auto mb-8">
            Let's bring your bamboo vision to life. Contact us to discuss your project needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <WhatsAppContact 
              phoneNumber="8971690163" 
              message="Hello, I'd like to discuss a potential bamboo project collaboration."
              variant="default"
              size="lg"
              className="bg-green-700 hover:bg-green-600 text-white"
            />
            <Button 
              variant="outline"
              size="lg"
              onClick={() => window.location.href = "/contact"}
              className="border-green-700 text-green-400 hover:bg-green-950/30"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default OurWorks;