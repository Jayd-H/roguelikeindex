"use client";

import { useState } from "react";
import Image from "next/image";
import {
  StarIcon,
  User,
  BookmarkSimple,
  PencilSimple,
} from "@phosphor-icons/react";
import { motion, Variants } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

interface GamePreview {
  id: string;
  slug: string;
  title: string;
  image: string | null;
}

interface GameList {
  id: string;
  title: string;
  description: string;
  type: "automatic" | "user";
  creator?: string;
  averageRating?: number;
  gameCount: number;
  games: GamePreview[];
  isSaved?: boolean;
  userRating?: number;
  isOwner?: boolean;
}

export function ListCard({ list: initialList }: { list: GameList }) {
  const { requireAuth, refreshUser } = useAuth();
  const [list, setList] = useState(initialList);
  const displayGames = list.games.slice(0, 10);
  const totalGames = displayGames.length;
  const rating = list.averageRating || 0;

  const handleRate = (score: number) => {
    requireAuth(async () => {
      setList((prev) => ({ ...prev, userRating: score }));
      try {
        await fetch(`/api/lists/${list.id}/rate`, {
          method: "POST",
          body: JSON.stringify({ rating: score }),
        });
        refreshUser();
      } catch {
        setList((prev) => ({ ...prev, userRating: initialList.userRating }));
      }
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(async () => {
      setList((prev) => ({ ...prev, isSaved: !prev.isSaved }));
      try {
        await fetch(`/api/lists/${list.id}/save`, { method: "POST" });
        refreshUser();
      } catch {
        setList((prev) => ({ ...prev, isSaved: initialList.isSaved }));
      }
    });
  };

  const cardVariants: Variants = {
    initial: (i: number) => {
      // Creates a visible "hand" fan immediately
      const center = (totalGames - 1) / 2;
      const offset = i - center;
      return {
        x: offset * 24, // Significant overlap but visible spread
        y: Math.abs(offset) * 4, // Slight arch
        rotate: offset * 3, // Slight rotation
        scale: 1,
        zIndex: i,
        transition: { duration: 0.4, ease: "easeOut" },
      };
    },
    hover: (i: number) => {
      // Dramatic spray on hover
      const center = (totalGames - 1) / 2;
      const offset = i - center;
      return {
        x: offset * 45,
        y: Math.abs(offset) * 12 - 20,
        rotate: offset * 12,
        scale: 1.15,
        zIndex: 20 + i,
        transition: { type: "spring", stiffness: 220, damping: 18 },
      };
    },
  };

  return (
    <motion.div
      className="relative w-80 h-[28rem] shrink-0 cursor-pointer snap-start group"
      initial="initial"
      whileHover="hover"
    >
      <div className="absolute inset-0 bg-transparent rounded-3xl transition-all duration-300 group-hover:bg-secondary/5 border border-transparent group-hover:border-white/5">
        <div className="h-full flex flex-col p-5">
          {/* Deck Area */}
          <div className="relative h-64 w-full mb-4 flex items-center justify-center perspective-1000">
            {totalGames > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center pt-8">
                {displayGames.map((game, i) => (
                  <motion.div
                    key={game.id}
                    custom={i}
                    variants={cardVariants}
                    className="absolute h-48 w-32 rounded-xl shadow-2xl overflow-hidden bg-zinc-900 origin-bottom"
                    style={{
                      transformOrigin: "bottom center",
                      left: "50%",
                      marginLeft: "-4rem", // Center anchor
                    }}
                  >
                    <div className="relative w-full h-full">
                      {game.image ? (
                        <Image
                          src={game.image}
                          alt={game.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                          <span className="text-xs font-bold text-zinc-600">
                            {game.title[0]}
                          </span>
                        </div>
                      )}
                      {/* Shadow Overlay */}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-muted-foreground text-sm">
                Empty List
              </div>
            )}
          </div>

          {/* Info Area */}
          <div className="mt-auto space-y-4 px-1 relative z-30">
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-xl leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {list.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 shrink-0 -mt-1 ${
                    list.isSaved
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={handleSave}
                >
                  {list.isSaved ? (
                    <BookmarkSimple weight="fill" size={20} />
                  ) : (
                    <BookmarkSimple size={20} />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5em]">
                {list.description || "No description provided."}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 group/stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRate(star);
                    }}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <StarIcon
                      size={16}
                      weight={
                        (list.userRating || Math.round(rating)) >= star
                          ? "fill"
                          : "regular"
                      }
                      className={`transition-colors ${
                        (list.userRating || 0) >= star
                          ? "text-yellow-400"
                          : Math.round(rating) >= star
                          ? "text-yellow-500/50"
                          : "text-muted-foreground/20"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    {rating.toFixed(1)}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
                {list.gameCount} games
              </span>
            </div>

            {list.type === "user" && (
              <div className="pt-3 border-t border-border/30 flex items-center justify-between text-muted-foreground">
                <div className="flex items-center gap-2 text-xs font-medium hover:text-foreground transition-colors">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                    <User weight="fill" size={12} />
                  </div>
                  <span className="truncate max-w-30">{list.creator}</span>
                </div>
                {list.isOwner && (
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <PencilSimple size={14} /> Edit
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
