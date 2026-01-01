import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Leaf, TreeDeciduous, Phone, ArrowRight, Building2 } from "lucide-react";
import terrariumImage from "@assets/IMG_20251212_104945996_1767269580547.jpg";

const THINKingheART = () => {
  return (
    <>
      <Helmet>
        <title>THINKingheART - Miniature Art, Terrariums & Bamboo Models | BambooMade</title>
        <meta name="description" content="THINKingheART - Discover the art of terrariums, miniature bamboo building models, and living sculptures. Handcrafted art pieces that bring nature and architecture together." />
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
              The Art of Miniature Worlds - Terrariums, Bamboo Models & Living Sculptures
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-amber-500 to-green-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative rounded-2xl overflow-hidden bg-gray-800 border border-green-700/30">
                <img 
                  src={terrariumImage} 
                  alt="Handcrafted Terrarium with moss and succulents" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-white font-medium">Handcrafted Terrarium</p>
                  <p className="text-green-300 text-sm">Living miniature ecosystem</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Miniature Art, <span className="text-green-400">Terrariums</span> & <span className="text-amber-400">Bamboo Models</span>
              </h2>
              <p className="text-gray-300 leading-relaxed">
                THINKingheART brings nature and architecture together through the enchanting world of terrariums, miniature art, 
                and bamboo building models. Each piece is carefully crafted to capture beauty in miniature form.
              </p>
              <p className="text-gray-300 leading-relaxed">
                From self-sustaining terrariums with lush moss and succulents, to intricately detailed miniature bamboo 
                building models that showcase architectural craftsmanship - every creation is a work of art.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm border border-green-700/50">
                  Terrariums
                </span>
                <span className="px-3 py-1 bg-amber-900/50 text-amber-300 rounded-full text-sm border border-amber-700/50">
                  Bamboo Models
                </span>
                <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm border border-blue-700/50">
                  Miniature Gardens
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
            <Card className="bg-gray-800/50 border-green-500/30 hover:border-green-500/60 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                  <Leaf className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-green-300">Terrariums</CardTitle>
                <CardDescription className="text-gray-400">
                  Self-sustaining glass ecosystems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Beautifully designed closed and open terrariums featuring moss, succulents, and miniature plants.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-amber-500/30 hover:border-amber-500/60 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-amber-400" />
                </div>
                <CardTitle className="text-amber-300">Bamboo Building Models</CardTitle>
                <CardDescription className="text-gray-400">
                  Miniature architectural masterpieces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Intricately crafted miniature bamboo building models showcasing traditional and modern architecture.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-blue-500/30 hover:border-blue-500/60 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                  <TreeDeciduous className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-blue-300">Miniature Gardens</CardTitle>
                <CardDescription className="text-gray-400">
                  Tiny landscapes with big impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Intricate miniature garden scenes featuring tiny pathways and fairy garden elements.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-red-500/30 hover:border-red-500/60 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                  <Heart className="w-6 h-6 text-red-400" />
                </div>
                <CardTitle className="text-red-300">Custom Creations</CardTitle>
                <CardDescription className="text-gray-400">
                  Personalized art pieces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Commission custom miniature art designed specifically for your space or as unique gifts.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-green-900/30 to-amber-900/30 rounded-xl p-8 max-w-3xl mx-auto border border-green-700/30">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-amber-400 mr-2" />
                <h2 className="text-2xl font-semibold text-green-300">Interested in Miniature Art?</h2>
              </div>
              <p className="text-gray-300 mb-6">
                Whether you want to purchase a ready-made terrarium, commission a custom piece, 
                or learn how to create your own miniature garden, we'd love to hear from you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => window.location.href = "/contact"}
                >
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <a href="https://wa.me/8971690163" target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="outline"
                    className="border-green-600 text-green-400 hover:bg-green-900/30 w-full sm:w-auto"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default THINKingheART;
