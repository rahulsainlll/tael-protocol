"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button, cn } from "@tael/ui";
import { CapabilityLogo } from "./capability-logo";

/** Read → cover-crop to a square → compress to a small WebP data URL (~5-10KB). */
function fileToOptimizedDataUrl(file: File, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("bad image"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/webp", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Logo uploader: one dropzone. Upload an image (click or drag); it's resized and
 * compressed client-side to a compact data URL, so it stores inline with no
 * storage infra. Empty → dropzone; filled → preview + replace/remove.
 */
export function LogoField({
  value,
  kind,
  name,
  onChange,
}: {
  value: string;
  kind: string;
  name: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 5_000_000) {
      setError("Image is too large (max 5MB).");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      onChange(await fileToOptimizedDataUrl(file));
    } catch {
      setError("Could not process that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-4 rounded-xl border p-3">
          <CapabilityLogo src={value} name={name} kind={kind} className="h-14 w-14" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Logo added</p>
            <p className="text-xs text-muted-foreground">This shows on your listing.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove logo"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center outline-none transition-colors duration-150 ease-out",
            "hover:border-foreground/30 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring",
            dragging && "border-foreground/40 bg-muted/40",
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium">
            {busy ? "Processing…" : "Click to upload or drag and drop"}
          </span>
          <span className="text-xs text-muted-foreground">PNG, JPG, or SVG · max 5MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
