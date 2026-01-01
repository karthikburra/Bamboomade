import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Lightbulb, Palette, ArrowRight } from "lucide-react";

const THINKingheART = () => {
  return (
    <>
      <Helmet>
        <title>THINKingheART - BambooMade</title>
        <meta name="description" content="THINKingheART - Where creative thinking meets artistic expression through bamboo design and sustainable architecture." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
        <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              <span className="text-amber-400">THINK</span>
              <span className="text-green-400">ing</span>
              <span className="text-red-400">he</span>
              <span className="text-blue-400">ART</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Where creative thinking meets artistic expression through bamboo design and sustainable architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <Card className="bg-gray-800/50 border-amber-500/30 hover:border-amber-500/60 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
                  <Lightbulb className="w-6 h-6 text-amber-400" />
                </div>
                <CardTitle className="text-amber-300">Think</CardTitle>
                <CardDescription className="text-gray-400">
                  Innovative concepts and creative solutions for sustainable design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Explore new ideas and methodologies in bamboo architecture that push the boundaries of traditional design.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-red-500/30 hover:border-red-500/60 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                  <Heart className="w-6 h-6 text-red-400" />
                </div>
                <CardTitle className="text-red-300">Heart</CardTitle>
                <CardDescription className="text-gray-400">
                  Passion-driven projects with meaningful impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Projects that combine emotional connection with environmental consciousness and community engagement.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-blue-500/30 hover:border-blue-500/60 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                  <Palette className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-blue-300">Art</CardTitle>
                <CardDescription className="text-gray-400">
                  Artistic expression through bamboo craftsmanship
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Beautiful creations that showcase the versatility and elegance of bamboo as an artistic medium.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-green-900/30 to-amber-900/30 rounded-xl p-8 max-w-3xl mx-auto border border-green-700/30">
              <h2 className="text-2xl font-semibold text-green-300 mb-4">Coming Soon</h2>
              <p className="text-gray-300 mb-6">
                We're working on exciting new content and features for THINKingheART. 
                Stay tuned for creative workshops, design showcases, and inspiring bamboo art projects.
              </p>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = "/contact"}
              >
                Get Notified
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default THINKingheART;
