"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/components/auth-provider";
import { MagnifyingGlassIcon, SortAscendingIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Game } from "@/lib/types";
import { GameCard } from "@/components/games/game-card";
import { GameFilters } from "@/components/games/game-filters";

export default function GamesPage() {
  const { requireAuth } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedCombat, setSelectedCombat] = useState<string[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<string[]>([]);
  const [minRating, setMinRating] = useState([0]);
  const [complexity, setComplexity] = useState([0]);
  const [metaProgression, setMetaProgression] = useState(false);
  const [deckVerified, setDeckVerified] = useState(false);

  useEffect(() => {
    fetch("/api/games")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch games");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setGames(data);
        } else {
          setGames([]);
          console.error("API returned invalid data:", data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load games. Please try again later.");
        setLoading(false);
      });
  }, []);

  const handleGenreToggle = (genre: string) =>
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
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
    setSelectedGenres([]);
    setSelectedCombat([]);
    setSelectedNarrative([]);
    setMinRating([0]);
    setComplexity([0]);
    setMetaProgression(false);
    setDeckVerified(false);
    setSearchQuery("");
  };

  const filteredGames = games.filter((game) => {
    const searchTokens = searchQuery
      .toLowerCase()
      .split(" ")
      .filter((t) => t.length > 0);
    const title = game.title.toLowerCase();
    const gameTags = game.tags.map((t) => t.name.toLowerCase());
    const matchesSearch =
      searchTokens.length === 0 ||
      searchTokens.every(
        (token) =>
          title.includes(token) || gameTags.some((tag) => tag.includes(token))
      );
    return (
      matchesSearch &&
      (selectedGenres.length === 0 || selectedGenres.includes(game.subgenre)) &&
      (selectedCombat.length === 0 ||
        selectedCombat.includes(game.combatType)) &&
      (selectedNarrative.length === 0 ||
        selectedNarrative.includes(game.narrativePresence)) &&
      game.rating >= minRating[0] &&
      game.complexity >= complexity[0] &&
      (!metaProgression || game.metaProgression) &&
      (!deckVerified || game.steamDeckVerified)
    );
  });

  const hasActiveFilters =
    selectedGenres.length > 0 ||
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
              placeholder="Search by title, tag, or mechanic..."
              className="pl-11 h-12 bg-secondary/30 border-transparent rounded-full text-base focus-visible:ring-1 focus-visible:ring-primary shadow-sm transition-all hover:bg-secondary/50 focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="w-full lg:w-72 shrink-0">
            <GameFilters
              selectedGenres={selectedGenres}
              selectedCombat={selectedCombat}
              selectedNarrative={selectedNarrative}
              minRating={minRating}
              complexity={complexity}
              metaProgression={metaProgression}
              deckVerified={deckVerified}
              hasActiveFilters={hasActiveFilters}
              onGenreToggle={handleGenreToggle}
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
                Showing{" "}
                <span className="text-foreground font-bold">
                  {filteredGames.length}
                </span>{" "}
                Games
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground mr-1">
                  Sort by:
                </Label>
                <Select defaultValue="rating">
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
              {loading ? (
                <div className="text-center py-20">Loading games...</div>
              ) : error ? (
                <div className="text-center py-20 text-red-500">{error}</div>
              ) : (
                filteredGames.map((game) => (
                  <div key={game.id}>
                    <GameCard game={game} requireAuth={requireAuth} />
                    <Separator className="opacity-50 last:hidden" />
                  </div>
                ))
              )}
              {!loading && !error && filteredGames.length === 0 && (
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
