import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedLeaves from "@/components/AnimatedLeaves";
import Home from "@/pages/Home";
import Gallery from "@/pages/Gallery";
import Contact from "@/pages/Contact";
import ProjectGuidance from "@/pages/ProjectGuidance";
import AIChat from "@/pages/AIChat";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AddWhatsAppBot from "@/pages/AddWhatsAppBot";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentFailed from "@/pages/PaymentFailed";
import OurWorks from "@/pages/OurWorks";
import NotFound from "@/pages/not-found";
// Workshop detail pages
import BondWithBambooWorkshop from "@/pages/BondWithBambooWorkshop";
import InternationalBambooFestWorkshop from "@/pages/InternationalBambooFestWorkshop";
import ManitBhopalWorkshop from "@/pages/ManitBhopalWorkshop";
import BambooLightingWorkshop from "@/pages/BambooLightingWorkshop";
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
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/login" component={Login} />
      <Route path="/add-whatsapp-bot" component={AddWhatsAppBot} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-failed" component={PaymentFailed} />
      
      {/* Workshop Detail Pages */}
      <Route path="/workshops/bond-with-bamboo" component={BondWithBambooWorkshop} />
      <Route path="/workshops/international-bamboo-fest" component={InternationalBambooFestWorkshop} />
      <Route path="/workshops/manit-bhopal" component={ManitBhopalWorkshop} />
      <Route path="/workshops/bamboo-lighting" component={BambooLightingWorkshop} />
      
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
        </Helmet>
        <div className="flex min-h-screen flex-col relative dark">
          <AnimatedLeaves />
          <div className="relative">
            <Navbar />
            <main className="flex-1">
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
