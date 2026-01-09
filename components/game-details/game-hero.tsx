"use client";

import { useState } from "react";
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
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/lib/types";
import { SuggestionModal } from "./suggestion-modal";
import { useAuth } from "@/components/auth-provider";

interface GameHeroProps {
  game: Game;
  statusLoaded: boolean;
  owned: boolean;
  favorited: boolean;
  toggleOwned: () => void;
  toggleFavorite: () => void;
  onAddToList: () => void;
}

export function GameHero({
  game,
  statusLoaded,
  owned,
  favorited,
  toggleOwned,
  toggleFavorite,
  onAddToList,
}: GameHeroProps) {
  const { requireAuth } = useAuth();
  const [copied, setCopied] = useState(false);
  const [editModal, setEditModal] = useState<{
    field: string;
    type: "toggle" | "add" | "edit" | "remove";
    data: unknown;
  } | null>(null);

  const heroUrl = `/api/games/${game.slug}/image/hero`;
  const logoUrl = `/api/games/${game.slug}/image/logo`;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSuggest = (field: string, data: unknown) => {
    requireAuth(() => {
      setEditModal({ field, type: "toggle", data });
    });
  };

  return (
    <div className="relative w-full overflow-hidden h-100 md:h-125 bg-black/90 group">
      {heroUrl ? (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 z-10 bg-linear-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 z-10 bg-linear-to-r from-background/80 via-transparent to-transparent" />
          <Image
            src={heroUrl}
            alt={`${game.title} Hero`}
            fill
            className="object-cover opacity-60"
            unoptimized
          />
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none bg-linear-to-br from-secondary/20 to-primary/10" />
      )}
      <div className="absolute bottom-0 left-0 z-20 w-full pb-8">
        <div className="flex flex-col items-start justify-between gap-6 px-6 mx-auto max-w-7xl md:flex-row md:items-end">
          <div className="w-full max-w-2xl">
            {logoUrl ? (
              <div className="relative w-auto h-24 mb-6 origin-left md:h-36 max-w-100">
                <Image
                  src={logoUrl}
                  alt={game.title}
                  width={400}
                  height={160}
                  className="object-contain w-auto h-full drop-shadow-2xl"
                  unoptimized
                />
              </div>
            ) : (
              <h1 className="mb-4 text-5xl font-black tracking-tighter text-white md:text-7xl drop-shadow-lg">
                {game.title}
              </h1>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge
                variant="outline"
                className={`cursor-pointer border-green-500/50 text-green-400 bg-green-500/10 backdrop-blur-md gap-1 px-3 py-1 hover:bg-green-500/20 ${
                  !game.steamDeckVerified && "opacity-50 grayscale"
                }`}
                onClick={() =>
                  openSuggest("steamDeckVerified", game.steamDeckVerified)
                }
              >
                <GameControllerIcon size={16} weight="fill" /> Deck Verified
                <PencilSimpleIcon className="ml-1 opacity-50" />
              </Badge>

              <Badge
                variant="outline"
                className={`cursor-pointer border-cyan-500/50 text-cyan-400 bg-cyan-500/10 backdrop-blur-md gap-1 px-3 py-1 hover:bg-cyan-500/20 ${
                  !game.metaProgression && "opacity-50 grayscale"
                }`}
                onClick={() =>
                  openSuggest("metaProgression", game.metaProgression)
                }
              >
                <CheckIcon size={16} weight="bold" /> Meta Progression
                <PencilSimpleIcon className="ml-1 opacity-50" />
              </Badge>
            </div>

            <div className="flex flex-wrap py-2 text-sm font-medium gap-x-6 gap-y-2 text-white/80">
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
                <div className="w-40 h-12 rounded-full bg-secondary/50 animate-pulse" />
                <div className="w-32 h-12 rounded-full bg-secondary/50 animate-pulse" />
              </>
            )}
            <Button
              onClick={onAddToList}
              variant="secondary"
              className="h-12 gap-2 px-6 border rounded-full cursor-pointer backdrop-blur-md bg-secondary/80 hover:bg-secondary text-foreground border-white/5"
            >
              <ListPlusIcon size={20} /> Add to List
            </Button>
            <Button
              onClick={handleShare}
              variant="secondary"
              size="icon"
              className="w-12 h-12 border rounded-full cursor-pointer backdrop-blur-md bg-secondary/80 hover:bg-secondary text-foreground border-white/5"
            >
              {copied ? (
                <CheckIcon size={20} weight="bold" className="text-green-500" />
              ) : (
                <ShareNetworkIcon size={20} />
              )}
            </Button>
          </div>
        </div>
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
    </div>
  );
}
