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
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Skeleton } from "@/components/ui/skeleton";

export default function GameDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, requireAuth, refreshUser } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  const [myReview, setMyReview] = useState<Review | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [owned, setOwned] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isDeleteReviewModalOpen, setIsDeleteReviewModalOpen] = useState(false);

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

  const handleConfirmDeleteReview = async () => {
    const res = await fetch(`/api/games/${slug}/review`, {
      method: "DELETE",
    });

    if (res.ok) {
      setMyReview(null);
      refreshUser();
      setIsDeleteReviewModalOpen(false);
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />

        {/* Hero Skeleton */}
        <div className="relative w-full h-100 md:h-125 bg-black/90 overflow-hidden">
          <Skeleton className="w-full h-full opacity-10" />
          <div className="absolute bottom-0 left-0 w-full z-20 pb-8 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="w-full max-w-2xl space-y-6">
                <Skeleton className="h-16 w-3/4 bg-white/10 rounded-lg" />
                <div className="flex gap-3">
                  <Skeleton className="h-6 w-24 bg-white/10 rounded-full" />
                  <Skeleton className="h-6 w-32 bg-white/10 rounded-full" />
                </div>
                <div className="flex gap-8 pt-2">
                  <Skeleton className="h-5 w-32 bg-white/10" />
                  <Skeleton className="h-5 w-32 bg-white/10" />
                  <Skeleton className="h-5 w-32 bg-white/10" />
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <Skeleton className="h-12 w-36 rounded-full bg-white/10" />
                <Skeleton className="h-12 w-32 rounded-full bg-white/10" />
                <Skeleton className="h-12 w-36 rounded-full bg-white/10" />
                <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto w-full px-6 py-4 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-10">
              {/* Stats Skeleton */}
              <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-6 w-24 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Reviews Skeleton */}
              <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/60 bg-card/60 p-6 space-y-4"
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-7 w-16 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="lg:col-span-4 space-y-8">
              <div className="rounded-xl bg-secondary/10 p-6 h-48 flex flex-col justify-between">
                <div className="space-y-2 mt-auto">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-5 w-5 rounded-sm" />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-16 w-24 rounded-md" />
                      <div className="space-y-2 py-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
              onDeleteReview={() => setIsDeleteReviewModalOpen(true)}
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

      <ConfirmationModal
        isOpen={isDeleteReviewModalOpen}
        onClose={() => setIsDeleteReviewModalOpen(false)}
        onConfirm={handleConfirmDeleteReview}
        title="Delete Review?"
        description="Are you sure you want to delete your review? This action cannot be undone."
      />
    </div>
  );
}
