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
  requireAuth: (action: () => void) => void;
}

export function GameCard({ game, requireAuth }: GameCardProps) {
  const router = useRouter();

  return (
    <div
      className="group flex flex-col sm:flex-row gap-6 cursor-pointer"
      onClick={() => requireAuth(() => router.push(`/games/${game.slug}`))}
    >
      <div className="w-full sm:w-70 h-40 bg-black shrink-0 relative overflow-hidden rounded-lg">
        {game.steamAppId ? (
          <Image
            src={`/api/games/${game.slug}/image/header`}
            alt={game.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <GameControllerIcon
              size={32}
              className="text-muted-foreground/50"
            />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className="backdrop-blur-md bg-black/70 text-white border-none hover:bg-black/80 font-semibold">
            {game.subgenre}
          </Badge>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {game.title}
            </h3>
            <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2.5 py-1 rounded-md h-fit">
              <StarIcon weight="fill" size={16} />
              <span className="font-bold text-foreground text-sm">
                {game.rating}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4 max-w-2xl">
            {game.description}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground flex-wrap">
            <div
              className="flex items-center gap-1.5 text-blue-500"
              title="Average Run Length"
            >
              <TimerIcon size={16} weight="fill" />
              <span className="font-semibold">{game.avgRunLength}</span>
            </div>
            <div className="w-px h-3 bg-border mx-1"></div>
            <div
              className="flex items-center gap-1.5 text-red-500"
              title="Combat Type"
            >
              <SwordIcon size={16} weight="fill" />
              <span className="font-semibold">{game.combatType}</span>
            </div>
            <div className="w-px h-3 bg-border mx-1"></div>
            <div
              className="flex items-center gap-1.5 text-purple-500"
              title="Narrative"
            >
              <BookOpenIcon size={16} weight="fill" />
              <span className="font-semibold">{game.narrativePresence}</span>
            </div>
            <div className="w-px h-3 bg-border mx-1"></div>
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
      <Separator className="sm:hidden mt-4 opacity-50" />
    </div>
  );
}
