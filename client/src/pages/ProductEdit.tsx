/**
 * PRODUCT EDIT ADMIN PAGE
 * Password-protected page to rearrange, add, and delete product photography images
 * Password: &&77VAnguard
 */

import { useState, useEffect } from "react";
import { motion, Reorder } from "framer-motion";
import { Lock, Plus, Trash2, GripVertical, Save, X, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { assetUrl } from "@/lib/assets";

// Password for admin access
const ADMIN_PASSWORD = "&&77VAnguard";

interface ProductImage {
  id: string;
  src: string;
  alt: string;
  category: string;
  description: string;
}

// Initial images - MATCHES DATABASE ORDER (42 images)
// This is the fallback list if no saved order exists
// Deleted images are NOT included here
const initialImages: ProductImage[] = [
  // 1. Rolex Yacht-Master
  { id: "1", src: assetUrl("/images/product/rolex-yacht-master.webp"), alt: "Rolex Yacht-Master II", category: "watches", description: "Studio: water splash, rose gold + steel, ceramic bezel" },
  // 2. Don Julio Tequila
  { id: "2", src: assetUrl("/images/product/don-julio-tequila.webp"), alt: "Don Julio 1942", category: "spirits", description: "Studio: tall amber bottle, gold accents" },
  // 3. Aesop Bottles
  { id: "3", src: assetUrl("/images/product/consumer-aesop-bottles.webp"), alt: "Aesop Bottle Set", category: "tech-fashion", description: "Studio: editorial minimal, warm neutrals" },
  // 4. McLaren Wheel
  { id: "4", src: assetUrl("/images/product/mclaren-wheel.webp"), alt: "McLaren Carbon Wheel", category: "automotive", description: "Studio: carbon weave, orange caliper" },
  // 5. Louis Vuitton Leather
  { id: "5", src: assetUrl("/images/product/fashion-lv-leather.webp"), alt: "Louis Vuitton Leather Good", category: "tech-fashion", description: "Studio: grain + stitching macro" },
  // 6. Bang & Olufsen Speaker
  { id: "6", src: assetUrl("/images/product/tech-bo-speaker.webp"), alt: "Bang & Olufsen Speaker", category: "tech-fashion", description: "Studio: industrial sculpture" },
  // 7. Audemars Piguet Royal Oak
  { id: "7", src: assetUrl("/images/product/ap-royal-oak.webp"), alt: "Audemars Piguet Royal Oak", category: "watches", description: "Studio: bracelet geometry + brushed/polished contrast" },
  // 8. Jaeger-LeCoultre Reverso
  { id: "8", src: assetUrl("/images/product/jlc-reverso.webp"), alt: "Jaeger-LeCoultre Reverso", category: "watches", description: "Studio: art-deco geometry, reversible case" },
  // 9. Omega Speedmaster
  { id: "9", src: assetUrl("/images/product/omega-speedmaster.webp"), alt: "Omega Speedmaster Moonwatch", category: "watches", description: "Studio: black dial contrast, tachymeter detail" },
  // 10. Porsche 911 Crest
  { id: "10", src: assetUrl("/images/product/porsche-911-crest.webp"), alt: "Porsche 911 Hood Crest", category: "automotive", description: "Studio: paint reflections, emblem detail" },
  // 11. Tiffany Jewelry
  { id: "11", src: assetUrl("/images/product/tiffany-jewelry.webp"), alt: "Tiffany & Co. Diamond Ring", category: "watches", description: "Studio: gem specular control, platinum setting" },
  // 12. Patek Philippe Calatrava
  { id: "12", src: assetUrl("/images/product/patek-calatrava.webp"), alt: "Patek Philippe Calatrava", category: "watches", description: "Studio: dress watch elegance, guilloché dial" },
  // 13. TAG Heuer Monaco
  { id: "13", src: assetUrl("/images/product/tag-monaco.webp"), alt: "TAG Heuer Monaco", category: "watches", description: "Studio: square case, racing heritage" },
  // 14. Cartier Tank
  { id: "14", src: assetUrl("/images/product/cartier-tank.webp"), alt: "Cartier Tank", category: "watches", description: "Studio: high-key minimal, Parisian restraint" },
  // 15. Mercedes G-Class Headlight
  { id: "15", src: assetUrl("/images/product/mercedes-g-headlight.webp"), alt: "Mercedes-Benz G-Class Headlight", category: "automotive", description: "Studio: hard-edge highlight, brutal luxury" },
  // 16. Breitling Navitimer
  { id: "16", src: assetUrl("/images/product/breitling-navitimer.webp"), alt: "Breitling Navitimer", category: "watches", description: "Studio: aviation instrument, slide rule bezel" },
  // 17. Tudor Black Bay
  { id: "17", src: assetUrl("/images/product/tudor-black-bay.webp"), alt: "Tudor Black Bay", category: "watches", description: "Studio: dive watch heritage, snowflake hands" },
  // 18. Macallan Whisky
  { id: "18", src: assetUrl("/images/product/macallan-whisky.webp"), alt: "The Macallan 18 Year", category: "spirits", description: "Studio: amber gradients, heritage bottle" },
  // 19. Ferrari Steering
  { id: "19", src: assetUrl("/images/product/ferrari-steering.webp"), alt: "Ferrari Steering Wheel", category: "automotive", description: "Lifestyle: cockpit drama, leather + carbon" },
  // 20. Range Rover Interior
  { id: "20", src: assetUrl("/images/product/range-rover-interior.webp"), alt: "Range Rover Interior", category: "automotive", description: "Lifestyle: calm wealth, glass/wood" },
  // 21. Tesla Cybertruck
  { id: "21", src: assetUrl("/images/product/tesla-cybertruck.webp"), alt: "Tesla Cybertruck Surface", category: "automotive", description: "Studio: geometry + steel texture" },
  // 22. Rolls-Royce Spirit
  { id: "22", src: assetUrl("/images/product/rolls-royce-spirit.webp"), alt: "Rolls-Royce Spirit of Ecstasy", category: "automotive", description: "Studio: iconic chrome figure, dramatic light" },
  // 23. Hennessy Cognac
  { id: "23", src: assetUrl("/images/product/hennessy-cognac.webp"), alt: "Hennessy XO Cognac", category: "spirits", description: "Studio: dark luxe, snifter glass" },
  // 24. Rémy Martin XO
  { id: "24", src: assetUrl("/images/product/remy-martin-xo.webp"), alt: "Rémy Martin XO", category: "spirits", description: "Studio: frosted decanter, centaur logo" },
  // 25. Lamborghini Exhaust
  { id: "25", src: assetUrl("/images/product/lamborghini-exhaust.webp"), alt: "Lamborghini Exhaust", category: "automotive", description: "Studio: titanium heat patina, hexagonal tips" },
  // 26. Bentley Flying B
  { id: "26", src: assetUrl("/images/product/bentley-flying-b.webp"), alt: "Bentley Flying B", category: "automotive", description: "Studio: chrome wings, ultra-luxury emblem" },
  // 27. Johnnie Walker Blue
  { id: "27", src: assetUrl("/images/product/johnnie-walker-blue.webp"), alt: "Johnnie Walker Blue Label", category: "spirits", description: "Studio: iconic blue bottle, gold label" },
  // 28. Aston Martin Grille
  { id: "28", src: assetUrl("/images/product/aston-martin-grille.webp"), alt: "Aston Martin Grille", category: "automotive", description: "Studio: mesh detail, British craftsmanship" },
  // 29. Adidas Samba
  { id: "29", src: assetUrl("/images/product/fashion-adidas-samba.webp"), alt: "Adidas Samba", category: "tech-fashion", description: "Lifestyle: street + shadow geometry" },
  // 30. Grey Goose Vodka
  { id: "30", src: assetUrl("/images/product/grey-goose-vodka.webp"), alt: "Grey Goose Vodka", category: "spirits", description: "Studio: frosted glass, French elegance" },
  // 31. Dom Perignon
  { id: "31", src: assetUrl("/images/product/champagne-dom-perignon.webp"), alt: "Dom Perignon", category: "spirits", description: "Studio: condensation droplets, celebration" },
  // 32. Sprite Lemon
  { id: "32", src: assetUrl("/images/product/sprite-lemon.webp"), alt: "Sprite Lemon-Lime", category: "beverages", description: "Studio: citrus freshness, clear bubbles" },
  // 33. Veuve Clicquot
  { id: "33", src: assetUrl("/images/product/veuve-clicquot.webp"), alt: "Veuve Clicquot", category: "spirits", description: "Studio: iconic yellow label, celebration" },
  // 34. Bombay Sapphire Gin
  { id: "34", src: assetUrl("/images/product/bombay-sapphire-gin.webp"), alt: "Bombay Sapphire Gin", category: "spirits", description: "Studio: blue glass facets, Queen Victoria" },
  // 35. Coca-Cola Classic
  { id: "35", src: assetUrl("/images/product/coca-cola-classic.webp"), alt: "Coca-Cola Classic Bottle", category: "beverages", description: "Studio: iconic contour bottle, condensation" },
  // 36. Pepsi Can
  { id: "36", src: assetUrl("/images/product/pepsi-can.webp"), alt: "Pepsi Can Splash", category: "beverages", description: "Studio: dynamic water splash, frozen motion" },
  // 37. Monster Energy
  { id: "37", src: assetUrl("/images/product/monster-energy.webp"), alt: "Monster Energy", category: "beverages", description: "Studio: green claw logo, ice crystals" },
  // 38. San Pellegrino
  { id: "38", src: assetUrl("/images/product/san-pellegrino.webp"), alt: "San Pellegrino", category: "beverages", description: "Studio: Italian elegance, red star" },
  // 39. Dyson Hair Tool
  { id: "39", src: assetUrl("/images/product/consumer-dyson-hairtool.webp"), alt: "Dyson Hair Tool", category: "tech-fashion", description: "Studio: chrome + matte, modern premium" },
  // 40. Leica Camera
  { id: "40", src: assetUrl("/images/product/tech-leica-camera.webp"), alt: "Leica Camera Body", category: "tech-fashion", description: "Studio: heritage engineering, low-key" },
  // 41. Sony Headphones
  { id: "41", src: assetUrl("/images/product/tech-sony-headphones.webp"), alt: "Sony Headphones", category: "tech-fashion", description: "Studio: matte textures, soft gradients" },
  // 42. Nike Air Force 1
  { id: "42", src: assetUrl("/images/product/fashion-nike-af1.webp"), alt: "Nike Air Force 1", category: "tech-fashion", description: "Studio: white-on-white texture mastery" },
];

// Create a lookup map for quick access to image metadata by src
const imageMetadataMap = new Map(initialImages.map(img => [img.src, img]));

const categories = [
  { id: "watches", name: "Watches & Jewelry" },
  { id: "automotive", name: "Automotive" },
  { id: "spirits", name: "Spirits & Alcohol" },
  { id: "beverages", name: "Beverages" },
  { id: "tech-fashion", name: "Tech / Fashion / Consumer" },
];

export default function ProductEdit() {
  // Prevent search engine indexing of admin pages
  useEffect(() => {
    // Add noindex meta tag
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);
    
    return () => {
      // Clean up on unmount
      document.head.removeChild(metaRobots);
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newImage, setNewImage] = useState<Partial<ProductImage>>({
    src: "",
    alt: "",
    category: "watches",
    description: "",
  });

  // Fetch saved order from database
  const { data: savedOrder, isLoading: isLoadingOrder } = trpc.gallery.getOrder.useQuery(
    { gallery: "product-photography" },
    { enabled: isAuthenticated }
  );

  // Check for saved session
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("productEditAuth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  // Load images from saved order or use initial images
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    if (isLoadingOrder) {
      setIsLoading(true);
      return;
    }

    if (savedOrder?.order && savedOrder.order.length > 0) {
      // Reconstruct images from saved order
      const orderedImages: ProductImage[] = [];
      let idCounter = 1;
      
      for (const src of savedOrder.order) {
        const metadata = imageMetadataMap.get(src);
        if (metadata) {
          orderedImages.push({ ...metadata, id: String(idCounter++) });
        } else {
          // Handle images that might have been added but aren't in the initial set
          orderedImages.push({
            id: String(idCounter++),
            src,
            alt: "Custom Image",
            category: "tech-fashion",
            description: "User added image",
          });
        }
      }
      
      setImages(orderedImages);
      toast.success(`Loaded ${orderedImages.length} images from saved order`);
    } else {
      // No saved order, use initial images
      setImages(initialImages);
    }
    
    setIsLoading(false);
  }, [isAuthenticated, savedOrder, isLoadingOrder]);

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

    const newId = (Math.max(...images.map(img => parseInt(img.id)), 0) + 1).toString();
    setImages([...images, { ...newImage, id: newId } as ProductImage]);
    setHasChanges(true);
    setShowAddModal(false);
    setNewImage({ src: "", alt: "", category: "watches", description: "" });
    toast.success("Image added");
  };

  const saveOrderMutation = trpc.gallery.saveOrder.useMutation({
    onSuccess: () => {
      toast.success("Changes saved to database successfully!");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleSave = async () => {
    // Save to database via API
    const imageOrder = images.map(img => img.src);
    saveOrderMutation.mutate({
      gallery: "product-photography",
      order: imageOrder,
      password: ADMIN_PASSWORD,
    });
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
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Product Edit</h1>
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
          <p className="text-sm text-foreground/60">Loading images...</p>
        </div>
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
            <h1 className="text-xl font-semibold tracking-[-0.02em]">Product Photography Editor</h1>
            <p className="text-sm text-foreground/60">{images.length} images</p>
          </div>
          <div className="flex items-center gap-4">
            {hasChanges && (
              <Button 
                onClick={handleSave} 
                className="bg-gold hover:bg-gold/90 text-background"
                disabled={saveOrderMutation.isPending}
              >
                {saveOrderMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
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
                  placeholder={assetUrl("/images/product/example.webp")}
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
