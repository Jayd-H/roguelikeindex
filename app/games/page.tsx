"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  SortAscendingIcon, 
  XIcon, 
  GameControllerIcon, 
  TimerIcon, 
  StarIcon, 
  BookOpenIcon, 
  SwordIcon,
  TrophyIcon,
  TagIcon
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the shape of our Tag
interface Tag {
  id: number;
  name: string;
}

// Define the shape of our Game
interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  subgenre: string;
  combatType: string;
  narrativePresence: string;
  avgRunLength: string;
  difficulty: number;
  rating: number;
  complexity: number;
  metaProgression: boolean;
  steamDeckVerified: boolean;
  steamAppId: string | null;
  tags: Tag[];
}

const TagCycler = ({ tags }: { tags: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if(!tags || tags.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % tags.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [tags]);

  if(!tags || tags.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-500">
      <TagIcon size={14} weight="fill" />
      <span className="truncate">{tags[index]}</span>
    </div>
  );
};

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedCombat, setSelectedCombat] = useState<string[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<string[]>([]);
  const [minRating, setMinRating] = useState([0]);
  const [complexity, setComplexity] = useState([0]);
  const [metaProgression, setMetaProgression] = useState(false);
  const [deckVerified, setDeckVerified] = useState(false);

  const genres = ["Deckbuilder", "Action", "Turn-Based", "Traditional", "Tower Defense"];
  const combatTypes = ["Turn-Based", "Real-Time", "Card-Based", "Auto-Battler"];
  const narrativeTypes = ["None", "Environmental", "Light", "Story-Rich"];

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => {
        setGames(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) => prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]);
  };

  const handleCombatToggle = (type: string) => {
    setSelectedCombat((prev) => prev.includes(type) ? prev.filter((g) => g !== type) : [...prev, type]);
  };

  const handleNarrativeToggle = (type: string) => {
    setSelectedNarrative((prev) => prev.includes(type) ? prev.filter((g) => g !== type) : [...prev, type]);
  };

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
    const searchTokens = searchQuery.toLowerCase().split(" ").filter(t => t.length > 0);
    const title = game.title.toLowerCase();
    const gameTags = game.tags.map(t => t.name.toLowerCase());
    
    const matchesSearch = searchTokens.length === 0 || searchTokens.every(token => 
      title.includes(token) || gameTags.some(tag => tag.includes(token))
    );

    const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(game.subgenre);
    const matchesCombat = selectedCombat.length === 0 || selectedCombat.includes(game.combatType);
    const matchesNarrative = selectedNarrative.length === 0 || selectedNarrative.includes(game.narrativePresence);
    const matchesRating = game.rating >= minRating[0];
    const matchesComplexity = game.complexity >= complexity[0];
    const matchesMeta = !metaProgression || game.metaProgression;
    const matchesDeck = !deckVerified || game.steamDeckVerified;

    return matchesSearch && matchesGenre && matchesCombat && matchesNarrative && matchesRating && matchesComplexity && matchesMeta && matchesDeck;
  });

  const hasActiveFilters = selectedGenres.length > 0 || selectedCombat.length > 0 || selectedNarrative.length > 0 || minRating[0] > 0 || complexity[0] > 0 || metaProgression || deckVerified || searchQuery;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
        
        <div className="w-full max-w-3xl mx-auto mb-12 text-center space-y-4">
          <h2 className="text-4xl font-black tracking-tighter">Discover Your Next Run</h2>
          <p className="text-muted-foreground">Search through the comprehensive database of roguelikes and roguelites.</p>
          
          <div className="relative group max-w-xl mx-auto">
            <MagnifyingGlassIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
            <div className="sticky top-24 space-y-8 pr-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary">
                  <FunnelIcon size={16} weight="bold" />
                  Filters
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                    Clear All <XIcon size={12} className="ml-1" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-6">
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Subgenre</h3>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        className={`text-xs px-3 py-1.5 rounded-md transition-all border cursor-pointer ${
                          selectedGenres.includes(genre)
                            ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm" 
                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Combat Style</h3>
                  <div className="space-y-2">
                    {combatTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={type} 
                          checked={selectedCombat.includes(type)}
                          onCheckedChange={() => handleCombatToggle(type)}
                          className="cursor-pointer"
                        />
                        <Label htmlFor={type} className="text-sm font-normal cursor-pointer text-muted-foreground peer-data-[state=checked]:text-foreground">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Narrative Depth</h3>
                  <div className="space-y-2">
                    {narrativeTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={type} 
                          checked={selectedNarrative.includes(type)}
                          onCheckedChange={() => handleNarrativeToggle(type)}
                          className="cursor-pointer"
                        />
                        <Label htmlFor={type} className="text-sm font-normal cursor-pointer text-muted-foreground peer-data-[state=checked]:text-foreground">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-6">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-sm">Min Rating</h3>
                          <span className="text-xs font-medium text-primary">{minRating[0]} / 5</span>
                      </div>
                      <Slider value={minRating} onValueChange={setMinRating} max={5} step={0.5} className="py-2 cursor-pointer" />
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-sm">Min Complexity</h3>
                          <span className="text-xs font-medium text-primary">{complexity[0]} / 10</span>
                      </div>
                      <Slider value={complexity} onValueChange={setComplexity} max={10} step={1} className="py-2 cursor-pointer" />
                   </div>
                </div>

                <Separator />

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <Label htmlFor="meta-prog" className="text-sm font-medium cursor-pointer">Meta Progression</Label>
                      <Switch id="meta-prog" checked={metaProgression} onCheckedChange={setMetaProgression} className="cursor-pointer" />
                   </div>
                   <div className="flex items-center justify-between">
                      <Label htmlFor="deck-verified" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                         <GameControllerIcon size={16} /> Deck Verified
                      </Label>
                      <Switch id="deck-verified" checked={deckVerified} onCheckedChange={setDeckVerified} className="cursor-pointer" />
                   </div>
                </div>

              </div>
            </div>
          </aside>

          <section className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/50 backdrop-blur-sm sticky top-16 lg:static z-20 py-2">
               <div className="text-muted-foreground text-sm font-medium">
                 Showing <span className="text-foreground font-bold">{filteredGames.length}</span> Games
               </div>
               
               <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground mr-1">Sort by:</Label>
                  <Select defaultValue="rating">
                    <SelectTrigger className="w-45 h-9 text-sm cursor-pointer">
                      <SortAscendingIcon size={16} className="mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating" className="cursor-pointer">Highest Rating</SelectItem>
                      <SelectItem value="newest" className="cursor-pointer">Newest Added</SelectItem>
                      <SelectItem value="alphabetical" className="cursor-pointer">Alphabetical</SelectItem>
                      <SelectItem value="complexity" className="cursor-pointer">Highest Complexity</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </div>

            <div className="flex flex-col gap-6">
              {loading ? (
                  <div className="text-center py-20">Loading games...</div>
              ) : filteredGames.map((game) => (
                <div key={game.id} className="group flex flex-col sm:flex-row gap-6 cursor-pointer" onClick={() => router.push(`/games/${game.slug}`)}>
                  
                  <div className="w-full sm:w-70 h-40 bg-black shrink-0 relative overflow-hidden rounded-lg">
                    {game.steamAppId ? (
                      <Image 
                        src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/header.jpg`}
                        alt={game.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <GameControllerIcon size={32} className="text-muted-foreground/50" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2">
                       <Badge className="backdrop-blur-md bg-black/70 text-white border-none hover:bg-black/80 font-semibold">{game.subgenre}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{game.title}</h3>
                        <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2.5 py-1 rounded-md h-fit">
                           <StarIcon weight="fill" size={16} /> 
                           <span className="font-bold text-foreground text-sm">{game.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4 max-w-2xl">
                        {game.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      
                      <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground flex-wrap">
                        
                        <div className="flex items-center gap-1.5 text-blue-500" title="Average Run Length">
                          <TimerIcon size={16} weight="fill" />
                          <span className="font-semibold">{game.avgRunLength}</span>
                        </div>
                        
                        <div className="w-px h-3 bg-border mx-1"></div>

                        <div className="flex items-center gap-1.5 text-red-500" title="Combat Type">
                          <SwordIcon size={16} weight="fill" />
                          <span className="font-semibold">{game.combatType}</span>
                        </div>

                        <div className="w-px h-3 bg-border mx-1"></div>

                        <div className="flex items-center gap-1.5 text-purple-500" title="Narrative">
                          <BookOpenIcon size={16} weight="fill" />
                          <span className="font-semibold">{game.narrativePresence}</span>
                        </div>

                        <div className="w-px h-3 bg-border mx-1"></div>

                        <div className="flex items-center gap-1.5 text-yellow-500" title="Difficulty">
                          <TrophyIcon size={16} weight="fill" />
                          <span className="font-semibold">{game.difficulty}/10</span>
                        </div>

                      </div>

                      <div className="flex items-center justify-end">
                         <TagCycler tags={game.tags.map(t => t.name)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredGames.map((_, i) => i < filteredGames.length - 1 && (
                 <Separator key={i} className="opacity-50" />
              ))}
              
              {!loading && filteredGames.length === 0 && (
                <div className="text-center py-24 text-muted-foreground bg-secondary/5 rounded-xl border border-dashed border-border/60">
                  <div className="flex flex-col items-center gap-2">
                    <MagnifyingGlassIcon size={32} className="opacity-20" />
                    <p className="text-lg font-medium">No games found</p>
                    <p className="text-sm">Try adjusting your filters or search query.</p>
                    <Button variant="link" onClick={clearFilters} className="text-primary mt-2 cursor-pointer">Clear all filters</Button>
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