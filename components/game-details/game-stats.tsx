"use client";

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
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Game } from "@/lib/types";

export function GameStats({ game }: { game: Game }) {
  return (
    <section className="space-y-6">
      <h3 className="text-2xl font-bold flex items-center gap-2">Overview</h3>
      <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
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
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
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
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
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
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
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
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
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
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
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
          <div className="flex gap-8 items-center pt-2">
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
      <div className="flex flex-wrap gap-2">
        {game.tags.map((tag) => (
          <Badge
            key={tag.name}
            variant="secondary"
            className="px-3 py-1.5 text-sm bg-secondary/50 hover:bg-secondary"
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    </section>
  );
}
