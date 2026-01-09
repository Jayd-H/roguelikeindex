"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/components/auth-provider";
import {
  MagnifyingGlassIcon,
  BookmarkSimpleIcon,
  StarIcon,
  UserIcon,
  PencilSimpleIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Game, Tag } from "@/lib/types";
import { GameCard } from "@/components/games/game-card";
import { GameFilters } from "@/components/games/game-filters";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface ListData {
  id: string;
  title: string;
  description: string;
  creator: string;
  averageRating: number;
  isSaved: boolean;
  userRating: number;
  isOwner: boolean;
}

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { requireAuth, refreshUser } = useAuth();

  const [listData, setListData] = useState<ListData | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCombat, setSelectedCombat] = useState<string[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<string[]>([]);
  const [minRating, setMinRating] = useState([0]);
  const [complexity, setComplexity] = useState([0]);
  const [metaProgression, setMetaProgression] = useState(false);
  const [deckVerified, setDeckVerified] = useState(false);

  // Edit State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal State
  const [deleteListModalOpen, setDeleteListModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAvailableTags(data);
      })
      .catch(console.error);
  }, []);

  const fetchListGames = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedTags.length) params.append("tags", selectedTags.join(","));
      if (selectedCombat.length)
        params.append("combat", selectedCombat.join(","));
      if (selectedNarrative.length)
        params.append("narrative", selectedNarrative.join(","));
      if (minRating[0] > 0) params.append("rating", minRating[0].toString());
      if (complexity[0] > 0)
        params.append("complexity", complexity[0].toString());
      if (metaProgression) params.append("meta", "true");
      if (deckVerified) params.append("deck", "true");

      const res = await fetch(`/api/lists/detail/${slug}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch list");

      const data = await res.json();
      setListData(data.list);
      setGames(data.games || []);

      if (data.list) {
        setEditTitle(data.list.title);
        setEditDesc(data.list.description || "");
      }

      setLoading(false);
    } catch {
      setError("Could not load list.");
      setLoading(false);
    }
  }, [
    slug,
    searchQuery,
    selectedTags,
    selectedCombat,
    selectedNarrative,
    minRating,
    complexity,
    metaProgression,
    deckVerified,
  ]);

  useEffect(() => {
    fetchListGames();
  }, [fetchListGames]);

  const handleSave = () => {
    requireAuth(async () => {
      if (!listData) return;
      try {
        const res = await fetch(`/api/lists/${listData.id}/save`, {
          method: "POST",
        });
        const data = await res.json();
        setListData((prev) => (prev ? { ...prev, isSaved: data.saved } : null));
        refreshUser();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleRate = (rating: number) => {
    requireAuth(async () => {
      if (!listData) return;
      try {
        const res = await fetch(`/api/lists/${listData.id}/rate`, {
          method: "POST",
          body: JSON.stringify({ rating }),
        });
        const data = await res.json();
        setListData((prev) =>
          prev
            ? {
                ...prev,
                userRating: rating,
                averageRating: data.averageRating,
              }
            : null
        );
        refreshUser();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteList = async () => {
    if (!listData) return;
    try {
      const res = await fetch(`/api/lists/${listData.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/lists");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateList = async () => {
    if (!listData) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/lists/${listData.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: editTitle, description: editDesc }),
      });
      if (res.ok) {
        const updated = await res.json();
        setListData((prev) =>
          prev
            ? {
                ...prev,
                title: updated.title,
                description: updated.description,
              }
            : null
        );
        setIsEditingTitle(false);
        setIsEditingDesc(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveGame = async (gameId: string) => {
    if (!listData) return;
    try {
      const res = await fetch(`/api/lists/${listData.id}/remove`, {
        method: "POST",
        body: JSON.stringify({ gameId }),
      });
      if (res.ok) {
        setGames((prev) => prev.filter((g) => g.id !== gameId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTagToggle = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleCombatToggle = (type: string) =>
    setSelectedCombat((prev) =>
      prev.includes(type) ? prev.filter((g) => g !== type) : [...prev, type]
    );

  const handleNarrativeToggle = (type: string) =>
    setSelectedNarrative((prev) =>
      prev.includes(type) ? prev.filter((g) => g !== type) : [...prev, type]
    );

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedCombat([]);
    setSelectedNarrative([]);
    setMinRating([0]);
    setComplexity([0]);
    setMetaProgression(false);
    setDeckVerified(false);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedTags.length > 0 ||
    selectedCombat.length > 0 ||
    selectedNarrative.length > 0 ||
    minRating[0] > 0 ||
    complexity[0] > 0 ||
    metaProgression ||
    deckVerified ||
    searchQuery.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
        <Header />
        <main className="flex flex-col flex-1 w-full px-6 py-8 mx-auto max-w-7xl">
          <div className="w-full max-w-4xl mx-auto mb-12 space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex-1 w-full space-y-4">
                <Skeleton className="w-2/3 h-10" />
                <Skeleton className="w-full h-6" />
                <Skeleton className="w-5/6 h-6" />
              </div>
              <Skeleton className="w-32 h-10" />
            </div>
            <Skeleton className="w-full h-20 rounded-xl" />
            <Skeleton className="h-12 mx-auto rounded-full w-xl" />
          </div>

          <div className="flex flex-col gap-12 lg:flex-row">
            <aside className="w-full space-y-8 lg:w-72 shrink-0">
              <div className="space-y-4">
                <Skeleton className="w-24 h-4" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="w-16 h-7" />
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-full h-24" />
              </div>
            </aside>
            <section className="flex-1 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-6 sm:flex-row">
                  <Skeleton className="w-full h-40 rounded-lg sm:w-70 shrink-0" />
                  <div className="flex-1 py-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <Skeleton className="w-2/3 h-8" />
                        <Skeleton className="w-12 h-6" />
                      </div>
                      <Skeleton className="w-full h-4" />
                      <Skeleton className="w-5/6 h-4" />
                    </div>
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                      <div className="flex gap-4">
                        <Skeleton className="w-16 h-4" />
                        <Skeleton className="w-16 h-4" />
                        <Skeleton className="w-16 h-4" />
                      </div>
                      <Skeleton className="w-24 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">List not found</h2>
          <Button onClick={() => router.push("/lists")}>Back to Lists</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
      <Header />
      <main className="flex flex-col flex-1 w-full px-6 py-8 mx-auto max-w-7xl">
        <div className="w-full max-w-4xl mx-auto mb-12 space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex-1 w-full">
              {/* Title Section */}
              <div className="flex items-center gap-2 mb-2 group">
                {isEditingTitle ? (
                  <div className="flex items-center w-full max-w-md gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateList();
                      }}
                      className="h-12 text-3xl font-black"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      onClick={handleUpdateList}
                      disabled={isUpdating}
                      className="cursor-pointer"
                    >
                      <CheckIcon />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setIsEditingTitle(false);
                        setEditTitle(listData.title);
                      }}
                      className="cursor-pointer"
                    >
                      <XIcon />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black tracking-tighter">
                      {listData.title}
                    </h1>
                    {listData.isOwner && (
                      <button
                        onClick={() => setIsEditingTitle(true)}
                        className="transition-opacity opacity-0 cursor-pointer group-hover:opacity-100 text-muted-foreground hover:text-primary"
                      >
                        <PencilSimpleIcon size={24} />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Description Section */}
              <div className="relative group">
                {isEditingDesc ? (
                  <div className="flex items-start w-full max-w-2xl gap-2 mt-2">
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateList();
                        }
                      }}
                      className="min-h-25"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        size="icon"
                        onClick={handleUpdateList}
                        disabled={isUpdating}
                        className="cursor-pointer"
                      >
                        <CheckIcon />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingDesc(false);
                          setEditDesc(listData.description);
                        }}
                        className="cursor-pointer"
                      >
                        <XIcon />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 whitespace-pre-wrap text-muted-foreground">
                    {listData.description || "No description provided."}
                    {listData.isOwner && (
                      <button
                        onClick={() => setIsEditingDesc(true)}
                        className="transition-opacity opacity-0 cursor-pointer group-hover:opacity-100 text-muted-foreground hover:text-primary"
                      >
                        <PencilSimpleIcon size={16} />
                      </button>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={listData.isSaved ? "default" : "outline"}
                onClick={handleSave}
                className="gap-2 cursor-pointer"
              >
                <BookmarkSimpleIcon
                  size={20}
                  weight={listData.isSaved ? "fill" : "regular"}
                />
                {listData.isSaved ? "Saved" : "Save List"}
              </Button>
              {listData.isOwner && (
                <Button
                  variant="destructive"
                  className="gap-2 cursor-pointer"
                  onClick={() => setDeleteListModalOpen(true)}
                >
                  <TrashIcon size={20} />
                  Delete List
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 p-6 border sm:flex-row sm:items-center bg-secondary/10 rounded-xl border-border/40">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon size={16} weight="fill" />
                <span className="font-medium">Created by</span>
                <span className="font-bold text-foreground">
                  {listData.creator}
                </span>
              </div>
              {listData.averageRating > 0 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <StarIcon
                      size={16}
                      weight="fill"
                      className="text-primary"
                    />
                    <span className="text-sm font-bold">
                      {listData.averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      avg rating
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Your rating:
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className="transition-transform cursor-pointer focus:outline-none hover:scale-110 active:scale-95"
                  >
                    <StarIcon
                      size={20}
                      weight={listData.userRating >= star ? "fill" : "regular"}
                      className={`transition-colors ${
                        listData.userRating >= star
                          ? "text-primary"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative max-w-xl mx-auto group">
            <MagnifyingGlassIcon
              size={20}
              className="absolute transition-colors -translate-y-1/2 left-4 top-1/2 text-muted-foreground group-focus-within:text-primary"
            />
            <Input
              placeholder="Search games in this list..."
              className="h-12 text-base transition-all border-transparent rounded-full shadow-sm pl-11 bg-secondary/30 focus-visible:ring-1 focus-visible:ring-primary hover:bg-secondary/50 focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-12 lg:flex-row">
          <aside className="w-full lg:w-72 shrink-0">
            <GameFilters
              availableTags={availableTags}
              selectedTags={selectedTags}
              selectedCombat={selectedCombat}
              selectedNarrative={selectedNarrative}
              minRating={minRating}
              complexity={complexity}
              metaProgression={metaProgression}
              deckVerified={deckVerified}
              hasActiveFilters={hasActiveFilters}
              onTagToggle={handleTagToggle}
              onCombatToggle={handleCombatToggle}
              onNarrativeToggle={handleNarrativeToggle}
              onMinRatingChange={setMinRating}
              onComplexityChange={setComplexity}
              onMetaProgressionChange={setMetaProgression}
              onDeckVerifiedChange={setDeckVerified}
              onClearFilters={clearFilters}
            />
          </aside>

          <section className="flex-1 space-y-6">
            <div className="sticky z-20 flex flex-col items-start justify-between gap-4 py-2 sm:flex-row sm:items-center bg-background/50 backdrop-blur-sm top-16 lg:static">
              <div className="text-sm font-medium text-muted-foreground">
                <span className="font-bold text-foreground">
                  {games.length}
                </span>{" "}
                Games in List
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {error && (
                <div className="py-20 text-center text-red-500">{error}</div>
              )}
              {games.map((game) => (
                <div key={game.id} className="relative group/card">
                  <div className={listData.isOwner ? "pr-0" : ""}>
                    <GameCard game={game} />
                  </div>
                  {listData.isOwner && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute z-20 transition-opacity shadow-lg opacity-0 cursor-pointer top-2 right-2 sm:right-auto sm:left-58 group-hover/card:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGame(game.id);
                      }}
                      title="Remove from list"
                    >
                      <TrashIcon size={18} />
                    </Button>
                  )}
                  <Separator className="mt-6 opacity-50 last:hidden" />
                </div>
              ))}
              {!loading && !error && games.length === 0 && (
                <div className="py-24 text-center border border-dashed text-muted-foreground bg-secondary/5 rounded-xl border-border/60">
                  <div className="flex flex-col items-center gap-2">
                    <MagnifyingGlassIcon size={32} className="opacity-20" />
                    <p className="text-lg font-medium">No games found</p>
                    <Button
                      variant="link"
                      onClick={clearFilters}
                      className="mt-2 cursor-pointer text-primary"
                    >
                      Clear all filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />

      <ConfirmationModal
        isOpen={deleteListModalOpen}
        onClose={() => setDeleteListModalOpen(false)}
        onConfirm={handleDeleteList}
        title="Delete List"
        description="Are you sure you want to delete this list? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
