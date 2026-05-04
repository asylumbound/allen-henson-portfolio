/**
 * UNIFIED CMS EDITOR — /edit
 * Password-protected admin page consolidating all gallery + blog editing.
 * Tabs: Photos | Product | Journal | Duke | Blog
 * Password: &&77MAnila
 *
 * Features:
 * - Drag-and-drop image reordering (@dnd-kit) for all gallery tabs
 * - Image upload with Sharp web optimization to Supabase buckets
 * - Image deletion with confirmation
 * - Full blog editor: create/edit/delete/publish/draft/hero image
 * - Responsive: desktop, iPad, iPhone
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Save, Check, X, Images, BookOpen, Upload, Trash2, Plus, Loader2,
  Camera, PenTool, Eye, EyeOff, FileText, ChevronDown, Search,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, rectSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactMarkdown from "react-markdown";

// Import image arrays from gallery pages
import { photosImages } from "./Photos";
import { journalImages } from "./Journal";
import { productPhotographyImages } from "./ProductPhotography";
import { assetUrl } from "@/lib/assets";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "photos" | "product" | "journal" | "duke" | "blog";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category?: string;
  description?: string;
}

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  heroImage: string;
  published: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Duke images (local static) ─────────────────────────────────────────────

function buildDukeImages(): GalleryImage[] {
  const images: GalleryImage[] = [];
  for (let i = 1; i <= 403; i++) {
    const num = String(i).padStart(2, "0");
    images.push({
      id: `duke-${num}`,
      src: assetUrl(`/images/duke/duke-${num}.jpeg`),
      alt: `Duke Collection ${i}`,
    });
  }
  return images;
}

const dukeImagesDefault = buildDukeImages();

// ─── Sortable Image Component ────────────────────────────────────────────────

function SortableImage({
  image,
  index,
  onDelete,
  isDeleting,
}: {
  image: GalleryImage;
  index: number;
  onDelete: (img: GalleryImage) => void;
  isDeleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : ("auto" as any),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-square overflow-hidden cursor-grab active:cursor-grabbing group bg-secondary/30 border border-foreground/5 hover:border-gold/40 transition-colors"
    >
      <img
        src={image.src}
        alt={image.alt}
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      {/* Position badge */}
      <div className="absolute top-1 left-1 bg-black/70 text-white/70 text-[10px] px-1.5 py-0.5 font-mono">
        {index + 1}
      </div>
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(image); }}
        disabled={isDeleting}
        className="absolute top-1 right-1 w-6 h-6 bg-red-600/80 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isDeleting ? (
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        ) : (
          <Trash2 className="w-3 h-3 text-white" />
        )}
      </button>
      {/* Drag grip overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80">
          <circle cx="9" cy="5" r="1" fill="currentColor" />
          <circle cx="15" cy="5" r="1" fill="currentColor" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
          <circle cx="9" cy="19" r="1" fill="currentColor" />
          <circle cx="15" cy="19" r="1" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

// ─── Gallery Tab Component ───────────────────────────────────────────────────

function GalleryTab({
  images,
  setImages,
  galleryKey,
  password,
  showUpload,
  showSearch,
}: {
  images: GalleryImage[];
  setImages: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
  galleryKey: string;
  password: string;
  showUpload: boolean;
  showSearch?: boolean;
}) {
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveOrderMutation = trpc.gallery.saveOrder.useMutation();
  const uploadImageMutation = trpc.gallery.uploadImage.useMutation();
  const deleteImageMutation = trpc.gallery.deleteImage.useMutation();

  // DnD sensors
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  const imageIds = useMemo(() => images.map((img) => img.id), [images]);

  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;
    const q = searchQuery.toLowerCase();
    return images.filter(
      (img) =>
        img.alt.toLowerCase().includes(q) ||
        img.src.toLowerCase().includes(q) ||
        (img.category && img.category.toLowerCase().includes(q)) ||
        (img.description && img.description.toLowerCase().includes(q))
    );
  }, [images, searchQuery]);

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = imageIds.indexOf(active.id as string);
    const newIndex = imageIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setImages((prev) => arrayMove(prev, oldIndex, newIndex));
    setHasChanges(true);
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      if (galleryKey === "duke") {
        // Duke uses REST API, not tRPC
        const order = images.map((img) => {
          const filename = img.src.split("/").pop() || "";
          return filename.replace(/\.(jpeg|jpg|webp|png)$/, "");
        });
        const res = await fetch("/api/duke/save-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, order }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to save");
      } else {
        const order = images.map((p) => p.src);
        await saveOrderMutation.mutateAsync({
          gallery: galleryKey as "photos" | "journal" | "product-photography",
          order,
          password,
        });
      }
      setSaveStatus("saved");
      setHasChanges(false);
      toast.success("Order saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err: any) {
      setSaveStatus("error");
      toast.error(err.message || "Failed to save");
    }
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm(`Delete this image?\n\n${image.alt}`)) return;
    setDeletingId(image.id);
    try {
      if (galleryKey === "duke") {
        const imageName = image.src.split("/").pop()?.replace(/\.(jpeg|jpg|webp|png)$/, "") || "";
        const res = await fetch("/api/duke/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, imageName }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to delete");
      } else {
        await deleteImageMutation.mutateAsync({
          gallery: galleryKey as "photos" | "journal" | "product-photography",
          imageSrc: image.src,
          password,
        });
      }
      setImages((prev) => prev.filter((p) => p.id !== image.id));
      toast.success("Image deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingCount(files.length);
    const uploaded: GalleryImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); continue; }
      if (file.size > 15 * 1024 * 1024) { toast.error(`${file.name} too large (max 15MB)`); continue; }

      try {
        const base64 = await fileToBase64(file);
        const result = await uploadImageMutation.mutateAsync({
          gallery: galleryKey as "photos" | "journal" | "product-photography",
          fileName: file.name,
          fileData: base64,
          contentType: file.type,
          password,
        });
        uploaded.push({
          id: `new-${Date.now()}-${i}`,
          src: result.url,
          alt: (result as any).altText?.altText || file.name.replace(/\.[^/.]+$/, ""),
        });
        toast.success(`Uploaded ${file.name}`);
      } catch (err: any) {
        toast.error(`Failed: ${file.name}`);
      }
    }

    if (uploaded.length > 0) {
      setImages((prev) => [...uploaded, ...prev]);
      setHasChanges(true);
    }
    setUploadingCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const activeDragImage = activeId ? images.find((img) => img.id === activeId) : null;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {showUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id={`upload-${galleryKey}`}
            />
            <label
              htmlFor={`upload-${galleryKey}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                uploadingCount > 0
                  ? "bg-foreground/10 text-muted-foreground cursor-wait"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {uploadingCount > 0 ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading {uploadingCount}...</>
              ) : (
                <><Plus className="w-4 h-4" /> Upload</>
              )}
            </label>
          </>
        )}

        {showSearch && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-secondary/30 border border-foreground/10 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{images.length} images</span>
          {hasChanges && <span className="text-xs text-gold">Unsaved changes</span>}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === "saving"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              hasChanges
                ? "bg-gold text-background hover:bg-gold/90"
                : "bg-foreground/10 text-muted-foreground cursor-not-allowed"
            }`}
          >
            {saveStatus === "saving" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving</>
            ) : saveStatus === "saved" ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : (
              <><Save className="w-4 h-4" /> Save Order</>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Drag to reorder. Hover to delete. {showUpload ? "Upload adds to the top." : ""}
      </p>

      {/* DnD Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={searchQuery ? filteredImages.map((i) => i.id) : imageIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {(searchQuery ? filteredImages : images).map((image, index) => (
              <SortableImage
                key={image.id}
                image={image}
                index={index}
                onDelete={handleDelete}
                isDeleting={deletingId === image.id}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay adjustScale={false}>
          {activeDragImage ? (
            <div className="aspect-square overflow-hidden border-2 border-gold shadow-2xl opacity-90 w-24">
              <img src={activeDragImage.src} alt="Dragging" className="w-full h-full object-cover" draggable={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {images.length === 0 && (
        <div className="text-center py-16">
          <Images className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No images yet.</p>
        </div>
      )}
    </div>
  );
}

// ─── Blog Editor Component ───────────────────────────────────────────────────

function BlogTab({ password }: { password: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [published, setPublished] = useState(0);

  const { data: blogPosts, refetch, isLoading } = trpc.blog.listAll.useQuery({ password });
  const createMutation = trpc.blog.create.useMutation();
  const updateMutation = trpc.blog.update.useMutation();
  const deleteMutation = trpc.blog.delete.useMutation();
  const togglePublishMutation = trpc.blog.togglePublish.useMutation();

  useEffect(() => {
    if (blogPosts) setPosts(blogPosts as BlogPost[]);
  }, [blogPosts]);

  const resetForm = () => {
    setTitle(""); setSlug(""); setExcerpt(""); setContent(""); setHeroImage(""); setPublished(0);
    setEditingPost(null); setIsCreating(false); setShowPreview(false);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const startEdit = (post: BlogPost) => {
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || "");
    setContent(post.content || "");
    setHeroImage(post.heroImage || "");
    setPublished(post.published);
    setEditingPost(post);
    setIsCreating(false);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 80);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isCreating && !editingPost) {
      setSlug(generateSlug(val));
    }
  };

  const handleSavePost = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!slug.trim()) { toast.error("Slug is required"); return; }
    if (!content.trim()) { toast.error("Content is required"); return; }

    try {
      if (editingPost) {
        await updateMutation.mutateAsync({
          password,
          id: editingPost.id,
          title,
          slug,
          excerpt,
          content,
          heroImage,
          published,
        });
        toast.success("Post updated");
      } else {
        await createMutation.mutateAsync({
          password,
          title,
          slug,
          excerpt,
          content,
          heroImage,
          published,
        });
        toast.success("Post created");
      }
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save post");
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync({ password, id: post.id });
      toast.success("Post deleted");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    const newStatus = post.published === 1 ? 0 : 1;
    try {
      await togglePublishMutation.mutateAsync({ password, id: post.id, published: newStatus });
      toast.success(newStatus === 1 ? "Published" : "Unpublished");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle");
    }
  };

  // Editor form
  if (isCreating || editingPost) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{editingPost ? "Edit Post" : "New Post"}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-foreground/10 hover:border-gold/40 transition-colors"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? "Edit" : "Preview"}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-foreground/10 hover:border-red-400/40 text-muted-foreground hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>

        {showPreview ? (
          <div className="bg-secondary/20 border border-foreground/10 rounded-lg p-6">
            {heroImage && (
              <img src={heroImage} alt="Hero" className="w-full max-h-64 object-cover rounded-lg mb-4" />
            )}
            <h1 className="text-2xl font-bold mb-2">{title || "Untitled"}</h1>
            {excerpt && <p className="text-muted-foreground mb-4 italic">{excerpt}</p>}
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Post title"
                className="w-full px-3 py-2 bg-secondary/30 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">SLUG</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-url-slug"
                className="w-full px-3 py-2 bg-secondary/30 border border-foreground/10 rounded-lg text-sm font-mono focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">EXCERPT</label>
              <input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description..."
                className="w-full px-3 py-2 bg-secondary/30 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">HERO IMAGE URL</label>
              <input
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-secondary/30 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:border-gold"
              />
              {heroImage && (
                <img src={heroImage} alt="Hero preview" className="mt-2 h-24 object-cover rounded" />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CONTENT (Markdown)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post in Markdown..."
                rows={16}
                className="w-full px-3 py-2 bg-secondary/30 border border-foreground/10 rounded-lg text-sm font-mono focus:outline-none focus:border-gold resize-y"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published === 1}
                  onChange={(e) => setPublished(e.target.checked ? 1 : 0)}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-sm">Publish immediately</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSavePost}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gold text-background rounded-lg font-medium text-sm hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> {editingPost ? "Update Post" : "Create Post"}</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Post list
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">{posts.length} posts</span>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No blog posts yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 p-3 bg-secondary/20 border border-foreground/5 rounded-lg hover:border-foreground/10 transition-colors"
            >
              {post.heroImage && (
                <img src={post.heroImage} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate">{post.title}</h4>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      post.published === 1
                        ? "bg-green-600/20 text-green-400"
                        : "bg-yellow-600/20 text-yellow-400"
                    }`}
                  >
                    {post.published === 1 ? "LIVE" : "DRAFT"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{post.excerpt || post.slug}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleTogglePublish(post)}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                  title={post.published === 1 ? "Unpublish" : "Publish"}
                >
                  {post.published === 1 ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-green-400" />
                  )}
                </button>
                <button
                  onClick={() => startEdit(post)}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                  title="Edit"
                >
                  <PenTool className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDeletePost(post)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = (error) => reject(error);
  });
}

// ─── Tab Config ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "photos", label: "Photos", icon: Camera },
  { id: "product", label: "Product", icon: Images },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "duke", label: "Duke", icon: Lock },
  { id: "blog", label: "Blog", icon: FileText },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Edit() {
  // Prevent indexing
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("photos");

  // Gallery state
  const [photosOrder, setPhotosOrder] = useState<GalleryImage[]>([]);
  const [productOrder, setProductOrder] = useState<GalleryImage[]>([]);
  const [journalOrder, setJournalOrder] = useState<GalleryImage[]>([]);
  const [dukeOrder, setDukeOrder] = useState<GalleryImage[]>([]);

  const verifyPassword = trpc.admin.verifyPassword.useMutation();

  // Fetch saved orders
  const { data: photosOrderData } = trpc.gallery.getOrder.useQuery({ gallery: "photos" }, { enabled: isAuthenticated });
  const { data: journalOrderData } = trpc.gallery.getOrder.useQuery({ gallery: "journal" }, { enabled: isAuthenticated });
  const { data: productOrderData } = trpc.gallery.getOrder.useQuery({ gallery: "product-photography" }, { enabled: isAuthenticated });

  // Initialize Photos
  useEffect(() => {
    const defaults: GalleryImage[] = photosImages.map((img, idx) => ({
      id: `photo-${idx}`,
      src: img.src,
      alt: img.alt,
    }));
    if (photosOrderData?.order) {
      const srcMap = new Map(defaults.map((d) => [d.src, d]));
      const ordered = photosOrderData.order
        .map((src: string) => srcMap.get(src) || { id: `up-${src.slice(-20)}`, src, alt: "Uploaded image" })
        .filter(Boolean) as GalleryImage[];
      const remaining = defaults.filter((d) => !photosOrderData.order!.includes(d.src));
      setPhotosOrder([...ordered, ...remaining]);
    } else {
      setPhotosOrder(defaults);
    }
  }, [photosOrderData]);

  // Initialize Journal
  useEffect(() => {
    const defaults: GalleryImage[] = journalImages.map((img, idx) => ({
      id: `journal-${idx}`,
      src: img.src,
      alt: `Journal ${idx + 1}`,
    }));
    if (journalOrderData?.order) {
      const srcMap = new Map(defaults.map((d) => [d.src, d]));
      const ordered = journalOrderData.order
        .map((src: string) => srcMap.get(src) || { id: `up-${src.slice(-20)}`, src, alt: "Uploaded image" })
        .filter(Boolean) as GalleryImage[];
      const remaining = defaults.filter((d) => !journalOrderData.order!.includes(d.src));
      setJournalOrder([...ordered, ...remaining]);
    } else {
      setJournalOrder(defaults);
    }
  }, [journalOrderData]);

  // Initialize Product
  useEffect(() => {
    const defaults: GalleryImage[] = productPhotographyImages.map((img, idx) => ({
      id: `product-${idx}`,
      src: img.src,
      alt: img.alt,
      category: img.category,
      description: img.description,
    }));
    if (productOrderData?.order) {
      const srcMap = new Map(defaults.map((d) => [d.src, d]));
      const ordered = productOrderData.order
        .map((src: string) => srcMap.get(src) || { id: `up-${src.slice(-20)}`, src, alt: "Custom image" })
        .filter(Boolean) as GalleryImage[];
      const remaining = defaults.filter((d) => !productOrderData.order!.includes(d.src));
      setProductOrder([...ordered, ...remaining]);
    } else {
      setProductOrder(defaults);
    }
  }, [productOrderData]);

  // Initialize Duke (uses REST API for order)
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await fetch("/api/duke/get-order");
        const data = await res.json();
        if (data.order && Array.isArray(data.order)) {
          const imageMap = new Map(
            dukeImagesDefault.map((img) => {
              const name = img.src.split("/").pop()?.replace(/\.(jpeg|jpg|webp|png)$/, "") || "";
              return [name, img];
            })
          );
          const reordered = data.order
            .map((name: string) => imageMap.get(name))
            .filter(Boolean) as GalleryImage[];
          const orderedSet = new Set(data.order);
          const remaining = dukeImagesDefault.filter((img) => {
            const name = img.src.split("/").pop()?.replace(/\.(jpeg|jpg|webp|png)$/, "") || "";
            return !orderedSet.has(name);
          });
          setDukeOrder([...reordered, ...remaining]);
        } else {
          setDukeOrder(dukeImagesDefault);
        }
      } catch {
        setDukeOrder(dukeImagesDefault);
      }
    })();
  }, [isAuthenticated]);

  // Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await verifyPassword.mutateAsync({ password });
      setIsAuthenticated(true);
      sessionStorage.setItem("edit-password", password);
    } catch {
      setError("Invalid password");
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("edit-password");
    if (stored) {
      setPassword(stored);
      verifyPassword
        .mutateAsync({ password: stored })
        .then(() => setIsAuthenticated(true))
        .catch(() => sessionStorage.removeItem("edit-password"));
    }
  }, []);

  // ─── Login Screen ──────────────────────────────────────────────────────────
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
            <h1 className="text-2xl font-semibold text-center mb-2">CMS Editor</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Manage galleries and blog posts
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
              {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
              <button
                type="submit"
                disabled={verifyPassword.isPending}
                className="w-full py-3 bg-gold text-background rounded-lg font-medium transition-colors hover:bg-gold/90 disabled:opacity-50"
              >
                {verifyPassword.isPending ? "Verifying..." : "Access Editor"}
              </button>
            </form>
            <Link
              href="/"
              className="block text-center mt-6 text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              ← Back to site
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Authenticated Editor ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-foreground/10">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-gold transition-colors">
                ← Back
              </Link>
              <h1 className="text-lg font-semibold hidden sm:block">CMS Editor</h1>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem("edit-password");
                setIsAuthenticated(false);
                setPassword("");
              }}
              className="text-xs text-muted-foreground hover:text-gold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container py-4">
        <div className="flex flex-wrap gap-2 mb-6 border-b border-foreground/5 pb-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-gold text-background"
                    : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "photos" && (
          <GalleryTab
            images={photosOrder}
            setImages={setPhotosOrder}
            galleryKey="photos"
            password={password}
            showUpload={true}
          />
        )}
        {activeTab === "product" && (
          <GalleryTab
            images={productOrder}
            setImages={setProductOrder}
            galleryKey="product-photography"
            password={password}
            showUpload={true}
            showSearch={true}
          />
        )}
        {activeTab === "journal" && (
          <GalleryTab
            images={journalOrder}
            setImages={setJournalOrder}
            galleryKey="journal"
            password={password}
            showUpload={true}
            showSearch={true}
          />
        )}
        {activeTab === "duke" && (
          <GalleryTab
            images={dukeOrder}
            setImages={setDukeOrder}
            galleryKey="duke"
            password={password}
            showUpload={false}
            showSearch={true}
          />
        )}
        {activeTab === "blog" && <BlogTab password={password} />}
      </div>
    </div>
  );
}
