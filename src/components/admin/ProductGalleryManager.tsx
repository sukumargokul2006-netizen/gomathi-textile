import { useState } from "react";
import { ArrowLeft, ArrowRight, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductImages, useProductImageMutations } from "@/lib/shop";
import { uploadProductImage } from "@/lib/admin";

export function ProductGalleryManager({ productId }: { productId?: string | undefined }) {
  const { data: images } = useProductImages(productId);
  const { addImage, removeImage, reorder } = useProductImageMutations(productId);
  const [uploading, setUploading] = useState(false);

  if (!productId) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
        Save the product first, then add gallery images here.
      </div>
    );
  }

  const list = images ?? [];

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    try {
      let next = list.length;
      for (const file of files) {
        const url = await uploadProductImage(file);
        await addImage.mutateAsync({ url, sortOrder: next });
        next += 1;
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    const item = next[index];
    if (!item) return;
    next.splice(index, 1);
    next.splice(target, 0, item);
    reorder.mutate(next.map((img, i) => ({ id: img.id, sort_order: i })));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-56">
          <Label htmlFor="p-gallery" className="sr-only">Gallery images</Label>
          <Input
            id="p-gallery"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple
            disabled={uploading}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length) void uploadFiles(files);
            }}
          />
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Upload className="h-3 w-3" /> {uploading ? "Uploading…" : "Select multiple images at once"}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No gallery images yet.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {list.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-md border border-border">
              <img src={img.image_url} alt={img.alt_text ?? `Gallery image ${i + 1}`} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between p-1">
                <Button variant="ghost" size="icon" aria-label="Move left" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Move right" onClick={() => move(i, 1)} disabled={i === list.length - 1}>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Remove image" onClick={() => removeImage.mutate(img.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
