"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/components/auth-provider";
import { MagnifyingGlassIcon, SortAscendingIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Game, Tag } from "@/lib/types";
import { GameCard } from "@/components/games/game-card";
import { GameFilters } from "@/components/games/game-filters";

export default function GamesPage() {
  useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCombat, setSelectedCombat] = useState<string[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<string[]>([]);
  const [minRating, setMinRating] = useState([0]);
  const [complexity, setComplexity] = useState([0]);
  const [metaProgression, setMetaProgression] = useState(false);
  const [deckVerified, setDeckVerified] = useState(false);
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAvailableTags(data);
      })
      .catch(console.error);
  }, []);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastGameElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  const fetchGames = useCallback(
    async (pageNum: number, isReset: boolean) => {
      try {
        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", "10");
        params.append("sort", sortBy);

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

        const res = await fetch(`/api/games?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch games");

        const data = await res.json();
        const newGames = data.games || [];
        const total = data.total || 0;

        if (isReset) {
          setTotalGames(total);
        }

        if (newGames.length < 10) setHasMore(false);

        setGames((prev) => {
          const combined = isReset ? newGames : [...prev, ...newGames];
          return combined.filter(
            (game: Game, index: number, self: Game[]) =>
              index === self.findIndex((g: Game) => g.id === game.id)
          );
        });
      } catch {
        setError("Could not load games.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      sortBy,
      searchQuery,
      selectedTags,
      selectedCombat,
      selectedNarrative,
      minRating,
      complexity,
      metaProgression,
      deckVerified,
    ]
  );

  useEffect(() => {
    setLoading(true);
    setGames([]);
    setPage(1);
    setHasMore(true);
    fetchGames(1, true);
  }, [fetchGames]);

  useEffect(() => {
    if (page > 1) {
      setLoadingMore(true);
      fetchGames(page, false);
    }
  }, [page, fetchGames]);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
        <div className="w-full max-w-3xl mx-auto mb-12 text-center space-y-4">
          <h2 className="text-4xl font-black tracking-tighter">
            Discover Your Next Run
          </h2>
          <p className="text-muted-foreground">
            Search through the comprehensive database of roguelikes and
            roguelites.
          </p>
          <div className="relative group max-w-xl mx-auto">
            <MagnifyingGlassIcon
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
            />
            <Input
              placeholder="Search by title..."
              className="pl-11 h-12 bg-secondary/30 border-transparent rounded-full text-base focus-visible:ring-1 focus-visible:ring-primary shadow-sm transition-all hover:bg-secondary/50 focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="w-full lg:w-72 shrink-0">
            {availableTags.length === 0 ? (
              <div className="space-y-8 pr-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <Skeleton key={i} className="h-7 w-20 rounded-md" />
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ) : (
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
            )}
          </aside>
          <section className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/50 backdrop-blur-sm sticky top-16 lg:static z-20 py-2">
              <div className="text-muted-foreground text-sm font-medium">
                {loading && totalGames === 0 ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <>
                    <span className="text-foreground font-bold">
                      {totalGames}
                    </span>{" "}
                    Games Found
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground mr-1">
                  Sort by:
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-45 h-9 text-sm cursor-pointer">
                    <SortAscendingIcon size={16} className="mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating" className="cursor-pointer">
                      Highest Rating
                    </SelectItem>
                    <SelectItem value="newest" className="cursor-pointer">
                      Newest Added
                    </SelectItem>
                    <SelectItem value="alphabetical" className="cursor-pointer">
                      Alphabetical
                    </SelectItem>
                    <SelectItem value="complexity" className="cursor-pointer">
                      Highest Complexity
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {error && (
                <div className="text-center py-20 text-red-500">{error}</div>
              )}

              {games.map((game, index) => (
                <div
                  key={game.id}
                  ref={index === games.length - 1 ? lastGameElementRef : null}
                >
                  <GameCard game={game} />
                  <Separator className="opacity-50 last:hidden" />
                </div>
              ))}

              {(loading || loadingMore) && (
                <div className="space-y-8 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-6">
                      <Skeleton className="w-full sm:w-70 h-40 rounded-lg shrink-0" />
                      <div className="flex-1 py-1 space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <Skeleton className="h-8 w-2/3" />
                            <Skeleton className="h-6 w-12" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                          <div className="flex gap-4">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
