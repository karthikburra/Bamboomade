import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail } from "lucide-react";
import { Helmet } from "react-helmet";
import WhatsAppContact from "@/components/WhatsAppContact";

const Contact: React.FC = () => {

  return (
    <>
      <Helmet>
        <title>Contact Us | BambooMade</title>
        <meta name="description" content="Get in touch with BambooMade for inquiries about bamboo architecture projects, workshops, and student project guidance." />
      </Helmet>
      
      <div className="bg-background py-12">
        <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Contact Us
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about bamboo architecture or interested in our services? 
              Reach out to us and we'll be happy to help.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 mx-auto max-w-xl">
            <div className="space-y-8">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-primary-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-muted-foreground">
                          123 Bamboo Avenue, Green District, 400001
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-primary-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-muted-foreground">+91 8971690163</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-primary-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-muted-foreground">info@bamboomade.com</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">WhatsApp Support</h2>
                  <p className="text-muted-foreground mb-4">
                    For quick inquiries, especially from institutions interested in our workshops or architecture services, connect with us on WhatsApp.
                  </p>
                  {/* WhatsApp contact button for direct chat */}
                  <WhatsAppContact 
                    phoneNumber="+918971690163"
                    message="Hello, I'm interested in BambooMade services. I'd like to inquire about your bamboo workshops and architectural solutions."
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
