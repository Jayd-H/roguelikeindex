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
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Game, Tag } from "@/lib/types";
import { GameCard } from "@/components/games/game-card";
import { GameFilters } from "@/components/games/game-filters";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCombat, setSelectedCombat] = useState<string[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<string[]>([]);
  const [minRating, setMinRating] = useState([0]);
  const [complexity, setComplexity] = useState([0]);
  const [metaProgression, setMetaProgression] = useState(false);
  const [deckVerified, setDeckVerified] = useState(false);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !listData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">List not found</h2>
          <Button onClick={() => router.push("/lists")}>Back to Lists</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
        <div className="w-full max-w-4xl mx-auto mb-12 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-black tracking-tighter mb-2">
                {listData.title}
              </h1>
              <p className="text-muted-foreground">
                {listData.description || "No description provided."}
              </p>
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
                <Button variant="outline" className="gap-2 cursor-pointer">
                  <PencilSimpleIcon size={20} />
                  Edit
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-secondary/10 rounded-xl border border-border/40">
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
                    <span className="font-bold text-sm">
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
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
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

          <div className="relative group max-w-xl mx-auto">
            <MagnifyingGlassIcon
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
            />
            <Input
              placeholder="Search games in this list..."
              className="pl-11 h-12 bg-secondary/30 border-transparent rounded-full text-base focus-visible:ring-1 focus-visible:ring-primary shadow-sm transition-all hover:bg-secondary/50 focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/50 backdrop-blur-sm sticky top-16 lg:static z-20 py-2">
              <div className="text-muted-foreground text-sm font-medium">
                <span className="text-foreground font-bold">
                  {games.length}
                </span>{" "}
                Games in List
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {error && (
                <div className="text-center py-20 text-red-500">{error}</div>
              )}
              {games.map((game) => (
                <div key={game.id}>
                  <GameCard game={game} />
                  <Separator className="opacity-50 last:hidden" />
                </div>
              ))}
              {!loading && !error && games.length === 0 && (
                <div className="text-center py-24 text-muted-foreground bg-secondary/5 rounded-xl border border-dashed border-border/60">
                  <div className="flex flex-col items-center gap-2">
                    <MagnifyingGlassIcon size={32} className="opacity-20" />
                    <p className="text-lg font-medium">No games found</p>
                    <Button
                      variant="link"
                      onClick={clearFilters}
                      className="text-primary mt-2 cursor-pointer"
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
    </div>
  );
}
