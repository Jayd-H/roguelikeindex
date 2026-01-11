"use client";

import { useState, useRef } from "react";
import {
  XIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
  CheckIcon,
  Spinner,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddGameModal({ isOpen, onClose }: AddGameModalProps) {
  const [loading, setLoading] = useState(false);
  const [steamLoading, setSteamLoading] = useState(false);

  // We store either a File (upload) or string (URL from steam)
  const [images, setImages] = useState<{
    header: File | string | null;
    hero: File | string | null;
    logo: File | string | null;
  }>({
    header: null,
    hero: null,
    logo: null,
  });

  const [previews, setPreviews] = useState<{
    header: string | null;
    hero: string | null;
    logo: string | null;
  }>({
    header: null,
    hero: null,
    logo: null,
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    steamAppId: "",
    releaseDate: "",
    developer: "",
    publisher: "",
  });

  const headerInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (
    type: "header" | "hero" | "logo",
    file: File | undefined
  ) => {
    if (file) {
      setImages((prev) => ({ ...prev, [type]: file }));
      const url = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [type]: url }));
    }
  };

  const fetchSteamData = async () => {
    if (!formData.steamAppId) return;
    setSteamLoading(true);
    try {
      const res = await fetch(`/api/steam?appid=${formData.steamAppId}`);
      const json = await res.json();
      if (json.success) {
        setFormData((prev) => ({
          ...prev,
          title: json.data.title,
          description: json.data.description,
          releaseDate: json.data.releaseDate || "",
          developer: json.data.developer || "",
          publisher: json.data.publisher || "",
        }));

        // Set image URLs directly
        setImages({
          header: json.data.headerImage,
          hero: json.data.heroImage,
          logo: json.data.logo,
        });

        setPreviews({
          header: json.data.headerImage,
          hero: json.data.heroImage,
          logo: json.data.logo,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSteamLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("steamAppId", formData.steamAppId);
      payload.append("releaseDate", formData.releaseDate);
      payload.append("developer", formData.developer);
      payload.append("publisher", formData.publisher);

      // Append images (File or URL string)
      if (images.header) payload.append("header", images.header);
      if (images.hero) payload.append("hero", images.hero);
      if (images.logo) payload.append("logo", images.logo);

      const res = await fetch("/api/games", {
        method: "POST",
        body: payload,
      });

      if (res.ok) {
        const data = await res.json();
        onClose();
        window.location.href = `/games/${data.slug}`;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderImageUpload = (
    type: "header" | "hero" | "logo",
    label: string,
    ref: React.RefObject<HTMLInputElement | null>
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className="relative flex items-center justify-center w-full h-32 overflow-hidden border-2 border-dashed rounded-lg cursor-pointer border-border hover:bg-secondary/10 group transition-colors"
        onClick={() => ref.current?.click()}
      >
        {previews[type] ? (
          <>
            <Image
              src={previews[type]!}
              alt={label}
              fill
              className="object-cover opacity-80 group-hover:opacity-60 transition-opacity"
              unoptimized // Needed for Blob URLs or external Steam URLs
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
              <PencilSimpleIcon className="text-white" size={24} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadSimpleIcon size={24} />
            <span className="text-xs font-medium">Click to upload</span>
          </div>
        )}
        <input
          type="file"
          ref={ref}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleImageChange(type, e.target.files?.[0])}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-background border border-border/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Add New Game</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="cursor-pointer"
          >
            <XIcon size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4 p-4 bg-secondary/10 rounded-xl border border-border/50">
            <Label>Import from Steam (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="App ID (e.g. 123456)"
                value={formData.steamAppId}
                onChange={(e) =>
                  setFormData({ ...formData, steamAppId: e.target.value })
                }
              />
              <Button
                onClick={fetchSteamData}
                disabled={steamLoading}
                className="cursor-pointer"
              >
                {steamLoading ? (
                  <Spinner className="animate-spin mr-2" />
                ) : (
                  <DownloadSimpleIcon className="ml-2" />
                )}
                {steamLoading ? "Fetching..." : "Auto-fill"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Game Title"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="h-24 resize-none"
                placeholder="Brief summary of the game..."
              />
            </div>

            {renderImageUpload("header", "Header Image", headerInputRef)}
            {renderImageUpload("hero", "Hero Image", heroInputRef)}
            <div className="col-span-2">
              {renderImageUpload("logo", "Logo Image", logoInputRef)}
            </div>

            <div className="space-y-2">
              <Label>Release Date</Label>
              <Input
                value={formData.releaseDate}
                onChange={(e) =>
                  setFormData({ ...formData, releaseDate: e.target.value })
                }
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div className="space-y-2">
              <Label>Developer</Label>
              <Input
                value={formData.developer}
                onChange={(e) =>
                  setFormData({ ...formData, developer: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Publisher</Label>
              <Input
                value={formData.publisher}
                onChange={(e) =>
                  setFormData({ ...formData, publisher: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3 bg-secondary/5">
          <Button variant="ghost" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.title}
            className="cursor-pointer"
          >
            {loading ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { PencilSimpleIcon } from "@phosphor-icons/react";
