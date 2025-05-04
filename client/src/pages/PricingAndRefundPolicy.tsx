import { Helmet } from "react-helmet";
import { Separator } from "@/components/ui/separator";

export default function PricingAndRefundPolicy() {
  return (
    <div className="min-h-screen bg-black dark:bg-black text-white">
      <Helmet>
        <title>Pricing & Refund Policy | BambooMade</title>
        <meta name="description" content="Pricing and refund policy for BambooMade services including project guidance, workshops, and consultations." />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-green-400 dark:text-green-400">Pricing & Refund Policy</h1>
        <p className="text-gray-400 dark:text-gray-400 mb-8">
          Last updated: May 3, 2025
        </p>
        
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-green-400 dark:text-green-400">Project Guidance Services</h2>
          <Separator className="mb-6 bg-green-900 dark:bg-green-900" />
          
          <h3 className="text-xl font-medium mb-3 text-green-300 dark:text-green-300">Pricing Structure</h3>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 dark:bg-gray-900 p-6 rounded-lg border border-green-800 dark:border-green-800">
              <h4 className="text-lg font-medium mb-2 text-green-300 dark:text-green-300">Student Rates</h4>
              <p className="text-3xl font-bold mb-4 text-white dark:text-white">₹800 <span className="text-lg font-normal text-gray-400 dark:text-gray-400">per hour</span></p>
              <ul className="space-y-2 text-gray-300 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>One-on-one guidance via Google Meet</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>Materials recommendation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>Design feedback and suggestions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>Access to session recording</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>Valid student ID required</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-900 dark:bg-gray-900 p-6 rounded-lg border border-green-800 dark:border-green-800">
              <h4 className="text-lg font-medium mb-2 text-green-300 dark:text-green-300">Professional Rates</h4>
              <p className="text-3xl font-bold mb-4 text-white dark:text-white">₹1,500 <span className="text-lg font-normal text-gray-400 dark:text-gray-400">per hour</span></p>
              <ul className="space-y-2 text-gray-300 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>One-on-one guidance via Google Meet</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>Detailed technical consultation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>Materials & supplier recommendations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>Access to session recording</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-500 mr-2">✓</span>
                  <span>Additional follow-up support via email</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mb-10">
            <h3 className="text-xl font-medium mb-3 text-green-300 dark:text-green-300">Session Duration Options</h3>
            <p className="mb-4 text-gray-300 dark:text-gray-300">
              We offer flexible session durations to accommodate different project needs:
            </p>
            <h4 className="text-lg font-medium mb-3 text-green-300 dark:text-green-300">Student Pricing</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900 dark:bg-gray-900 p-4 rounded-lg border border-green-800 dark:border-green-800 text-center">
                <p className="font-medium text-green-400 dark:text-green-400 mb-1">30 minutes</p>
                <p className="text-xl font-bold mb-1">₹500</p>
                <p className="text-sm text-gray-400 dark:text-gray-400">Quick consultation</p>
              </div>
              <div className="bg-gray-900 dark:bg-gray-900 p-4 rounded-lg border border-green-800 dark:border-green-800 text-center">
                <p className="font-medium text-green-400 dark:text-green-400 mb-1">60 minutes</p>
                <p className="text-xl font-bold mb-1">₹800</p>
                <p className="text-sm text-gray-400 dark:text-gray-400">Standard session</p>
              </div>
              <div className="bg-gray-900 dark:bg-gray-900 p-4 rounded-lg border border-green-800 dark:border-green-800 text-center">
                <p className="font-medium text-green-400 dark:text-green-400 mb-1">90 minutes</p>
                <p className="text-xl font-bold mb-1">₹1,200</p>
                <p className="text-sm text-gray-400 dark:text-gray-400">Extended guidance</p>
              </div>
            </div>

            <h4 className="text-lg font-medium mb-3 text-green-300 dark:text-green-300">Professional Pricing</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900 dark:bg-gray-900 p-4 rounded-lg border border-green-800 dark:border-green-800 text-center">
                <p className="font-medium text-green-400 dark:text-green-400 mb-1">30 minutes</p>
                <p className="text-xl font-bold mb-1">₹1,000</p>
                <p className="text-sm text-gray-400 dark:text-gray-400">Quick consultation</p>
              </div>
              <div className="bg-gray-900 dark:bg-gray-900 p-4 rounded-lg border border-green-800 dark:border-green-800 text-center">
                <p className="font-medium text-green-400 dark:text-green-400 mb-1">60 minutes</p>
                <p className="text-xl font-bold mb-1">₹1,500</p>
                <p className="text-sm text-gray-400 dark:text-gray-400">Standard session</p>
              </div>
              <div className="bg-gray-900 dark:bg-gray-900 p-4 rounded-lg border border-green-800 dark:border-green-800 text-center">
                <p className="font-medium text-green-400 dark:text-green-400 mb-1">90 minutes</p>
                <p className="text-xl font-bold mb-1">₹2,250</p>
                <p className="text-sm text-gray-400 dark:text-gray-400">Extended guidance</p>
              </div>
            </div>
            <p className="text-gray-300 dark:text-gray-300">
              Pricing is calculated proportionally based on your selected duration and rate category.
            </p>
          </div>
          
          <div className="mb-10">
            <h3 className="text-xl font-medium mb-3 text-green-300 dark:text-green-300">Payment Process</h3>
            <p className="mb-4 text-gray-300 dark:text-gray-300">
              Payment is required in full at the time of booking to confirm your session.
              We accept payments through PhonePe, offering a secure and convenient payment experience.
            </p>
            <div className="bg-gray-900 dark:bg-gray-900 p-5 rounded-lg border border-green-800 dark:border-green-800 mb-4">
              <h4 className="font-medium text-green-300 dark:text-green-300 mb-2">Payment Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 dark:text-gray-300 pl-2">
                <li>Schedule your preferred date and time for the guidance session</li>
                <li>Complete the booking form with your project details</li>
                <li>Make payment via our secure PhonePe integration</li>
                <li>Receive confirmation email with Google Meet link and session details</li>
              </ol>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-400">
              * GST and applicable taxes are included in the displayed prices.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-green-400 dark:text-green-400">Refund Policy</h2>
          <Separator className="mb-6 bg-green-900 dark:bg-green-900" />
          
          <p className="mb-6 text-gray-300 dark:text-gray-300">
            We understand that plans change. Our refund policy aims to be fair while allowing us to maintain our scheduling commitments.
          </p>

          <div className="bg-gray-900 dark:bg-gray-900 p-6 rounded-lg border border-green-800 dark:border-green-800 mb-8">
            <h3 className="text-xl font-medium mb-3 text-green-300 dark:text-green-300">Cancellation Terms</h3>
            
            <div className="space-y-4">
              <div className="border-b border-gray-800 dark:border-gray-800 pb-4">
                <h4 className="font-medium text-green-400 dark:text-green-400 mb-2">
                  More than 48 hours before session
                </h4>
                <p className="text-gray-300 dark:text-gray-300">
                  Full refund of your payment minus a 5% processing fee.
                </p>
              </div>
              
              <div className="border-b border-gray-800 dark:border-gray-800 pb-4">
                <h4 className="font-medium text-green-400 dark:text-green-400 mb-2">
                  24-48 hours before session
                </h4>
                <p className="text-gray-300 dark:text-gray-300">
                  75% refund of your payment.
                </p>
              </div>
              
              <div className="border-b border-gray-800 dark:border-gray-800 pb-4">
                <h4 className="font-medium text-green-400 dark:text-green-400 mb-2">
                  Less than 24 hours before session
                </h4>
                <p className="text-gray-300 dark:text-gray-300">
                  50% refund of your payment.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-green-400 dark:text-green-400 mb-2">
                  Missed sessions
                </h4>
                <p className="text-gray-300 dark:text-gray-300">
                  No refund for no-shows or missed sessions without prior notice.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-3 text-green-300 dark:text-green-300">Rescheduling Option</h3>
            <p className="mb-4 text-gray-300 dark:text-gray-300">
              As an alternative to cancellation, we offer one free rescheduling option per booking if requested at least 24 hours before the scheduled session time. Subsequent reschedules or changes with less than 24 hours' notice will incur a ₹500 administrative fee.
            </p>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-3 text-green-300 dark:text-green-300">How to Request a Refund</h3>
            <p className="mb-4 text-gray-300 dark:text-gray-300">
              To request a refund or reschedule a session, please contact us at:
            </p>
            <div className="bg-gray-900 dark:bg-gray-900 p-5 rounded-lg border border-green-800 dark:border-green-800">
              <p className="text-gray-300 dark:text-gray-300 mb-2">
                <span className="font-medium text-green-400 dark:text-green-400">Email:</span> projects@bamboomade.in
              </p>
              <p className="text-gray-300 dark:text-gray-300">
                <span className="font-medium text-green-400 dark:text-green-400">WhatsApp:</span> +91 8971690163
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-3 text-green-300 dark:text-green-300">Technical Issues</h3>
            <p className="text-gray-300 dark:text-gray-300">
              If technical issues on our end prevent the session from taking place or significantly impact the quality of guidance, we will offer a full refund or a complimentary rescheduled session, based on your preference.
            </p>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-green-400 dark:text-green-400">Additional Terms</h2>
          <Separator className="mb-6 bg-green-900 dark:bg-green-900" />
          
          <div className="space-y-6 text-gray-300 dark:text-gray-300">
            <p>
              We reserve the right to modify pricing for future bookings at any time. Already confirmed and paid bookings will always be honored at the original payment amount.
            </p>
            
            <p>
              BambooMade is committed to providing professional guidance and consultation but cannot guarantee specific outcomes for projects. Our services are advisory in nature.
            </p>
            
            <p>
              For workshops, group sessions, and special events, specific pricing and refund policies will be communicated at the time of registration.
            </p>
            
            <p>
              For inquiries about bulk bookings or institutional rates, please contact us directly at projects@bamboomade.in.
            </p>
            
            <p className="text-sm text-gray-400 dark:text-gray-400 mt-8">
              This pricing and refund policy is part of our overall terms and conditions. By making a booking, you agree to these terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}