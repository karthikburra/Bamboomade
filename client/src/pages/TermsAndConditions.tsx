import React from "react";
import { Helmet } from "react-helmet";

const TermsAndConditions: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Terms and Conditions | BambooMade</title>
        <meta 
          name="description" 
          content="Terms and conditions for BambooMade website and services." 
        />
      </Helmet>

      <div className="bg-gradient-to-b from-green-950 to-background py-12 sm:py-16 md:py-20">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-300 mb-4">
              Terms and Conditions
            </h1>
            <p className="text-lg text-green-400">
              Last updated: May 2023
            </p>
          </div>

          <div className="bg-green-900/30 rounded-lg border border-green-800/50 shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8 md:p-10 text-green-200 space-y-6">
              <p className="text-base sm:text-lg">
                Welcome to BambooMade by BURRA VENKATA RANGA NANDA KARTHIK (accessible via www.bamboomade.in). 
                These Terms and Conditions ("Terms") govern your use of our website and services. 
                By accessing or using our services, you agree to comply with these Terms. 
                If you do not agree, please do not use our services.
              </p>

              <div className="space-y-6">
                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">1. Services</h2>
                  <p>
                    The details of each service, including deliverables, timelines, and fees, 
                    will be outlined in specific proposals or agreements made with clients.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">2. Eligibility</h2>
                  <p>
                    You must be at least 18 years old to use our website and services. 
                    By using our services, you warrant that you meet these eligibility requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">3. Service Agreements</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>A formal agreement or project proposal may be required before any work commences.</li>
                    <li>Each service engagement will have specific terms regarding deliverables, deadlines, payment schedules, and cancellation policies.</li>
                    <li>We reserve the right to decline or terminate services if necessary.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">4. Payments</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Service fees will be specified in the quotation or contract.</li>
                    <li>Payment terms are advance payment, milestone-based, or upon completion unless otherwise agreed.</li>
                    <li>Late payments may attract penalties as outlined in individual contracts.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">5. Intellectual Property</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Any materials, designs, reports, or content provided by BambooMade are protected by copyright and intellectual property laws.</li>
                    <li>Clients receive a non-transferable license to use the deliverables for their intended purpose but do not gain ownership unless explicitly agreed upon.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">6. Client Responsibilities</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Clients must provide accurate information and timely feedback to ensure project success.</li>
                    <li>Clients are responsible for any permits, legal clearances, or third-party approvals related to the project unless otherwise agreed.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">7. Confidentiality</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We respect the confidentiality of our clients' information and project details.</li>
                    <li>Both parties agree not to disclose confidential information to third parties without prior consent.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">8. Limitation of Liability</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>BambooMade shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</li>
                    <li>Our total liability for any claim arising out of or relating to our services shall not exceed the amount paid by the client for those services.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">9. Termination</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Either party may terminate a service engagement under the conditions outlined in the agreement.</li>
                    <li>In the event of termination, clients may be billed for work completed up to the termination date.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">10. Changes to Terms</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>BambooMade reserves the right to modify these Terms at any time without prior notice.</li>
                    <li>Continued use of our services after changes constitutes acceptance of the updated Terms.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">11. Governing Law</h2>
                  <p>
                    These Terms shall be governed by and interpreted in accordance with the laws of India.
                  </p>
                </section>
              </div>

              <div className="mt-8 border-t border-green-800 pt-6">
                <p className="text-green-400">
                  If you have any questions about these Terms and Conditions, please contact us at{" "}
                  <a href="mailto:info@bamboomade.in" className="text-green-300 underline hover:text-green-200">
                    info@bamboomade.in
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsAndConditions;