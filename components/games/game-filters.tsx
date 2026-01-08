"use client";

import { FunnelIcon, XIcon, GameControllerIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface GameFiltersProps {
  selectedGenres: string[];
  selectedCombat: string[];
  selectedNarrative: string[];
  minRating: number[];
  complexity: number[];
  metaProgression: boolean;
  deckVerified: boolean;
  hasActiveFilters: boolean;
  onGenreToggle: (genre: string) => void;
  onCombatToggle: (type: string) => void;
  onNarrativeToggle: (type: string) => void;
  onMinRatingChange: (val: number[]) => void;
  onComplexityChange: (val: number[]) => void;
  onMetaProgressionChange: (val: boolean) => void;
  onDeckVerifiedChange: (val: boolean) => void;
  onClearFilters: () => void;
}

export function GameFilters({
  selectedGenres,
  selectedCombat,
  selectedNarrative,
  minRating,
  complexity,
  metaProgression,
  deckVerified,
  hasActiveFilters,
  onGenreToggle,
  onCombatToggle,
  onNarrativeToggle,
  onMinRatingChange,
  onComplexityChange,
  onMetaProgressionChange,
  onDeckVerifiedChange,
  onClearFilters,
}: GameFiltersProps) {
  const genres = [
    "Deckbuilder",
    "Action",
    "Turn-Based",
    "Traditional",
    "Tower Defense",
  ];
  const combatTypes = ["Turn-Based", "Real-Time", "Card-Based", "Auto-Battler"];
  const narrativeTypes = ["None", "Environmental", "Light", "Story-Rich"];

  return (
    <div className="sticky top-24 space-y-8 pr-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary">
          <FunnelIcon size={16} weight="bold" /> Filters
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
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
                onClick={() => onGenreToggle(genre)}
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
                  onCheckedChange={() => onCombatToggle(type)}
                  className="cursor-pointer"
                />
                <Label
                  htmlFor={type}
                  className="text-sm font-normal cursor-pointer text-muted-foreground peer-data-[state=checked]:text-foreground"
                >
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
                  onCheckedChange={() => onNarrativeToggle(type)}
                  className="cursor-pointer"
                />
                <Label
                  htmlFor={type}
                  className="text-sm font-normal cursor-pointer text-muted-foreground peer-data-[state=checked]:text-foreground"
                >
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
              <span className="text-xs font-medium text-primary">
                {minRating[0]} / 5
              </span>
            </div>
            <Slider
              value={minRating}
              onValueChange={onMinRatingChange}
              max={5}
              step={0.5}
              className="py-2 cursor-pointer"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Min Complexity</h3>
              <span className="text-xs font-medium text-primary">
                {complexity[0]} / 10
              </span>
            </div>
            <Slider
              value={complexity}
              onValueChange={onComplexityChange}
              max={10}
              step={1}
              className="py-2 cursor-pointer"
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="meta-prog"
              className="text-sm font-medium cursor-pointer"
            >
              Meta Progression
            </Label>
            <Switch
              id="meta-prog"
              checked={metaProgression}
              onCheckedChange={onMetaProgressionChange}
              className="cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="deck-verified"
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              <GameControllerIcon size={16} /> Deck Verified
            </Label>
            <Switch
              id="deck-verified"
              checked={deckVerified}
              onCheckedChange={onDeckVerifiedChange}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
