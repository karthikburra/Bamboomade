import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { Helmet } from "react-helmet";
import WhatsAppContact from "@/components/WhatsAppContact";

const Contact: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "We'll get back to you as soon as possible!",
      });
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | BambooMade</title>
        <meta name="description" content="Get in touch with BambooMade for inquiries about bamboo architecture projects, workshops, and student counseling." />
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
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Subject of your message"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
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
                        <p className="text-muted-foreground">+91 9876543210</p>
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
                    phoneNumber="+919876543210"
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
