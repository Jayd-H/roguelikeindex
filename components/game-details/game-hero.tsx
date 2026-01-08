"use client";

import Image from "next/image";
import {
  CheckIcon,
  HeartIcon,
  ListPlusIcon,
  ShareNetworkIcon,
  GameControllerIcon,
  CodeIcon,
  BuildingsIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/lib/types";

interface GameHeroProps {
  game: Game;
  statusLoaded: boolean;
  owned: boolean;
  favorited: boolean;
  toggleOwned: () => void;
  toggleFavorite: () => void;
  handleGenericAction: () => void;
}

export function GameHero({
  game,
  statusLoaded,
  owned,
  favorited,
  toggleOwned,
  toggleFavorite,
  handleGenericAction,
}: GameHeroProps) {
  const heroUrl = `/api/games/${game.slug}/image/hero`;
  const logoUrl = `/api/games/${game.slug}/image/logo`;

  return (
    <div className="relative w-full h-100 md:h-125 overflow-hidden bg-black/90 group">
      {heroUrl ? (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent z-10" />
          <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent z-10" />
          <Image
            src={heroUrl}
            alt={`${game.title} Hero`}
            fill
            className="object-cover opacity-60"
            unoptimized
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-secondary/20 to-primary/10" />
      )}
      <div className="absolute bottom-0 left-0 w-full z-20 pb-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="max-w-2xl w-full">
            {logoUrl ? (
              <div className="relative h-24 md:h-36 w-auto max-w-100 mb-6 origin-left">
                <Image
                  src={logoUrl}
                  alt={game.title}
                  width={400}
                  height={160}
                  className="h-full w-auto object-contain drop-shadow-2xl"
                  unoptimized
                />
              </div>
            ) : (
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-lg mb-4">
                {game.title}
              </h1>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {game.steamDeckVerified && (
                <Badge
                  variant="outline"
                  className="border-green-500/50 text-green-400 bg-green-500/10 backdrop-blur-md gap-1 px-3 py-1"
                >
                  <GameControllerIcon size={16} weight="fill" /> Deck Verified
                </Badge>
              )}
              {game.metaProgression && (
                <Badge
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 bg-cyan-500/10 backdrop-blur-md gap-1 px-3 py-1"
                >
                  <CheckIcon size={16} weight="bold" /> Meta Progression
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 py-2 text-sm text-white/80 font-medium">
              {game.developer && (
                <div className="flex items-center gap-2">
                  <CodeIcon size={18} className="text-primary" />
                  {game.developer}
                </div>
              )}
              {game.publisher && (
                <div className="flex items-center gap-2">
                  <BuildingsIcon size={18} className="text-primary" />
                  {game.publisher}
                </div>
              )}
              {game.releaseDate && (
                <div className="flex items-center gap-2">
                  <CalendarBlankIcon size={18} className="text-primary" />
                  {game.releaseDate}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            {statusLoaded ? (
              <>
                <Button
                  onClick={toggleOwned}
                  variant={owned ? "default" : "secondary"}
                  className={`rounded-full h-12 px-6 gap-2 backdrop-blur-md border border-white/5 font-semibold cursor-pointer transition-all ${
                    owned
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary/80 hover:bg-secondary text-foreground"
                  }`}
                >
                  <CheckIcon
                    size={20}
                    weight="bold"
                    className={owned ? "opacity-100" : "opacity-50"}
                  />
                  {owned ? "Owned" : "Mark Owned"}
                </Button>
                <Button
                  onClick={toggleFavorite}
                  className={`rounded-full h-12 px-6 gap-2 bg-white text-black hover:bg-white/90 font-semibold shadow-lg shadow-primary/5 cursor-pointer`}
                >
                  {favorited ? (
                    <HeartIcon
                      size={20}
                      weight="fill"
                      className="text-red-500"
                    />
                  ) : (
                    <HeartIcon size={20} className="text-black" />
                  )}
                  {favorited ? "Favorited" : "Favorite"}
                </Button>
              </>
            ) : (
              <>
                <div className="h-12 w-40 rounded-full bg-secondary/50 animate-pulse" />
                <div className="h-12 w-32 rounded-full bg-secondary/50 animate-pulse" />
              </>
            )}
            <Button
              onClick={handleGenericAction}
              variant="secondary"
              className="rounded-full h-12 px-6 gap-2 backdrop-blur-md bg-secondary/80 hover:bg-secondary text-foreground border border-white/5 cursor-pointer"
            >
              <ListPlusIcon size={20} /> Add to List
            </Button>
            <Button
              onClick={handleGenericAction}
              variant="secondary"
              size="icon"
              className="rounded-full h-12 w-12 backdrop-blur-md bg-secondary/80 hover:bg-secondary text-foreground border border-white/5 cursor-pointer"
            >
              <ShareNetworkIcon size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
