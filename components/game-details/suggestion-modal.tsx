"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XIcon, CheckCircleIcon } from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { containsProfanity } from "@/lib/profanity";

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameSlug: string;
  field: string;
  currentData?: unknown;
  type: "toggle" | "add" | "edit" | "remove";
}

interface SuggestionPayload {
  targetField: string;
  operation: string;
  originalValue: unknown;
  suggestedValue: unknown;
}

export function SuggestionModal({
  isOpen,
  onClose,
  gameSlug,
  field,
  currentData,
  type,
}: SuggestionModalProps) {
  const [formData, setFormData] = useState<
    Record<string, string | number | boolean>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const validateInput = () => {
    const values = Object.values(formData);
    for (const val of values) {
      if (typeof val === "string" && containsProfanity(val)) {
        return "Please remove inappropriate content.";
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const profanityError = validateInput();
    if (profanityError) {
      setError(profanityError);
      return;
    }

    setLoading(true);

    const payload: SuggestionPayload = {
      targetField: field,
      operation: type,
      originalValue: currentData,
      suggestedValue: null,
    };

    if (field === "metaProgression" || field === "steamDeckVerified") {
      payload.suggestedValue = !currentData;
    } else if (type === "remove") {
      payload.suggestedValue = currentData;
    } else {
      payload.suggestedValue = formData;
    }

    try {
      const res = await fetch(`/api/games/${gameSlug}/suggest`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        if (json.status === "approved") {
          // If admin instant approval, reload page after delay
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setTimeout(() => {
            onClose();
            setIsSuccess(false);
          }, 2000);
        }
      } else {
        setError(json.error || "Failed to submit");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (field === "metaProgression") return "Suggest Meta Progression Change";
    if (field === "steamDeckVerified") return "Suggest Deck Verified Status";
    if (field === "pricing")
      return `${type === "add" ? "Add" : "Edit"} Storefront`;
    if (field === "externalRatings")
      return `${type === "add" ? "Add" : "Edit"} External Review`;
    if (field === "tags") return `${type === "add" ? "Add" : "Remove"} Tag`;
    return "Suggest Edit";
  };

  const safeData = currentData as
    | Record<string, string | number | undefined>
    | undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full hover:bg-secondary/50 cursor-pointer"
        >
          <XIcon size={20} />
        </Button>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon
                size={32}
                weight="fill"
                className="text-green-500"
              />
            </div>
            <h3 className="text-xl font-bold text-foreground">Submitted!</h3>
            <p className="text-muted-foreground mt-2 text-center text-sm">
              Your suggestion has been recorded.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-6 tracking-tight">
              {getTitle()}
            </h2>

            {(field === "metaProgression" || field === "steamDeckVerified") && (
              <p className="mb-8 text-muted-foreground text-sm leading-relaxed">
                Current status:{" "}
                <span className="font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded">
                  {currentData ? "Yes" : "No"}
                </span>
                . <br />
                Do you want to suggest changing this to{" "}
                <span className="font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded">
                  {!currentData ? "Yes" : "No"}
                </span>
                ?
              </p>
            )}

            {field === "tags" && type === "add" && (
              <div className="space-y-5 mb-8">
                <div className="space-y-2">
                  <Label>Tag Name</Label>
                  <Input
                    placeholder="e.g. Pixel Art"
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="bg-secondary/20 border-white/10 h-11"
                  />
                </div>
              </div>
            )}

            {field === "tags" && type === "remove" && safeData && (
              <p className="mb-8 text-muted-foreground text-sm">
                Are you sure you want to suggest removing the tag{" "}
                <span className="font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded">
                  {String(safeData.name)}
                </span>
                ?
              </p>
            )}

            {field === "pricing" && type !== "remove" && (
              <div className="space-y-5 mb-8">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    onValueChange={(v) =>
                      setFormData({ ...formData, platform: v })
                    }
                    defaultValue={safeData?.platform as string}
                    disabled={type === "edit"}
                  >
                    <SelectTrigger className="bg-secondary/20 border-white/10 h-11 cursor-pointer">
                      <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PC" className="cursor-pointer">
                        PC
                      </SelectItem>
                      <SelectItem
                        value="PlayStation"
                        className="cursor-pointer"
                      >
                        PlayStation
                      </SelectItem>
                      <SelectItem value="Xbox" className="cursor-pointer">
                        Xbox
                      </SelectItem>
                      <SelectItem value="Switch" className="cursor-pointer">
                        Switch
                      </SelectItem>
                      <SelectItem value="Mobile" className="cursor-pointer">
                        Mobile
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <Input
                    placeholder="e.g. Steam"
                    defaultValue={safeData?.store as string}
                    onChange={(e) =>
                      setFormData({ ...formData, store: e.target.value })
                    }
                    className="bg-secondary/20 border-white/10 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    placeholder="$19.99"
                    defaultValue={safeData?.price as string}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="bg-secondary/20 border-white/10 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://..."
                    defaultValue={safeData?.url as string}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="bg-secondary/20 border-white/10 h-11"
                  />
                </div>
              </div>
            )}

            {field === "externalRatings" && type !== "remove" && (
              <div className="space-y-5 mb-8">
                <div className="space-y-2">
                  <Label>Source Name</Label>
                  <Input
                    placeholder="e.g. IGN"
                    defaultValue={safeData?.source as string}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                    className="bg-secondary/20 border-white/10 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Score</Label>
                  <Input
                    placeholder="9/10"
                    defaultValue={safeData?.score as string}
                    onChange={(e) =>
                      setFormData({ ...formData, score: e.target.value })
                    }
                    className="bg-secondary/20 border-white/10 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://..."
                    defaultValue={safeData?.url as string}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="bg-secondary/20 border-white/10 h-11"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm font-medium mb-4 px-3 py-2 bg-red-500/10 rounded-md border border-red-500/20">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                className="cursor-pointer hover:bg-secondary/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="cursor-pointer font-semibold px-6"
              >
                {loading ? "Submitting..." : "Submit Suggestion"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
