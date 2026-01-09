"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GameControllerIcon } from "@phosphor-icons/react";

interface GridGame {
  id: string;
  slug: string;
  image: string | null;
}

function Column({ items, duration }: { items: GridGame[]; duration: string }) {
  return (
    <div
      className="flex flex-col gap-4 animate-marquee"
      style={{ animationDuration: duration }}
    >
      {[...items, ...items].map((game, i) => (
        <div
          key={`${game.id}-${i}`}
          className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary/20 border border-white/5 shadow-lg shrink-0"
        >
          {game.image ? (
            <Image
              src={game.image}
              alt="Game"
              fill
              className="object-cover opacity-60 hover:opacity-100 transition-opacity duration-500"
              sizes="(max-width: 768px) 33vw, 20vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <GameControllerIcon size={32} className="text-zinc-700" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function GameGrid() {
  const [games, setGames] = useState<GridGame[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch static manifest directly from public folder
    // Note: We catch errors and return an empty array to prevent crashes
    const fetchManifest = fetch("/game-images/grid-manifest.json")
      .then((res) => res.json())
      .catch((e) => {
        console.error("Failed to load grid manifest:", e);
        return [];
      });

    // Fetch live count from API
    const fetchCount = fetch("/api/games/grid")
      .then((res) => res.json())
      .catch(() => ({ totalCount: 0 }));

    Promise.all([fetchManifest, fetchCount]).then(([manifestData, apiData]) => {
      // Handle manifestData being an array (your current format) OR an object (previous format)
      let loadedGames: GridGame[] = [];

      if (Array.isArray(manifestData)) {
        loadedGames = manifestData;
      } else if (manifestData && Array.isArray(manifestData.games)) {
        loadedGames = manifestData.games;
      }

      if (loadedGames.length > 0) {
        setGames(loadedGames);
      }

      if (apiData.totalCount) {
        setTotalCount(apiData.totalCount);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  const col1 = games.slice(0, 10);
  const col2 = games.slice(10, 20);
  const col3 = games.slice(20, 30);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black/90">
      <div className="absolute inset-0 bg-linear-to-r from-black via-transparent to-transparent z-10" />
      <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10" />

      {/* Content Overlay */}
      <div className="absolute top-12 left-12 z-20 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-4 backdrop-blur-md "></div>
        <h1 className="text-5xl font-black text-white tracking-tighter mb-4 drop-shadow-xl">
          Discover {totalCount > 0 ? totalCount : "thousands of"} unique
          roguelikes.
        </h1>
        <p className="text-lg text-white/70 leading-relaxed">
          Join the community and find your next obsession in the largest curated
          index of roguelike games.
        </p>
      </div>

      {/* Grid Columns */}
      <div className="grid grid-cols-3 gap-4 h-[150%] -mt-10 opacity-40 rotate-6 scale-110 origin-top-left">
        <Column items={col1} duration="40s" />
        <Column items={col2} duration="55s" />
        <Column items={col3} duration="45s" />
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        .animate-marquee {
          animation-name: marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
