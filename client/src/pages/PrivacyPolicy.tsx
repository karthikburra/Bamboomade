import React from "react";
import { Helmet } from "react-helmet";

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | BambooMade</title>
        <meta 
          name="description" 
          content="Privacy policy for BambooMade website and services." 
        />
      </Helmet>

      <div className="bg-gradient-to-b from-green-950 to-background py-12 sm:py-16 md:py-20">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-300 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-green-400">
              Last updated: May 2023
            </p>
          </div>

          <div className="bg-green-900/30 rounded-lg border border-green-800/50 shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8 md:p-10 text-green-200 space-y-6">
              <p className="text-base sm:text-lg">
                BambooMade ("we," "our," "us") respects your privacy and is committed to protecting your personal information. 
                This Privacy Policy explains how we collect, use, and safeguard your information when you visit www.bamboomade.in and use our services.
                By accessing our website or engaging with us, you consent to the practices described in this Privacy Policy.
              </p>

              <div className="space-y-6">
                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">1. Information We Collect</h2>
                  <p className="mb-3">We may collect the following types of information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong className="text-green-300">Personal Information:</strong> Name, email address, phone number, company name, and other contact details you voluntarily provide when you contact us, fill out a form, or sign up for our services.
                    </li>
                    <li>
                      <strong className="text-green-300">Technical Information:</strong> IP address, browser type, operating system, referring URLs, and other technical data collected automatically through cookies and analytics tools.
                    </li>
                    <li>
                      <strong className="text-green-300">Usage Data:</strong> Information about how you use our website, including pages visited, time spent, and other browsing behavior.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">2. How We Use Your Information</h2>
                  <p className="mb-3">We use your information to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Respond to your inquiries and provide our services.</li>
                    <li>Communicate with you about your project, updates, and other administrative matters.</li>
                    <li>Improve our website, services, and customer experience.</li>
                    <li>Comply with legal obligations and enforce our agreements.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">3. Sharing Your Information</h2>
                  <p className="mb-3">
                    We do not sell, trade, or rent your personal information to third parties. We may share your information 
                    with trusted third-party service providers who assist us in operating our website or conducting our business, 
                    under strict confidentiality agreements.
                  </p>
                  <p>
                    We may also disclose your information if required by law or to protect our legal rights.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">4. Cookies and Tracking Technologies</h2>
                  <p className="mb-3">
                    Our website may use cookies and similar technologies to enhance your browsing experience. 
                    Cookies help us understand how users interact with our website so we can improve it.
                  </p>
                  <p>
                    You can choose to disable cookies through your browser settings, but some features of our website may not function properly.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">5. Data Security</h2>
                  <p className="mb-3">
                    We implement appropriate technical and organizational measures to protect your personal information 
                    from unauthorized access, loss, misuse, or alteration.
                  </p>
                  <p>
                    However, no method of transmission over the Internet is completely secure, and we cannot guarantee absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">6. Your Rights</h2>
                  <p className="mb-3">Depending on your jurisdiction, you may have rights to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access, update, or delete your personal information.</li>
                    <li>Object to or restrict certain processing activities.</li>
                    <li>Withdraw consent where processing is based on consent.</li>
                  </ul>
                  <p className="mt-3">
                    To exercise your rights, please contact us at the details below.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">7. Third-Party Links</h2>
                  <p>
                    Our website may contain links to external websites. We are not responsible for the privacy practices 
                    or content of those third-party sites. We encourage you to review their privacy policies separately.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-bold text-green-300 mb-3">8. Changes to This Privacy Policy</h2>
                  <p>
                    We reserve the right to update or modify this Privacy Policy at any time. Changes will be posted on this page 
                    with a new effective date. Continued use of the website after any changes constitutes acceptance of the updated policy.
                  </p>
                </section>
              </div>

              <div className="mt-8 border-t border-green-800 pt-6">
                <p className="text-green-400">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
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

export default PrivacyPolicy;