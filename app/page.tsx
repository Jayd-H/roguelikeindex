"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GameControllerIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Header } from "@/components/ui/header";

interface GridGame {
  id: string;
  slug: string;
  image: string | null;
}

function Column({
  items,
  duration,
  className = "",
}: {
  items: GridGame[];
  duration: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 animate-marquee ${className}`}
      style={{ animationDuration: duration }}
    >
      {[...items, ...items].map((game, i) => (
        <div
          key={`${game.id}-${i}`}
          className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-500 border border-white/5 shadow-lg shrink-0"
        >
          {game.image ? (
            <Image
              src={game.image}
              alt="Game"
              fill
              className="object-cover opacity-80 hover:opacity-100 transition-opacity duration-500"
              sizes="20vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <GameControllerIcon size={32} className="text-zinc-700" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [games, setGames] = useState<GridGame[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManifest = fetch("/game-images/grid-manifest.json")
      .then((res) => res.json())
      .catch((e) => {
        console.error("Failed to load grid manifest:", e);
        return [];
      });

    const fetchCount = fetch("/api/games/grid")
      .then((res) => res.json())
      .catch(() => ({ totalCount: 0 }));

    Promise.all([fetchManifest, fetchCount]).then(([manifestData, apiData]) => {
      // Handle manifestData being an array (your current format) OR an object
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

  // Use real games if available, otherwise generate placeholders for the visual effect
  const displayGames =
    games.length > 0
      ? games
      : Array.from({ length: 49 }).map((_, i) => ({
          id: `placeholder-${i}`,
          slug: "",
          image: null,
        }));

  // Split games into 7 columns for desktop coverage
  const chunks = [];
  const chunkSize = Math.ceil(displayGames.length / 7);
  for (let i = 0; i < displayGames.length; i += chunkSize) {
    chunks.push(displayGames.slice(i, i + chunkSize));
  }

  const columns = chunks.length > 0 ? chunks : [[], [], [], [], [], [], []];

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col font-sans">
      <div className="z-50">
        <Header />
      </div>

      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/70 z-10" />
        <div className="absolute inset-0 bg-linear-to-b from-black via-transparent to-black z-10" />
        <div className="absolute inset-0 bg-linear-to-r from-black via-transparent to-black z-10" />

        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 h-[150%] -mt-20 opacity-90 rotate-3 scale-105 origin-center">
          <Column items={columns[0] || []} duration="45s" />
          <Column items={columns[1] || []} duration="60s" />
          <Column items={columns[2] || []} duration="50s" />
          <Column
            items={columns[3] || []}
            duration="70s"
            className="hidden md:flex"
          />
          <Column
            items={columns[4] || []}
            duration="55s"
            className="hidden md:flex"
          />
          <Column
            items={columns[5] || []}
            duration="65s"
            className="hidden lg:flex"
          />
          <Column
            items={columns[6] || []}
            duration="48s"
            className="hidden lg:flex"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
              Roguelike<span className="text-primary">Index</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
              The centralized database for roguelike and roguelite games.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-zinc-300 text-sm font-medium backdrop-blur-sm">
              <GameControllerIcon
                weight="fill"
                className="text-primary"
                size={16}
              />
              {loading
                ? "Loading database..."
                : `Tracking ${totalCount.toLocaleString()} Games`}
            </span>
          </div>

          <div className="pt-4">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg rounded-full shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_60px_-15px_rgba(var(--primary),0.6)] transition-all duration-300"
            >
              <Link href="/games">
                Explore the Database
                <ArrowRightIcon weight="bold" className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

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
