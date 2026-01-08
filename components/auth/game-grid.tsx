"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface GridGame {
  id: string;
  slug: string;
}

interface ColumnProps {
  items: GridGame[];
  duration: string;
}

function Column({ items, duration }: ColumnProps) {
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
          <Image
            src={`/api/games/${game.slug}/image/header`}
            alt="Game"
            fill
            className="object-cover opacity-60 hover:opacity-100 transition-opacity duration-500"
            sizes="(max-width: 768px) 33vw, 20vw"
          />
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
    fetch("/api/games/grid")
      .then((res) => res.json())
      .then((data) => {
        if (data.games && Array.isArray(data.games)) {
          setGames(data.games);
          setTotalCount(data.totalCount || 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  const col1 = games.slice(0, 10);
  const col2 = games.slice(10, 20);
  const col3 = games.slice(20, 30);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black/80">
      <div className="absolute inset-0 bg-linear-to-r from-black via-transparent to-transparent z-10" />
      <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10" />

      <div className="absolute top-12 left-12 z-20 max-w-md">
        <h1 className="text-5xl font-black text-white tracking-tighter mb-4 drop-shadow-xl">
          Discover {totalCount > 0 ? totalCount : "thousands of"} unique
          roguelikes.
        </h1>
        <p className="text-lg text-white/70 leading-relaxed">
          Join the community and find your next obsession in the largest curated
          index of roguelike games.
        </p>
      </div>

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
