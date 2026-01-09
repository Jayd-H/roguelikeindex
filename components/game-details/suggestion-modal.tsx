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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
        }, 1500);
      } else {
        const json = await res.json();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-background border border-border/50 rounded-xl p-6 shadow-2xl relative animate-in zoom-in-95">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4"
        >
          <XIcon />
        </Button>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-300">
            <CheckCircleIcon
              size={64}
              weight="fill"
              className="text-green-500 mb-4"
            />
            <h3 className="text-xl font-bold text-foreground">
              Suggestion Submitted!
            </h3>
            <p className="text-muted-foreground mt-2 text-center">
              Thanks for helping improve the database.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">{getTitle()}</h2>

            {(field === "metaProgression" || field === "steamDeckVerified") && (
              <p className="mb-6 text-muted-foreground">
                Current status:{" "}
                <span className="font-bold text-foreground">
                  {currentData ? "Yes" : "No"}
                </span>
                . Do you want to suggest changing this to{" "}
                <span className="font-bold text-foreground">
                  {!currentData ? "Yes" : "No"}
                </span>
                ?
              </p>
            )}

            {field === "tags" && type === "add" && (
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Tag Name</Label>
                  <Input
                    placeholder="e.g. Pixel Art"
                    onChange={(e) => setFormData({ name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {field === "tags" && type === "remove" && safeData && (
              <p className="mb-6 text-muted-foreground">
                Are you sure you want to suggest removing the tag{" "}
                <span className="font-bold text-foreground">
                  {String(safeData.name)}
                </span>
                ?
              </p>
            )}

            {field === "pricing" && type !== "remove" && (
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    onValueChange={(v) =>
                      setFormData({ ...formData, platform: v })
                    }
                    defaultValue={safeData?.platform as string}
                    disabled={type === "edit"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PC">PC</SelectItem>
                      <SelectItem value="PlayStation">PlayStation</SelectItem>
                      <SelectItem value="Xbox">Xbox</SelectItem>
                      <SelectItem value="Switch">Switch</SelectItem>
                      <SelectItem value="Mobile">Mobile</SelectItem>
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
                  />
                </div>
              </div>
            )}

            {field === "externalRatings" && type !== "remove" && (
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Source Name</Label>
                  <Input
                    placeholder="e.g. IGN"
                    defaultValue={safeData?.source as string}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value })
                    }
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
                  />
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit Suggestion"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
