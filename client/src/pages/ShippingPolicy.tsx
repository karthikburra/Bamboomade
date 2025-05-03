import { Helmet } from "react-helmet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { InfoIcon } from "lucide-react";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-black dark:bg-black text-white">
      <Helmet>
        <title>Shipping Policy | BambooMade</title>
        <meta name="description" content="Information about BambooMade's shipping policy for digital services and consultation." />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-green-400 dark:text-green-400">Shipping Policy</h1>
        <p className="text-gray-400 dark:text-gray-400 mb-8">
          Last updated: May 3, 2025
        </p>
        
        <div className="bg-gray-900 dark:bg-gray-900 p-8 rounded-lg border border-green-800 dark:border-green-800 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-green-900/20 p-3 rounded-full">
              <InfoIcon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2 text-green-300 dark:text-green-300">
                Shipping Not Applicable
              </h2>
              <p className="text-gray-300 dark:text-gray-300">
                BambooMade is a service-based business focused on providing design consultations, project guidance, and educational workshops related to bamboo architecture and design.
              </p>
            </div>
          </div>
          
          <Separator className="my-6 bg-green-900/30" />
          
          <div className="space-y-6 text-gray-300 dark:text-gray-300">
            <p>
              As we operate exclusively as a service-based business offering:
            </p>
            
            <ul className="list-disc pl-5 space-y-2">
              <li>Online consultations and project guidance via Google Meet</li>
              <li>In-person workshops at architectural institutions and design schools</li>
              <li>Educational content and resources delivered digitally</li>
              <li>Design consultation services for bamboo-based architectural projects</li>
            </ul>
            
            <p className="mt-4">
              We do not sell or ship physical products, and therefore do not maintain a traditional shipping policy. All our services are either delivered digitally or conducted in person at prearranged locations.
            </p>
            
            <div className="bg-green-900/20 p-4 rounded-md mt-6">
              <h3 className="text-lg font-medium mb-2 text-green-300">Looking for Our Services?</h3>
              <p className="mb-4">
                If you're interested in our offerings, please visit our Project Guidance page to book a consultation or contact us directly for workshop inquiries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/project-guidance">Book a Consultation</Link>
                </Button>
                <Button asChild variant="outline" className="border-green-700 text-green-400 hover:bg-green-900/30">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-400 dark:text-gray-400">
          <p>
            If you have any questions about our services or how we operate, please don't hesitate to reach out to us at <a href="mailto:projects@bamboomade.in" className="text-green-400 hover:text-green-300">projects@bamboomade.in</a> or via WhatsApp at <a href="tel:+918971690163" className="text-green-400 hover:text-green-300">+91 8971690163</a>.
          </p>
          <p className="mt-4">
            You may also want to review our <Link href="/pricing-and-refund-policy" className="text-green-400 hover:text-green-300 underline">Pricing & Refund Policy</Link> for information about our service fees and cancellation terms.
          </p>
        </div>
      </div>
    </div>
  );
}