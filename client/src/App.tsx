import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedLeaves from "@/components/AnimatedLeaves";
import ScrollToTop from "@/components/ScrollToTop";
import DevToolsButton from "@/components/DevToolsButton";
import { useEffect } from "react";
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
import AdminAIKnowledgeChat from "@/pages/AdminAIKnowledgeChat";
import AddWhatsAppBot from "@/pages/AddWhatsAppBot";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentFailed from "@/pages/PaymentFailed";
import OurWorks from "@/pages/OurWorks";
import AllSessions from "@/pages/AllSessions";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileEdit from "@/pages/ProfileEdit";
import VerifyEmail from "@/pages/VerifyEmail";
import DevTools from "@/pages/DevTools";
import NotFound from "@/pages/not-found";
import UserProfile from "@/pages/UserProfile";
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
      <Route path="/ai-chat">
        {() => <ProtectedRoute component={AIChat} requiresSubscription={true} />}
      </Route>
      <Route path="/admin" component={Admin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-home" component={AdminHome} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/ai-knowledge-management" component={AIKnowledgeManagement} />
      <Route path="/ai-knowledge-database" component={AIKnowledgeDatabase} />
      <Route path="/admin-ai-knowledge-chat" component={AdminAIKnowledgeChat} />
      <Route path="/dev-admin-login" component={DevAdminLogin} />
      <Route path="/login" component={Login} />
      <Route path="/profile/edit" component={ProfileEdit} />
      <Route path="/add-whatsapp-bot" component={AddWhatsAppBot} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/payment-failed" component={PaymentFailed} />
      <Route path="/all-sessions" component={AllSessions} />
      <Route path="/view-my-sessions" component={AllSessions} />
      <Route path="/verify-email/:token" component={VerifyEmail} />
      <Route path="/dev-tools" component={DevTools} />
      <Route path="/user-profile/:id" component={UserProfile} />
      
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

// ProfileRedirectChecker component performs check for incomplete profiles and redirects if needed
function ProfileRedirectChecker({ children }: { children: React.ReactNode }) {
  // Check if user is logged in and needs to complete their profile
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    // If user is logged in and needs to complete their profile, redirect to edit profile page
    if (!isLoading && user && user && window.location.pathname !== '/profile/edit') {
      console.log("User needs to complete profile. Redirecting to profile edit page.");
      window.location.href = '/profile/edit';
    }
  }, [user, isLoading]);
  
  return <>{children}</>;
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
        <ProfileRedirectChecker>
          <div className="flex min-h-screen flex-col relative dark">
            <AnimatedLeaves />
            <div className="relative">
              <Navbar />
              <main className="flex-1">
                <ScrollToTop />
                <Router />
              </main>
              <Footer className="relative" />
              <DevToolsButton />
            </div>
          </div>
        </ProfileRedirectChecker>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
