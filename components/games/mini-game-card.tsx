"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { GameControllerIcon } from "@phosphor-icons/react";
import { Game } from "@/lib/types";

interface MiniGameCardProps {
  game: Game;
}

export function MiniGameCard({ game }: MiniGameCardProps) {
  const router = useRouter();

  return (
    <div
      className="relative h-32 overflow-hidden transition-all duration-300 border border-transparent rounded-lg shadow-sm cursor-pointer group w-44 hover:shadow-xl hover:border-primary/50 shrink-0"
      onClick={() => router.push(`/games/${game.slug}`)}
    >
      <div className="absolute inset-0 bg-black">
        {game.steamAppId ? (
          <Image
            src={`/api/games/${game.slug}/image/header`}
            alt={game.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-secondary">
            <GameControllerIcon
              size={32}
              className="text-muted-foreground/30"
            />
          </div>
        )}
      </div>

      <div className="absolute inset-0 transition-opacity bg-linear-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-60" />

      <div className="absolute z-10 bottom-3 left-3 right-3">
        <h3 className="text-xs font-bold leading-tight text-white drop-shadow-md line-clamp-2">
          {game.title}
        </h3>
      </div>
    </div>
  );
}
