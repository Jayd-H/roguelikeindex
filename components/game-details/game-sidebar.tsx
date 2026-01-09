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
    <aside className="lg:col-span-4 space-y-8">
      <Card className="bg-secondary/10 border-none shadow-none overflow-hidden group">
        <div className="bg-secondary/30 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-5xl font-black text-primary tracking-tighter">
                {game.rating}
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
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
            <div key={i} className="flex gap-2 items-center">
              <a
                href={ex.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex justify-between text-sm items-center p-3 rounded-md bg-background/50 hover:bg-background transition-colors cursor-pointer group/link"
              >
                <span className="font-medium text-muted-foreground group-hover/link:text-primary transition-colors flex items-center gap-2">
                  {ex.source}{" "}
                  <ArrowSquareOutIcon size={12} className="opacity-50" />
                </span>
                <span className="font-bold text-foreground">{ex.score}</span>
              </a>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openSuggest("externalRatings", "edit", ex)}
                  className="text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <PencilSimpleIcon size={14} />
                </button>
                <button
                  onClick={() => openSuggest("externalRatings", "remove", ex)}
                  className="text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground dashed border border-border/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => openSuggest("externalRatings", "add")}
          >
            <PlusIcon className="mr-1" /> Add Rating
          </Button>
        </div>
      </Card>
      <Card className="border-none shadow-none bg-transparent group">
        <CardContent className="px-0 pt-0">
          <div className="flex justify-between items-center mb-4 px-2">
            <h4 className="font-bold text-lg flex items-center gap-2">
              <CheckIcon size={20} className="text-primary" /> Availability
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer"
              onClick={() => openSuggest("pricing", "add")}
            >
              <PlusIcon />
            </Button>
          </div>
          <div className="space-y-6">
            {game.pricing.map((platformData, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-3 px-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  {getPlatformIcon(platformData.platform)}
                  {platformData.platform}
                </div>
                <div className="space-y-1">
                  {platformData.stores.map((store: Store, sIdx: number) => (
                    <div
                      key={sIdx}
                      className="flex gap-1 items-center group/store"
                    >
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-between text-sm cursor-pointer hover:bg-secondary/50 p-2 rounded transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {getStoreIcon(store.store)}
                          <span className="font-medium hover:text-foreground transition-colors">
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
                      <div className="flex flex-col gap-1 opacity-0 group-hover/store:opacity-100 transition-opacity w-6">
                        <button
                          onClick={() =>
                            openSuggest("pricing", "edit", {
                              ...store,
                              platform: platformData.platform,
                            })
                          }
                          className="text-muted-foreground hover:text-primary cursor-pointer"
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
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
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
          <h4 className="font-bold text-lg mb-4">Similar Games</h4>
          <ScrollArea className="h-100 pr-4">
            <div className="space-y-3">
              {game.similarGames.map((simGame) => (
                <div
                  key={simGame.id}
                  onClick={() => router.push(`/games/${simGame.slug}`)}
                  className="flex gap-3 p-2 rounded-lg hover:bg-secondary/20 cursor-pointer transition-colors group border border-transparent hover:border-border/50"
                >
                  <div className="h-16 w-24 bg-muted rounded overflow-hidden shrink-0 relative">
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
                    <span className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">
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
