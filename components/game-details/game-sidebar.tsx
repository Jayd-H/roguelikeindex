"use client";

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
} from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Game } from "@/lib/types";

interface GameSidebarProps {
  game: Game;
  requireAuth: (action: () => void) => void;
}

export function GameSidebar({ game, requireAuth }: GameSidebarProps) {
  const router = useRouter();

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
      <Card className="bg-secondary/10 border-none shadow-none overflow-hidden">
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
            <a
              key={i}
              href={ex.url}
              target="_blank"
              className="flex justify-between text-sm items-center p-3 rounded-md bg-background/50 hover:bg-background transition-colors cursor-pointer group"
            >
              <span className="font-medium text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                {ex.source}{" "}
                <ArrowSquareOutIcon size={12} className="opacity-50" />
              </span>
              <span className="font-bold text-foreground">{ex.score}</span>
            </a>
          ))}
        </div>
      </Card>
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="px-0 pt-0">
          <h4 className="font-bold text-lg flex items-center gap-2 mb-4 px-2">
            <CheckIcon size={20} className="text-primary" /> Availability
          </h4>
          <div className="space-y-6">
            {game.pricing.map((platformData, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-3 px-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  {getPlatformIcon(platformData.platform)}
                  {platformData.platform}
                </div>
                <div className="space-y-1">
                  {platformData.stores.map((store, sIdx) => (
                    <a
                      key={sIdx}
                      href={store.url}
                      className="flex items-center justify-between text-sm group cursor-pointer hover:bg-secondary/50 p-2 rounded transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {getStoreIcon(store.store)}
                        <span className="font-medium group-hover:text-foreground transition-colors">
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
                  onClick={() =>
                    requireAuth(() => router.push(`/games/${simGame.slug}`))
                  }
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
    </aside>
  );
}
