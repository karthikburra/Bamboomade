import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedLeaves from "@/components/AnimatedLeaves";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "@/pages/Home";
import Gallery from "@/pages/Gallery";
import Contact from "@/pages/Contact";
import ProjectGuidance from "@/pages/ProjectGuidance";
import AIChat from "@/pages/AIChat";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import DevAdminLogin from "@/pages/DevAdminLogin";
import AdminHome from "@/pages/AdminHome";
import AdminDashboard from "@/pages/AdminDashboard";
import AIKnowledgeManagement from "@/pages/AIKnowledgeManagement";
import AIKnowledgeDatabase from "@/pages/AIKnowledgeDatabase";
import AddWhatsAppBot from "@/pages/AddWhatsAppBot";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentFailed from "@/pages/PaymentFailed";
import OurWorks from "@/pages/OurWorks";
import AllSessions from "@/pages/AllSessions";
import NotFound from "@/pages/not-found";
// Workshop detail pages
import BondWithBambooWorkshop from "@/pages/BondWithBambooWorkshop";
import InternationalBambooFestWorkshop from "@/pages/InternationalBambooFestWorkshop";
import ManitBhopalWorkshop from "@/pages/ManitBhopalWorkshop";
import NITBhopalWorkshop from "@/pages/NITBhopalWorkshop";
import BambooLightingWorkshop from "@/pages/BambooLightingWorkshop";
import IcfaiWorkshop from "@/pages/IcfaiWorkshop";
import SirpurWorkshop from "@/pages/SirpurWorkshop";
import SPADelhiWorkshop from "@/pages/SPADelhiWorkshop";
import WoxsenUniversityWorkshop from "@/pages/WoxsenUniversityWorkshop";
import TermsAndConditions from "@/pages/TermsAndConditions";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import PricingAndRefundPolicy from "@/pages/PricingAndRefundPolicy";
import ShippingPolicy from "@/pages/ShippingPolicy";
import { Helmet } from "react-helmet";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/our-works" component={OurWorks} />
      <Route path="/contact" component={Contact} />
      <Route path="/project-guidance" component={ProjectGuidance} />
      <Route path="/ai-chat" component={AIChat} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-home" component={AdminHome} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/ai-knowledge-management" component={AIKnowledgeManagement} />
      <Route path="/dev-admin-login" component={DevAdminLogin} />
      <Route path="/login" component={Login} />
      <Route path="/add-whatsapp-bot" component={AddWhatsAppBot} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-failed" component={PaymentFailed} />
      <Route path="/all-sessions" component={AllSessions} />
      <Route path="/view-my-sessions" component={AllSessions} />
      
      {/* Workshop Detail Pages */}
      <Route path="/workshops/bond-with-bamboo" component={BondWithBambooWorkshop} />
      <Route path="/workshops/international-bamboo-fest" component={InternationalBambooFestWorkshop} />
      <Route path="/workshops/manit-bhopal" component={ManitBhopalWorkshop} />
      <Route path="/workshops/nit-bhopal" component={NITBhopalWorkshop} />
      <Route path="/workshops/bamboo-lighting" component={BambooLightingWorkshop} />
      <Route path="/workshops/icfai-architecture" component={IcfaiWorkshop} />
      <Route path="/workshops/sirpur-community-training" component={SirpurWorkshop} />
      <Route path="/workshops/spa-delhi" component={SPADelhiWorkshop} />
      <Route path="/workshops/woxsen-university" component={WoxsenUniversityWorkshop} />
      
      {/* Legal Pages */}
      <Route path="/terms-and-conditions" component={TermsAndConditions} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/pricing-and-refund-policy" component={PricingAndRefundPolicy} />
      <Route path="/shipping-policy" component={ShippingPolicy} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Helmet>
          <title>BambooMade - Sustainable Bamboo Architecture</title>
          <meta name="description" content="BambooMade pioneers innovative and sustainable architectural solutions using bamboo, blending traditional craftsmanship with modern engineering." />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
          
          {/* Google Analytics Tracking Code */}
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-93PCL9TN0V"></script>
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-93PCL9TN0V');
            `}
          </script>
        </Helmet>
        <div className="flex min-h-screen flex-col relative dark">
          <AnimatedLeaves />
          <div className="relative">
            <Navbar />
            <main className="flex-1">
              <ScrollToTop />
              <Router />
            </main>
            <Footer className="relative" />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
