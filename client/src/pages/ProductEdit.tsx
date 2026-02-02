/**
 * PRODUCT EDIT ADMIN PAGE
 * Password-protected page to rearrange, add, and delete product photography images
 * Password: &&77VAnguard
 */

import { useState, useCallback, useEffect } from "react";
import { motion, Reorder } from "framer-motion";
import { Lock, Plus, Trash2, GripVertical, Save, X, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// Password for admin access
const ADMIN_PASSWORD = "&&77VAnguard";

interface ProductImage {
  id: string;
  src: string;
  alt: string;
  category: string;
  description: string;
}

// Initial images from ProductPhotography page
const initialImages: ProductImage[] = [
  // Watches & Jewelry (11)
  { id: "1", src: "/images/product/rolex-pepsi-gmt.webp", alt: "Rolex GMT-Master II 'Pepsi'", category: "watches", description: "Studio: bezel color separation + sapphire control" },
  { id: "2", src: "/images/product/omega-speedmaster.webp", alt: "Omega Speedmaster Moonwatch", category: "watches", description: "Studio: black dial contrast, tachymeter detail" },
  { id: "3", src: "/images/product/cartier-tank.webp", alt: "Cartier Tank", category: "watches", description: "Studio: high-key minimal, Parisian restraint" },
  { id: "4", src: "/images/product/ap-royal-oak.webp", alt: "Audemars Piguet Royal Oak", category: "watches", description: "Studio: bracelet geometry + brushed/polished contrast" },
  { id: "5", src: "/images/product/patek-calatrava.webp", alt: "Patek Philippe Calatrava", category: "watches", description: "Studio: dress watch elegance, guilloché dial" },
  { id: "6", src: "/images/product/tag-monaco.webp", alt: "TAG Heuer Monaco", category: "watches", description: "Studio: square case, racing heritage" },
  { id: "7", src: "/images/product/breitling-navitimer.webp", alt: "Breitling Navitimer", category: "watches", description: "Studio: aviation instrument, slide rule bezel" },
  { id: "8", src: "/images/product/tudor-black-bay.webp", alt: "Tudor Black Bay", category: "watches", description: "Studio: dive watch heritage, snowflake hands" },
  { id: "9", src: "/images/product/jlc-reverso.webp", alt: "Jaeger-LeCoultre Reverso", category: "watches", description: "Studio: art-deco geometry, reversible case" },
  { id: "10", src: "/images/product/tiffany-jewelry.webp", alt: "Tiffany & Co. Diamond Ring", category: "watches", description: "Studio: gem specular control, platinum setting" },
  { id: "11", src: "/images/product/rolex-yacht-master.webp", alt: "Rolex Yacht-Master II", category: "watches", description: "Studio: water splash, rose gold + steel, ceramic bezel" },
  
  // Automotive (10)
  { id: "12", src: "/images/product/porsche-911-crest.webp", alt: "Porsche 911 Hood Crest", category: "automotive", description: "Studio: paint reflections, emblem detail" },
  { id: "13", src: "/images/product/ferrari-steering.webp", alt: "Ferrari Steering Wheel", category: "automotive", description: "Lifestyle: cockpit drama, leather + carbon" },
  { id: "14", src: "/images/product/mercedes-g-headlight.webp", alt: "Mercedes-Benz G-Class Headlight", category: "automotive", description: "Studio: hard-edge highlight, brutal luxury" },
  { id: "15", src: "/images/product/range-rover-interior.webp", alt: "Range Rover Interior", category: "automotive", description: "Lifestyle: calm wealth, glass/wood" },
  { id: "16", src: "/images/product/tesla-cybertruck.webp", alt: "Tesla Cybertruck Surface", category: "automotive", description: "Studio: geometry + steel texture" },
  { id: "17", src: "/images/product/lamborghini-exhaust.webp", alt: "Lamborghini Exhaust", category: "automotive", description: "Studio: titanium heat patina, hexagonal tips" },
  { id: "18", src: "/images/product/bentley-flying-b.webp", alt: "Bentley Flying B", category: "automotive", description: "Studio: chrome wings, ultra-luxury emblem" },
  { id: "19", src: "/images/product/aston-martin-grille.webp", alt: "Aston Martin Grille", category: "automotive", description: "Studio: mesh detail, British craftsmanship" },
  { id: "20", src: "/images/product/mclaren-wheel.webp", alt: "McLaren Carbon Wheel", category: "automotive", description: "Studio: carbon weave, orange caliper" },
  { id: "21", src: "/images/product/rolls-royce-spirit.webp", alt: "Rolls-Royce Spirit of Ecstasy", category: "automotive", description: "Studio: iconic chrome figure, dramatic light" },
  
  // Spirits & Alcohol (10)
  { id: "22", src: "/images/product/macallan-whisky.webp", alt: "The Macallan 18 Year", category: "spirits", description: "Studio: amber gradients, heritage bottle" },
  { id: "23", src: "/images/product/hennessy-cognac.webp", alt: "Hennessy XO Cognac", category: "spirits", description: "Studio: dark luxe, snifter glass" },
  { id: "24", src: "/images/product/grey-goose-vodka.webp", alt: "Grey Goose Vodka", category: "spirits", description: "Studio: frosted glass, French elegance" },
  { id: "25", src: "/images/product/don-julio-tequila.webp", alt: "Don Julio 1942", category: "spirits", description: "Studio: tall amber bottle, gold accents" },
  { id: "26", src: "/images/product/champagne-dom-perignon.webp", alt: "Dom Perignon", category: "spirits", description: "Studio: condensation droplets, celebration" },
  { id: "27", src: "/images/product/johnnie-walker-blue.webp", alt: "Johnnie Walker Blue Label", category: "spirits", description: "Studio: iconic blue bottle, gold label" },
  { id: "28", src: "/images/product/patron-tequila.webp", alt: "Patrón Silver", category: "spirits", description: "Studio: hand-blown glass, bee logo" },
  { id: "29", src: "/images/product/bombay-sapphire-gin.webp", alt: "Bombay Sapphire Gin", category: "spirits", description: "Studio: blue glass facets, Queen Victoria" },
  { id: "30", src: "/images/product/remy-martin-xo.webp", alt: "Rémy Martin XO", category: "spirits", description: "Studio: frosted decanter, centaur logo" },
  { id: "31", src: "/images/product/veuve-clicquot.webp", alt: "Veuve Clicquot", category: "spirits", description: "Studio: iconic yellow label, celebration" },
  
  // Beverages (10)
  { id: "32", src: "/images/product/coca-cola-classic.webp", alt: "Coca-Cola Classic Bottle", category: "beverages", description: "Studio: iconic contour bottle, condensation" },
  { id: "33", src: "/images/product/pepsi-can.webp", alt: "Pepsi Can Splash", category: "beverages", description: "Studio: dynamic water splash, frozen motion" },
  { id: "34", src: "/images/product/red-bull-energy.webp", alt: "Red Bull Energy", category: "beverages", description: "Studio: silver can, bulls logo" },
  { id: "35", src: "/images/product/starbucks-frappuccino.webp", alt: "Starbucks Frappuccino", category: "beverages", description: "Studio: glass bottle, siren logo" },
  { id: "36", src: "/images/product/perrier-sparkling.webp", alt: "Perrier Sparkling Water", category: "beverages", description: "Studio: green glass, rising bubbles" },
  { id: "37", src: "/images/product/monster-energy.webp", alt: "Monster Energy", category: "beverages", description: "Studio: green claw logo, ice crystals" },
  { id: "38", src: "/images/product/san-pellegrino.webp", alt: "San Pellegrino", category: "beverages", description: "Studio: Italian elegance, red star" },
  { id: "39", src: "/images/product/gatorade-orange.webp", alt: "Gatorade Orange", category: "beverages", description: "Studio: athletic energy, lightning bolt" },
  { id: "40", src: "/images/product/fanta-orange.webp", alt: "Fanta Orange", category: "beverages", description: "Studio: vibrant orange, playful" },
  { id: "41", src: "/images/product/sprite-lemon.webp", alt: "Sprite Lemon-Lime", category: "beverages", description: "Studio: citrus freshness, clear bubbles" },
  
  // Tech / Fashion / Consumer Icons (10)
  { id: "42", src: "/images/product/tech-iphone-backplate.webp", alt: "Apple iPhone Backplate Macro", category: "tech-fashion", description: "Studio: ultra-clean specular control" },
  { id: "43", src: "/images/product/tech-leica-camera.webp", alt: "Leica Camera Body", category: "tech-fashion", description: "Studio: heritage engineering, low-key" },
  { id: "44", src: "/images/product/tech-sony-headphones.webp", alt: "Sony Headphones", category: "tech-fashion", description: "Studio: matte textures, soft gradients" },
  { id: "45", src: "/images/product/tech-bo-speaker.webp", alt: "Bang & Olufsen Speaker", category: "tech-fashion", description: "Studio: industrial sculpture" },
  { id: "46", src: "/images/product/fashion-nike-af1.webp", alt: "Nike Air Force 1", category: "tech-fashion", description: "Studio: white-on-white texture mastery" },
  { id: "47", src: "/images/product/fashion-adidas-samba.webp", alt: "Adidas Samba", category: "tech-fashion", description: "Lifestyle: street + shadow geometry" },
  { id: "48", src: "/images/product/fashion-rayban-wayfarer.webp", alt: "Ray-Ban Wayfarer", category: "tech-fashion", description: "Studio: lens reflection discipline" },
  { id: "49", src: "/images/product/fashion-lv-leather.webp", alt: "Louis Vuitton Leather Good", category: "tech-fashion", description: "Studio: grain + stitching macro" },
  { id: "50", src: "/images/product/consumer-aesop-bottles.webp", alt: "Aesop Bottle Set", category: "tech-fashion", description: "Studio: editorial minimal, warm neutrals" },
  { id: "51", src: "/images/product/consumer-dyson-hairtool.webp", alt: "Dyson Hair Tool", category: "tech-fashion", description: "Studio: chrome + matte, modern premium" },
];

const categories = [
  { id: "watches", name: "Watches & Jewelry" },
  { id: "automotive", name: "Automotive" },
  { id: "spirits", name: "Spirits & Alcohol" },
  { id: "beverages", name: "Beverages" },
  { id: "tech-fashion", name: "Tech / Fashion / Consumer" },
];

export default function ProductEdit() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newImage, setNewImage] = useState<Partial<ProductImage>>({
    src: "",
    alt: "",
    category: "watches",
    description: "",
  });

  // Check for saved session
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("productEditAuth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("productEditAuth", "true");
      toast.success("Access granted");
    } else {
      toast.error("Invalid password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("productEditAuth");
    setPassword("");
  };

  const handleReorder = (newOrder: ProductImage[]) => {
    setImages(newOrder);
    setHasChanges(true);
  };

  const handleDelete = (id: string) => {
    setImages(images.filter(img => img.id !== id));
    setHasChanges(true);
    toast.success("Image removed");
  };

  const handleAddImage = () => {
    if (!newImage.src || !newImage.alt) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newId = (Math.max(...images.map(img => parseInt(img.id))) + 1).toString();
    setImages([...images, { ...newImage, id: newId } as ProductImage]);
    setHasChanges(true);
    setShowAddModal(false);
    setNewImage({ src: "", alt: "", category: "watches", description: "" });
    toast.success("Image added");
  };

  const handleSave = async () => {
    // In a real implementation, this would save to the database
    // For now, we'll show a success message and log the new order
    console.log("Saving new image order:", images);
    toast.success("Changes saved successfully! Note: To persist changes permanently, the code needs to be updated.");
    setHasChanges(false);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Product Edit</h1>
            <p className="text-sm text-foreground/60 mt-2">Enter password to access admin panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-center"
            />
            <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-background">
              Access Panel
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/30">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Product Photography Editor</h1>
            <p className="text-sm text-foreground/60">{images.length} images</p>
          </div>
          <div className="flex items-center gap-4">
            {hasChanges && (
              <Button onClick={handleSave} className="bg-gold hover:bg-gold/90 text-background">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
            <Button onClick={() => setShowAddModal(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="icon">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Instructions */}
      <div className="container py-6">
        <div className="bg-secondary/30 rounded-lg p-4 mb-8">
          <p className="text-sm text-foreground/80">
            <strong>Instructions:</strong> Drag images to reorder them. Click the trash icon to remove an image. 
            Click "Add Image" to add a new image. Changes are saved when you click "Save Changes".
          </p>
        </div>

        {/* Reorderable Image Grid */}
        <Reorder.Group
          axis="y"
          values={images}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {images.map((image) => (
            <Reorder.Item
              key={image.id}
              value={image}
              className="bg-secondary/20 rounded-lg p-3 flex items-center gap-4 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-5 h-5 text-foreground/40 flex-shrink-0" />
              
              <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-secondary/30">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{image.alt}</p>
                <p className="text-xs text-foreground/60 truncate">{image.description}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gold/20 text-gold rounded">
                  {categories.find(c => c.id === image.category)?.name || image.category}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(image.id)}
                className="flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Add Image Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add New Image</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Image URL *</label>
                <Input
                  placeholder="/images/product/example.webp"
                  value={newImage.src}
                  onChange={(e) => setNewImage({ ...newImage, src: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Alt Text / Title *</label>
                <Input
                  placeholder="Product Name"
                  value={newImage.alt}
                  onChange={(e) => setNewImage({ ...newImage, alt: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  value={newImage.category}
                  onChange={(e) => setNewImage({ ...newImage, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  placeholder="Studio: description of the shot"
                  value={newImage.description}
                  onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddImage} className="flex-1 bg-gold hover:bg-gold/90 text-background">
                  Add Image
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
