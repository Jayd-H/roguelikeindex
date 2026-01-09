"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  StarIcon,
  ArrowSquareOutIcon,
  CheckIcon,
  ShoppingCartIcon,
  DesktopIcon,
  DeviceMobileIcon,
  GameControllerIcon,
  MonitorPlayIcon,
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Game } from "@/lib/types";
import { SuggestionModal } from "./suggestion-modal";
import { useAuth } from "@/components/auth-provider";

interface GameSidebarProps {
  game: Game;
}

interface Store {
  store: string;
  url: string;
  price: string;
}

export function GameSidebar({ game }: GameSidebarProps) {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const [editModal, setEditModal] = useState<{
    field: string;
    type: "add" | "edit" | "remove";
    data?: unknown;
  } | null>(null);

  const openSuggest = (
    field: string,
    type: "add" | "edit" | "remove",
    data?: unknown
  ) => {
    requireAuth(() => {
      setEditModal({ field, type, data });
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "PC":
        return <DesktopIcon size={20} />;
      case "Mobile":
        return <DeviceMobileIcon size={20} />;
      case "Switch":
      case "PlayStation":
      case "Xbox":
        return <GameControllerIcon size={20} />;
      default:
        return <MonitorPlayIcon size={20} />;
    }
  };

  const getStoreIcon = (store: string) => {
    if (store.includes("Steam"))
      return <span className="font-bold text-blue-500">Steam</span>;
    if (store.includes("Epic"))
      return <span className="font-bold text-foreground">Epic</span>;
    if (store.includes("GOG"))
      return <span className="font-bold text-purple-500">GOG</span>;
    return <ShoppingCartIcon size={16} />;
  };

  return (
    <aside className="space-y-8 lg:col-span-4">
      <Card className="overflow-hidden border-none shadow-none bg-secondary/10 group">
        <div className="flex flex-col gap-4 p-6 bg-secondary/30">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-5xl font-black tracking-tighter text-primary">
                {game.rating}
              </div>
              <div className="mt-1 text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Index Score
              </div>
            </div>
            <div className="flex gap-0.5 text-primary mb-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  size={20}
                  weight={i < Math.floor(game.rating) ? "fill" : "regular"}
                  className={i >= Math.floor(game.rating) ? "opacity-30" : ""}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {game.externalRatings.map((ex, i) => (
            <div key={i} className="flex items-center gap-2">
              <a
                href={ex.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between flex-1 p-3 text-sm transition-colors rounded-md cursor-pointer bg-background/50 hover:bg-background group/link"
              >
                <span className="flex items-center gap-2 font-medium transition-colors text-muted-foreground group-hover/link:text-primary">
                  {ex.source}{" "}
                  <ArrowSquareOutIcon size={12} className="opacity-50" />
                </span>
                <span className="font-bold text-foreground">{ex.score}</span>
              </a>
              <div className="flex flex-col gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => openSuggest("externalRatings", "edit", ex)}
                  className="cursor-pointer text-muted-foreground hover:text-primary"
                >
                  <PencilSimpleIcon size={14} />
                </button>
                <button
                  onClick={() => openSuggest("externalRatings", "remove", ex)}
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs transition-opacity border opacity-0 cursor-pointer text-muted-foreground dashed border-border/50 group-hover:opacity-100"
            onClick={() => openSuggest("externalRatings", "add")}
          >
            <PlusIcon className="mr-1" /> Add Rating
          </Button>
        </div>
      </Card>
      <Card className="bg-transparent border-none shadow-none group">
        <CardContent className="px-0 pt-0">
          <div className="flex items-center justify-between px-2 mb-4">
            <h4 className="flex items-center gap-2 text-lg font-bold">
              <CheckIcon size={20} className="text-primary" /> Availability
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 rounded-full opacity-0 cursor-pointer group-hover:opacity-100"
              onClick={() => openSuggest("pricing", "add")}
            >
              <PlusIcon />
            </Button>
          </div>
          <div className="space-y-6">
            {game.pricing.map((platformData, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 px-2 mb-3 text-sm font-bold tracking-wide uppercase text-muted-foreground">
                  {getPlatformIcon(platformData.platform)}
                  {platformData.platform}
                </div>
                <div className="space-y-1">
                  {platformData.stores.map((store: Store, sIdx: number) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-1 group/store"
                    >
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between flex-1 p-2 text-sm transition-colors rounded cursor-pointer hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          {getStoreIcon(store.store)}
                          <span className="font-medium transition-colors hover:text-foreground">
                            {store.store}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-background border-border/60"
                        >
                          {store.price}
                        </Badge>
                      </a>
                      <div className="flex flex-col w-6 gap-1 transition-opacity opacity-0 group-hover/store:opacity-100">
                        <button
                          onClick={() =>
                            openSuggest("pricing", "edit", {
                              ...store,
                              platform: platformData.platform,
                            })
                          }
                          className="cursor-pointer text-muted-foreground hover:text-primary"
                        >
                          <PencilSimpleIcon size={12} />
                        </button>
                        <button
                          onClick={() =>
                            openSuggest("pricing", "remove", {
                              ...store,
                              platform: platformData.platform,
                            })
                          }
                          className="cursor-pointer text-muted-foreground hover:text-destructive"
                        >
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {idx !== game.pricing.length - 1 && (
                  <Separator className="my-4 opacity-50" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {game.similarGames.length > 0 && (
        <div>
          <h4 className="mb-4 text-lg font-bold">Similar Games</h4>
          <ScrollArea className="pr-4 h-100">
            <div className="space-y-3">
              {game.similarGames.map((simGame) => (
                <div
                  key={simGame.id}
                  onClick={() => router.push(`/games/${simGame.slug}`)}
                  className="flex gap-3 p-2 transition-colors border border-transparent rounded-lg cursor-pointer hover:bg-secondary/20 group hover:border-border/50"
                >
                  <div className="relative w-24 h-16 overflow-hidden rounded bg-muted shrink-0">
                    {simGame.steamAppId && (
                      <Image
                        src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${simGame.steamAppId}/header.jpg`}
                        className="object-cover"
                        alt={simGame.title}
                        fill
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-sm font-bold transition-colors group-hover:text-primary line-clamp-1">
                      {simGame.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {simGame.subgenre}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

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
    </aside>
  );
}
