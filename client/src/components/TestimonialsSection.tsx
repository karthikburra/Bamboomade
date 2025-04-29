import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Dr. Amrita Patel",
    role: "Architecture Professor, NIT",
    content: "BambooMade has transformed how our students think about sustainable materials. Their workshops are impeccably organized and provide invaluable hands-on experience with bamboo construction techniques.",
    rating: 5,
  },
  {
    id: 2,
    name: "Raj Sharma",
    role: "Eco-Resort Owner",
    content: "Our bamboo bungalows designed by BambooMade have become the signature attraction of our resort. Not only are they beautiful, but they've also proven remarkably durable even in our coastal climate.",
    rating: 5,
  },
  {
    id: 3,
    name: "Meera Krishnan",
    role: "Architecture Student",
    content: "The counseling session I had with BambooMade's experts completely changed my thesis direction. Their knowledge about bamboo applications in modern design is unparalleled.",
    rating: 5,
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What Our Clients Say
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We've worked with institutions, businesses, and students across India to bring sustainable bamboo architecture to life.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="overflow-hidden border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex text-yellow-400 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < testimonial.rating ? "fill-current" : "opacity-30"}
                    />
                  ))}
                </div>
                <p className="text-foreground italic mb-6">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
