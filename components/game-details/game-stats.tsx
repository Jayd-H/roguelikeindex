"use client";

import { useState } from "react";
import {
  TimerIcon,
  TrophyIcon,
  SmileyIcon,
  HourglassIcon,
  MedalIcon,
  BookOpenIcon,
  SwordIcon,
  InfinityIcon,
  PuzzlePieceIcon,
  LightningIcon,
  DiceFiveIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Game } from "@/lib/types";
import { SuggestionModal } from "./suggestion-modal";
import { useAuth } from "@/components/auth-provider";

export function GameStats({ game }: { game: Game }) {
  const { requireAuth } = useAuth();
  const [editModal, setEditModal] = useState<{
    field: string;
    type: "add" | "remove";
    data?: unknown;
  } | null>(null);

  const openSuggest = (
    field: string,
    type: "add" | "remove",
    data?: unknown
  ) => {
    requireAuth(() => {
      setEditModal({ field, type, data });
    });
  };

  return (
    <section className="space-y-6">
      <h3 className="flex items-center gap-2 text-2xl font-bold">Overview</h3>
      <p className="text-lg leading-relaxed whitespace-pre-wrap text-muted-foreground">
        {game.description}
      </p>
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-500 opacity-90">
              <TimerIcon size={18} weight="fill" /> Avg Run
            </div>
            <div className="text-2xl font-black text-foreground">
              {game.avgRunLength}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-500 opacity-90">
              <BookOpenIcon size={18} weight="fill" /> Narrative
            </div>
            <div className="text-xl font-bold text-foreground">
              {game.narrativePresence}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-500 opacity-90">
              <SwordIcon size={18} weight="fill" /> Combat
            </div>
            <div className="text-xl font-bold text-foreground">
              {game.combatType}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-500 opacity-90">
              <TrophyIcon size={18} weight="fill" /> Difficulty
            </div>
            <div className="text-2xl font-black text-foreground">
              {game.difficulty}/10
            </div>
          </div>
        </div>
        <Separator className="bg-border/60" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-muted-foreground">
                <InfinityIcon size={16} weight="fill" /> Replayability
              </span>
              <span className="font-semibold text-foreground">
                {game.replayability}/10
              </span>
            </div>
            <Progress
              value={game.replayability * 10}
              className="h-2 bg-secondary"
            />
          </div>
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-muted-foreground">
                <LightningIcon size={16} weight="fill" /> Synergy Depth
              </span>
              <span className="font-semibold text-foreground">
                {game.synergyDepth}/10
              </span>
            </div>
            <Progress
              value={game.synergyDepth * 10}
              className="h-2 bg-secondary"
            />
          </div>
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-muted-foreground">
                <PuzzlePieceIcon size={16} weight="fill" /> Complexity
              </span>
              <span className="font-semibold text-foreground">
                {game.complexity}/10
              </span>
            </div>
            <Progress
              value={game.complexity * 10}
              className="h-2 bg-secondary"
            />
          </div>
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-muted-foreground">
                <DiceFiveIcon size={16} weight="fill" /> RNG Reliance
              </span>
              <span className="font-semibold text-foreground">
                {game.rngReliance}/10
              </span>
            </div>
            <Progress
              value={game.rngReliance * 10}
              className="h-2 bg-secondary"
            />
          </div>
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-muted-foreground">
                <SmileyIcon size={16} weight="fill" /> User Friendliness
              </span>
              <span className="font-semibold text-foreground">
                {game.userFriendliness}/10
              </span>
            </div>
            <Progress
              value={game.userFriendliness * 10}
              className="h-2 bg-secondary"
            />
          </div>
          <div className="flex items-center gap-8 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <HourglassIcon size={16} weight="fill" /> Time to First Win
              </div>
              <div className="font-bold text-foreground">
                {game.timeToFirstWin}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MedalIcon size={16} weight="fill" /> Time to 100%
              </div>
              <div className="font-bold text-foreground">{game.timeTo100}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 group">
        {game.tags.map((tag) => (
          <Badge
            key={tag.name}
            variant="secondary"
            className="px-3 py-1.5 text-sm bg-secondary/50 hover:bg-secondary relative group/tag pr-2"
          >
            {tag.name}
            <button
              onClick={() => openSuggest("tags", "remove", tag)}
              className="ml-2 transition-opacity opacity-0 cursor-pointer group-hover/tag:opacity-100 hover:text-destructive"
            >
              <XIcon size={12} weight="bold" />
            </button>
          </Badge>
        ))}
        <button
          onClick={() => openSuggest("tags", "add")}
          className="px-3 py-1.5 text-sm rounded-full border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <PlusIcon size={14} />
        </button>
      </div>

      {editModal && (
        <SuggestionModal
          isOpen={!!editModal}
          onClose={() => setEditModal(null)}
          gameSlug={game.slug}
          field={editModal.field}
          type={editModal.type}
          currentData={editModal.data}
        />
      )}
    </section>
  );
}
