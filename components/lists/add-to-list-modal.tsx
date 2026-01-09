"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  XIcon,
  PlusIcon,
  GameControllerIcon,
  StarIcon,
  BookmarkSimpleIcon,
  TrashIcon,
  PencilSimpleIcon,
  CheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { containsProfanity } from "@/lib/profanity";

interface List {
  id: string;
  title: string;
  description: string;
  gameCount: number;
  saveCount: number;
  averageRating: number | null;
  previewImages: string[];
  hasGame: boolean;
}

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
}

export function AddToListModal({
  isOpen,
  onClose,
  gameId,
}: AddToListModalProps) {
  const { user } = useAuth();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"select" | "create" | "edit">("select");
  const [editingList, setEditingList] = useState<List | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/manage?gameId=${gameId}`);
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (isOpen) {
      setView("select");
      setFormData({ title: "", description: "" });
      setDeleteConfirmId(null);
      setEditingList(null);
      setError("");
      if (user) {
        fetchLists();
      }
    }
  }, [isOpen, user, gameId, fetchLists]);

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (containsProfanity(formData.title)) {
      setError("Title contains inappropriate language");
      return false;
    }
    if (containsProfanity(formData.description)) {
      setError("Description contains inappropriate language");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    setError("");
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/lists/manage", {
        method: "POST",
        body: JSON.stringify({ ...formData, gameId }),
      });
      if (res.ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setError("");
    if (!editingList || !validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/lists/${editingList.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchLists();
        setView("select");
        setEditingList(null);
        setFormData({ title: "", description: "" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLists((prev) => prev.filter((l) => l.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddGame = async (listId: string, hasGame: boolean) => {
    if (hasGame) return;

    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, hasGame: true } : l))
    );

    try {
      await fetch(`/api/lists/${listId}/add`, {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });
      setTimeout(() => onClose(), 500);
    } catch (e) {
      console.error(e);
      setLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, hasGame: false } : l))
      );
    }
  };

  const openEdit = (list: List, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingList(list);
    setFormData({ title: list.title, description: list.description || "" });
    setError("");
    setView("edit");
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 relative">
        <div className="flex text-muted-foreground/20">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} size={12} weight="fill" />
          ))}
        </div>
        <div
          className="absolute top-0 left-0 flex overflow-hidden text-yellow-500"
          style={{ width: `${(rating / 5) * 100}%` }}
        >
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} size={12} weight="fill" className="shrink-0" />
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center duration-200 cursor-pointer bg-black/60 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-background border border-border/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-secondary/5 shrink-0">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            {view === "select" && (
              <>
                <BookmarkSimpleIcon className="text-primary" weight="fill" />{" "}
                Save to Collection
              </>
            )}
            {view === "create" && (
              <>
                <PlusIcon className="text-primary" weight="bold" /> Create New
                Collection
              </>
            )}
            {view === "edit" && (
              <>
                <PencilSimpleIcon className="text-primary" weight="bold" /> Edit
                Collection
              </>
            )}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8 rounded-full cursor-pointer hover:bg-secondary/50"
          >
            <XIcon size={16} />
          </Button>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          {view === "select" ? (
            <>
              <div className="p-4 border-b border-border/40 bg-background/50">
                <Button
                  className="justify-start w-full gap-4 transition-all border border-dashed cursor-pointer text-muted-foreground hover:text-foreground h-14 bg-secondary/30 hover:bg-secondary/60 border-border/60 hover:border-primary/50 group"
                  variant="ghost"
                  onClick={() => {
                    setFormData({ title: "", description: "" });
                    setError("");
                    setView("create");
                  }}
                >
                  <div className="flex items-center justify-center w-8 h-8 transition-colors border rounded-full bg-background border-border group-hover:border-primary/50 group-hover:text-primary">
                    <PlusIcon size={16} weight="bold" />
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      Create New Collection
                    </span>
                    <span className="text-[10px] opacity-70">
                      Add this game to a brand new list
                    </span>
                  </div>
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-secondary/30 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : lists.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/30">
                      <BookmarkSimpleIcon size={24} className="opacity-50" />
                    </div>
                    <p>You haven&apos;t created any lists yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lists.map((list) => (
                      <div
                        key={list.id}
                        className={cn(
                          "relative group rounded-xl border border-transparent transition-all overflow-hidden",
                          list.hasGame
                            ? "bg-primary/5 border-primary/20"
                            : "bg-secondary/10 hover:bg-secondary/20 hover:border-border/60 cursor-pointer"
                        )}
                        onClick={() =>
                          !list.hasGame &&
                          !deleteConfirmId &&
                          handleAddGame(list.id, list.hasGame)
                        }
                      >
                        {deleteConfirmId === list.id ? (
                          <div className="absolute inset-0 z-20 flex items-center justify-between px-6 duration-200 bg-destructive/10 backdrop-blur-sm animate-in fade-in">
                            <div className="flex items-center gap-3 text-sm font-bold text-destructive">
                              <WarningCircleIcon size={24} weight="fill" />
                              Delete this list?
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 cursor-pointer hover:bg-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 shadow-sm cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(list.id);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        <div className="relative z-10 flex items-center gap-4 p-3">
                          {/* Overlapping Cards Preview */}
                          <div className="relative w-12 h-12 mr-2 shrink-0">
                            {list.previewImages.length > 0 ? (
                              list.previewImages.slice(0, 3).map((img, i) => (
                                <div
                                  key={i}
                                  className="absolute top-0 left-0 w-12 h-12 overflow-hidden border-2 rounded-lg shadow-sm border-background bg-zinc-900"
                                  style={{
                                    transform: `translateX(${
                                      i * 6
                                    }px) translateY(${i * -2}px) rotate(${
                                      i * 4
                                    }deg)`,
                                    zIndex: i,
                                  }}
                                >
                                  <Image
                                    src={img}
                                    alt=""
                                    fill
                                    className="object-cover opacity-80"
                                    unoptimized
                                  />
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center justify-center w-12 h-12 border-2 rounded-lg bg-secondary/40 border-background">
                                <GameControllerIcon
                                  size={20}
                                  className="opacity-20"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pl-2">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={cn(
                                  "font-bold truncate text-sm",
                                  list.hasGame
                                    ? "text-primary"
                                    : "text-foreground"
                                )}
                              >
                                {list.title}
                              </h3>
                              {list.hasGame && (
                                <CheckIcon
                                  weight="bold"
                                  className="text-xs text-primary shrink-0"
                                />
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                              {list.averageRating !== null &&
                                list.averageRating > 0 && (
                                  <div className="flex items-center gap-1.5 bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-600">
                                    {renderStars(list.averageRating)}
                                    <span>{list.averageRating.toFixed(1)}</span>
                                  </div>
                                )}
                              <span className="flex items-center gap-1">
                                <GameControllerIcon weight="fill" />{" "}
                                {list.gameCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookmarkSimpleIcon weight="fill" />{" "}
                                {list.saveCount}
                              </span>
                            </div>
                          </div>

                          {!list.hasGame && !deleteConfirmId && (
                            <div className="absolute flex gap-1 p-1 transition-opacity -translate-y-1/2 border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 right-3 top-1/2 bg-background/80 backdrop-blur-sm border-border/50">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="cursor-pointer h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={(e) => openEdit(list, e)}
                              >
                                <PencilSimpleIcon size={14} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="cursor-pointer h-7 w-7 text-muted-foreground hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(list.id);
                                }}
                              >
                                <TrashIcon size={14} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex flex-col flex-1 p-6 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>List Name</Label>
                  <Input
                    placeholder="e.g. Best Deckbuilders 2026"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="h-11 bg-secondary/20"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Description{" "}
                    <span className="ml-1 font-normal text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>
                  <Textarea
                    placeholder="What makes this collection special?"
                    className="h-32 leading-relaxed resize-none bg-secondary/20"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                {error && (
                  <div className="px-1 text-sm font-medium text-red-500">
                    {error}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-auto border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => setView("select")}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={view === "create" ? handleCreate : handleUpdate}
                  disabled={!formData.title.trim() || submitting}
                  className="px-8 cursor-pointer"
                >
                  {submitting
                    ? "Saving..."
                    : view === "create"
                    ? "Create & Add Game"
                    : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
