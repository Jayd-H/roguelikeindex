"use client";

import React, { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/components/auth-provider";
import { Separator } from "@/components/ui/separator";
import { Game, Review } from "@/lib/types";
import { GameHero } from "@/components/game-details/game-hero";
import { GameStats } from "@/components/game-details/game-stats";
import { GameReviews } from "@/components/game-details/game-reviews";
import { GameSidebar } from "@/components/game-details/game-sidebar";
import { AddToListModal } from "@/components/lists/add-to-list-modal";

export default function GameDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, requireAuth, refreshUser } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  // Status state
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [owned, setOwned] = useState(false);
  const [favorited, setFavorited] = useState(false);

  // Modal State
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetch(`/api/games/${slug}`)
        .then((res) => {
          if (!res.ok) throw new Error("Game not found");
          return res.json();
        })
        .then((data) => {
          setGame(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          router.push("/404");
        });
    }
  }, [slug, router]);

  useEffect(() => {
    if (user && slug) {
      fetch(`/api/games/${slug}/status`)
        .then((res) => res.json())
        .then((data) => {
          setFavorited(data.favorited);
          setOwned(data.owned);
          if (data.review) {
            setMyReview(data.review);
          }
          setStatusLoaded(true);
        });
    } else {
      const timer = setTimeout(() => setStatusLoaded(true), 0);
      return () => clearTimeout(timer);
    }
  }, [user, slug]);

  const toggleOwned = () =>
    requireAuth(async () => {
      const res = await fetch(`/api/games/${slug}/toggle-owned`, {
        method: "POST",
      });
      const data = await res.json();
      setOwned(data.owned);
      refreshUser();
    });

  const toggleFavorite = () =>
    requireAuth(async () => {
      const res = await fetch(`/api/games/${slug}/toggle-favorite`, {
        method: "POST",
      });
      const data = await res.json();
      setFavorited(data.favorited);
      refreshUser();
    });

  const handleAddToList = () => {
    requireAuth(() => {
      setIsAddToListOpen(true);
    });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  if (!game) return notFound();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <GameHero
        game={game}
        statusLoaded={statusLoaded}
        owned={owned}
        favorited={favorited}
        toggleOwned={toggleOwned}
        toggleFavorite={toggleFavorite}
        onAddToList={handleAddToList}
      />

      <main className="max-w-7xl mx-auto w-full px-6 py-4 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-10">
            <GameStats game={game} />
            <Separator />
            <GameReviews
              game={game}
              initialReviews={game.reviews}
              initialMyReview={myReview}
              currentUser={user}
              requireAuth={requireAuth}
              refreshUser={refreshUser}
            />
          </div>
          <GameSidebar game={game} />
        </div>
      </main>
      <Footer />

      <AddToListModal
        isOpen={isAddToListOpen}
        onClose={() => setIsAddToListOpen(false)}
        gameId={game.id}
      />
    </div>
  );
}
