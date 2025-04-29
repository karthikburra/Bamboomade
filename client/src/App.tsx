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
import AddWhatsAppBot from "@/pages/AddWhatsAppBot";
import NotFound from "@/pages/not-found";
import { Helmet } from "react-helmet";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/contact" component={Contact} />
      <Route path="/project-guidance" component={ProjectGuidance} />
      <Route path="/ai-chat" component={AIChat} />
      <Route path="/admin" component={Admin} />
      <Route path="/login" component={Login} />
      <Route path="/add-whatsapp-bot" component={AddWhatsAppBot} />
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
        <div className="flex min-h-screen flex-col relative">
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
