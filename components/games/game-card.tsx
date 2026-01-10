"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  GameControllerIcon,
  TimerIcon,
  StarIcon,
  BookOpenIcon,
  SwordIcon,
  TrophyIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TagCycler } from "./tag-cycler";
import { Game } from "@/lib/types";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter();

  return (
    <div
      className="flex flex-col gap-6 cursor-pointer group sm:flex-row"
      onClick={() => router.push(`/games/${game.slug}`)}
    >
      <div className="relative w-full h-40 overflow-hidden bg-black rounded-lg sm:w-70 shrink-0">
        {game.steamAppId ? (
          <Image
            src={`/api/games/${game.slug}/image/header`}
            alt={game.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-secondary">
            <GameControllerIcon
              size={32}
              className="text-muted-foreground/50"
            />
          </div>
        )}

        {/* Deck Verified Badge in Top Left */}
        {game.steamDeckVerified && (
          <div className="absolute z-10 top-2 left-2">
            <Badge
              variant="outline"
              className="bg-black/70 border-green-500/50 text-green-400 backdrop-blur-md gap-1 px-2 py-0.5 text-[10px] h-auto font-bold shadow-sm"
            >
              <GameControllerIcon size={12} weight="fill" /> Verified
            </Badge>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between flex-1 py-1">
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-2xl font-bold transition-colors text-foreground group-hover:text-primary line-clamp-1">
              {game.title}
            </h3>
            <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2.5 py-1 rounded-md h-fit">
              <StarIcon weight="fill" size={16} />
              <span className="text-sm font-bold text-foreground">
                {game.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <p className="max-w-2xl mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {game.description}
          </p>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
            <div
              className="flex items-center gap-1.5 text-blue-500"
              title="Average Run Length"
            >
              <TimerIcon size={16} weight="fill" />
              <span className="font-semibold">{game.avgRunLength}</span>
            </div>
            <div className="w-px h-3 mx-1 bg-border"></div>
            <div
              className="flex items-center gap-1.5 text-red-500"
              title="Combat Type"
            >
              <SwordIcon size={16} weight="fill" />
              <span className="font-semibold">{game.combatType}</span>
            </div>
            <div className="w-px h-3 mx-1 bg-border"></div>
            <div
              className="flex items-center gap-1.5 text-purple-500"
              title="Narrative"
            >
              <BookOpenIcon size={16} weight="fill" />
              <span className="font-semibold">{game.narrativePresence}</span>
            </div>
            <div className="w-px h-3 mx-1 bg-border"></div>
            <div
              className="flex items-center gap-1.5 text-yellow-500"
              title="Difficulty"
            >
              <TrophyIcon size={16} weight="fill" />
              <span className="font-semibold">{game.difficulty}/10</span>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <TagCycler tags={game.tags.map((t) => t.name)} />
          </div>
        </div>
      </div>
      <Separator className="mt-4 opacity-50 sm:hidden" />
    </div>
  );
}
