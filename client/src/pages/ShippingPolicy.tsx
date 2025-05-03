import { Helmet } from "react-helmet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { InfoIcon, TruckIcon, MailIcon, PhoneIcon } from "lucide-react";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-black dark:bg-black text-white">
      <Helmet>
        <title>Shipping & Delivery Policy | BambooMade</title>
        <meta name="description" content="Information about BambooMade's shipping and delivery policy for services and consultation." />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-green-400 dark:text-green-400">Shipping & Delivery Policy</h1>
        <p className="text-gray-400 dark:text-gray-400 mb-8">
          Last updated on May 3, 2025
        </p>
        
        <div className="bg-gray-900 dark:bg-gray-900 p-8 rounded-lg border border-green-800 dark:border-green-800 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-green-900/20 p-3 rounded-full">
              <TruckIcon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2 text-green-300 dark:text-green-300">
                Official Shipping & Delivery Policy
              </h2>
            </div>
          </div>
          
          <Separator className="my-6 bg-green-900/30" />
          
          <div className="space-y-6 text-gray-300 dark:text-gray-300">
            <p>
              For International buyers, orders are shipped and delivered through registered international courier companies and/or International speed post only. For domestic buyers, orders are shipped through registered domestic courier companies and/or speed post only. Orders are shipped within <span className="font-semibold">Not Applicable</span> or as per the delivery date agreed at the time of order confirmation and delivering of the shipment subject to Courier Company / post office norms.
            </p>
            
            <p>
              VENKATA RANGA NANDA KARTHIK BURRA is not liable for any delay in delivery by the courier company / postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within <span className="font-semibold">Not Applicable</span> from the date of the order and payment or as per the delivery date agreed at the time of order confirmation.
            </p>
            
            <p>
              Delivery of all orders will be to the address provided by the buyer. Delivery of our services will be confirmed on your mail ID as specified during registration.
            </p>
            
            <div className="bg-green-900/20 p-5 rounded-md mt-8">
              <h3 className="text-lg font-medium mb-3 text-green-300">Service Delivery Information</h3>
              <p className="mb-4">
                BambooMade is primarily a service-based business focused on providing design consultations, project guidance, and educational workshops related to bamboo architecture and design.
              </p>
              
              <p className="mb-4">
                Our services are delivered either:
              </p>
              
              <ul className="list-disc pl-5 space-y-2 mb-5">
                <li>Online through consultation sessions via Google Meet</li>
                <li>In-person at workshops and architectural institutions</li>
                <li>Through digital resources and educational content</li>
              </ul>
              
              <div className="flex flex-col gap-3 mt-5">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <p>For any issues in utilizing our services, you may contact our helpdesk on <a href="tel:+918971690163" className="text-green-400 hover:text-green-300 underline">8971690163</a></p>
                </div>
                <div className="flex items-center gap-2">
                  <MailIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <p>Or email us at <a href="mailto:info@bamboomade.in" className="text-green-400 hover:text-green-300 underline">info@bamboomade.in</a></p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
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
            For additional information about our services, please review our <Link href="/pricing-and-refund-policy" className="text-green-400 hover:text-green-300 underline">Pricing & Refund Policy</Link> or <Link href="/terms-and-conditions" className="text-green-400 hover:text-green-300 underline">Terms & Conditions</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}