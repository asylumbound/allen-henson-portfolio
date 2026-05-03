import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { motion, Reorder } from "framer-motion";
import { Lock, Save, GripVertical, Check, X, Images, BookOpen, Upload, Trash2, Plus, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// Import the image arrays from Photos and Journal pages
import { photosImages } from "./Photos";
import { journalImages } from "./Journal";

type GalleryType = "photos" | "journal";

interface ImageItem {
  id: string;
  src: string;
  alt: string;
  isNew?: boolean; // Track newly uploaded images
}

export default function Edit() {
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
  const [error, setError] = useState("");
  const [activeGallery, setActiveGallery] = useState<GalleryType>("photos");
  const [photosOrder, setPhotosOrder] = useState<ImageItem[]>([]);
  const [journalOrder, setJournalOrder] = useState<ImageItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const verifyPassword = trpc.admin.verifyPassword.useMutation();
  const saveOrderMutation = trpc.gallery.saveOrder.useMutation();
  const uploadImageMutation = trpc.gallery.uploadImage.useMutation();
  const deleteImageMutation = trpc.gallery.deleteImage.useMutation();
  const { data: photosOrderData, refetch: refetchPhotos } = trpc.gallery.getOrder.useQuery({ gallery: "photos" });
  const { data: journalOrderData, refetch: refetchJournal } = trpc.gallery.getOrder.useQuery({ gallery: "journal" });

  // Initialize image orders
  useEffect(() => {
    // Photos - photosImages is array of {src, alt}
    const defaultPhotos: ImageItem[] = photosImages.map((img, idx) => ({
      id: `photo-${idx}`,
      src: img.src,
      alt: img.alt,
    }));
    
    if (photosOrderData?.order) {
      // Reorder based on saved order
      const orderedPhotos = photosOrderData.order
        .map((src: string) => defaultPhotos.find(p => p.src === src) || { id: `uploaded-${src}`, src, alt: "Uploaded image", isNew: true })
        .filter((p): p is ImageItem => p !== undefined);
      // Add any new images not in saved order
      const newPhotos = defaultPhotos.filter(p => !photosOrderData.order?.includes(p.src));
      setPhotosOrder([...orderedPhotos, ...newPhotos]);
    } else {
      setPhotosOrder(defaultPhotos);
    }

    // Journal - journalImages is array of objects with src and webSrc
    const defaultJournal: ImageItem[] = journalImages.map((img, idx) => ({
      id: `journal-${idx}`,
      src: img.src,
      alt: `Journal entry ${idx + 1}`,
    }));
    
    if (journalOrderData?.order) {
      const orderedJournal = journalOrderData.order
        .map((src: string) => defaultJournal.find(p => p.src === src) || { id: `uploaded-${src}`, src, alt: "Uploaded image", isNew: true })
        .filter((p): p is ImageItem => p !== undefined);
      const newJournal = defaultJournal.filter(p => !journalOrderData.order?.includes(p.src));
      setJournalOrder([...orderedJournal, ...newJournal]);
    } else {
      setJournalOrder(defaultJournal);
    }
  }, [photosOrderData, journalOrderData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      await verifyPassword.mutateAsync({ password });
      setIsAuthenticated(true);
      sessionStorage.setItem("admin-password", password);
    } catch (err) {
      setError("Invalid password");
    }
  };

  // Check for stored password on mount
  useEffect(() => {
    const storedPassword = sessionStorage.getItem("admin-password");
    if (storedPassword) {
      setPassword(storedPassword);
      verifyPassword.mutateAsync({ password: storedPassword })
        .then(() => setIsAuthenticated(true))
        .catch(() => sessionStorage.removeItem("admin-password"));
    }
  }, []);

  const handleReorder = (newOrder: ImageItem[]) => {
    if (activeGallery === "photos") {
      setPhotosOrder(newOrder);
    } else {
      setJournalOrder(newOrder);
    }
    setHasChanges(true);
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const order = activeGallery === "photos" 
        ? photosOrder.map(p => p.src)
        : journalOrder.map(p => p.src);
      
      await saveOrderMutation.mutateAsync({
        gallery: activeGallery,
        order,
        password,
      });
      
      setSaveStatus("saved");
      setHasChanges(false);
      toast.success("Gallery order saved successfully");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
      toast.error("Failed to save gallery order");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingCount(files.length);
    const uploadedImages: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }

      try {
        // Convert to base64
        const base64 = await fileToBase64(file);
        
        // Upload to S3
        const result = await uploadImageMutation.mutateAsync({
          gallery: activeGallery,
          fileName: file.name,
          fileData: base64,
          contentType: file.type,
          password,
        });

        uploadedImages.push({
          id: `new-${Date.now()}-${i}`,
          src: result.url,
          alt: file.name.replace(/\.[^/.]+$/, ""),
          isNew: true,
        });

        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    // Add uploaded images to the current gallery
    if (uploadedImages.length > 0) {
      if (activeGallery === "photos") {
        setPhotosOrder(prev => [...uploadedImages, ...prev]);
      } else {
        setJournalOrder(prev => [...uploadedImages, ...prev]);
      }
      setHasChanges(true);
    }

    setUploadingCount(0);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleDelete = async (image: ImageItem) => {
    if (!confirm(`Are you sure you want to delete this image?\n\nThis will remove it from the gallery.`)) {
      return;
    }

    setDeletingImage(image.id);

    try {
      // Remove from server order
      await deleteImageMutation.mutateAsync({
        gallery: activeGallery,
        imageSrc: image.src,
        password,
      });

      // Remove from local state
      if (activeGallery === "photos") {
        setPhotosOrder(prev => prev.filter(p => p.id !== image.id));
      } else {
        setJournalOrder(prev => prev.filter(p => p.id !== image.id));
      }

      toast.success("Image deleted from gallery");
    } catch (err) {
      toast.error("Failed to delete image");
    } finally {
      setDeletingImage(null);
    }
  };

  const currentOrder = activeGallery === "photos" ? photosOrder : journalOrder;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-secondary/30 border border-foreground/10 p-8 rounded-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-gold" />
              </div>
            </div>
            
            <h1 className="text-2xl font-semibold text-center mb-2">Admin Access</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enter password to manage gallery
            </p>
            
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-background border border-foreground/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold mb-4"
                autoFocus
              />
              
              {error && (
                <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
              )}
              
              <button
                type="submit"
                disabled={verifyPassword.isPending}
                className="w-full py-3 bg-gold text-background font-medium rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {verifyPassword.isPending ? "Verifying..." : "Access Editor"}
              </button>
            </form>
            
            <Link href="/" className="block text-center mt-6 text-sm text-muted-foreground hover:text-gold transition-colors">
              ← Back to site
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-foreground/10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-gold transition-colors">
                ← Back
              </Link>
              <h1 className="text-xl font-semibold">Gallery Editor</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {hasChanges && (
                <span className="text-sm text-gold">Unsaved changes</span>
              )}
              
              <button
                onClick={handleSave}
                disabled={!hasChanges || saveStatus === "saving"}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  hasChanges 
                    ? "bg-gold text-background hover:bg-gold/90" 
                    : "bg-foreground/10 text-muted-foreground cursor-not-allowed"
                }`}
              >
                {saveStatus === "saving" ? (
                  <>Saving...</>
                ) : saveStatus === "saved" ? (
                  <><Check className="w-4 h-4" /> Saved</>
                ) : saveStatus === "error" ? (
                  <><X className="w-4 h-4" /> Error</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Order</>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Gallery Tabs */}
      <div className="container py-6">
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setActiveGallery("photos")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeGallery === "photos"
                ? "bg-gold text-background"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            <Images className="w-5 h-5" />
            Photos ({photosOrder.length})
          </button>
          
          <button
            onClick={() => setActiveGallery("journal")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeGallery === "journal"
                ? "bg-gold text-background"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Journal ({journalOrder.length})
          </button>

          {/* Upload Button */}
          <div className="ml-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium cursor-pointer transition-all ${
                uploadingCount > 0
                  ? "bg-foreground/10 text-muted-foreground cursor-wait"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {uploadingCount > 0 ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading {uploadingCount}...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Upload Images
                </>
              )}
            </label>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Drag images to reorder. Click the trash icon to delete. Upload new images using the button above.
        </p>

        {/* Reorderable Grid */}
        <Reorder.Group
          axis="y"
          values={currentOrder}
          onReorder={handleReorder}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          {currentOrder.map((image, index) => (
            <Reorder.Item
              key={image.id}
              value={image}
              className="relative group cursor-grab active:cursor-grabbing"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary/30">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
                
                {/* Overlay with position number and actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                    <GripVertical className="w-6 h-6 text-white mb-1" />
                    <span className="text-white text-xs font-medium">#{index + 1}</span>
                  </div>
                </div>
                
                {/* Position badge */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{index + 1}</span>
                </div>

                {/* New badge for uploaded images */}
                {image.isNew && (
                  <div className="absolute top-2 right-10 px-2 py-0.5 bg-green-600 rounded text-white text-xs font-medium">
                    NEW
                  </div>
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(image);
                  }}
                  disabled={deletingImage === image.id}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  title="Delete image"
                >
                  {deletingImage === image.id ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {currentOrder.length === 0 && (
          <div className="text-center py-20">
            <Images className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No images in this gallery yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Upload images using the button above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
