"use client";

import React, { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/components/auth-provider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Game, Review } from "@/lib/types";
import { GameHero } from "@/components/game-details/game-hero";
import { GameStats } from "@/components/game-details/game-stats";
import { GameReviews } from "@/components/game-details/game-reviews";
import { GameSidebar } from "@/components/game-details/game-sidebar";
import { AddToListModal } from "@/components/lists/add-to-list-modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { SuggestionReviewCard } from "@/components/game-details/suggestion-review-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CaretDown,
  CaretUp,
  UsersIcon,
  WarningCircleIcon,
  CheckIcon,
} from "@phosphor-icons/react";

interface Suggestion {
  id: string;
  targetField: string;
  operation: string;
  originalValue: unknown;
  suggestedValue: unknown;
  voteCount: number;
  suggester: string;
  createdAt: string;
}

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

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Pending Status
  const [hasVotedApproval, setHasVotedApproval] = useState(false);
  const [approvalVotes, setApprovalVotes] = useState(0);
  const [approvalError, setApprovalError] = useState("");

  // Determine if the current user submitted this game
  const isSubmitter =
    user?.id && game?.submitterId && user.id === game.submitterId;

  // Fetch Game Data
  useEffect(() => {
    let mounted = true;
    if (slug) {
      fetch(`/api/games/${slug}`)
        .then((res) => {
          if (!res.ok) throw new Error("Game not found");
          return res.json();
        })
        .then((data) => {
          if (mounted) {
            setGame(data);
            setApprovalVotes(data.approvalVotes || 0);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) {
            setLoading(false);
            router.push("/404");
          }
        });
    }
    return () => {
      mounted = false;
    };
  }, [slug, router]);

  // Fetch User Status & Suggestions
  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      try {
        const res = await fetch(`/api/games/${slug}/suggestions`);
        const data = await res.json();
        if (mounted && data.suggestions) {
          setSuggestions(data.suggestions);
          setVotedIds(data.votedIds || []);
        }
      } catch (e) {
        console.error(e);
      }

      if (user) {
        try {
          const res = await fetch(`/api/games/${slug}/status`);
          const data = await res.json();
          if (mounted) {
            setFavorited(data.favorited);
            setOwned(data.owned);
            if (data.review) {
              setMyReview(data.review);
            }
            setStatusLoaded(true);
          }
        } catch (e) {
          console.error(e);
          if (mounted) setStatusLoaded(true);
        }
      } else {
        if (mounted) setStatusLoaded(true);
      }
    };

    if (slug) {
      loadUserData();
    }

    return () => {
      mounted = false;
    };
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

  const handleVote = async (id: string, vote: number) => {
    requireAuth(async () => {
      const res = await fetch(`/api/suggestions/${id}/vote`, {
        method: "POST",
        body: JSON.stringify({ vote }),
      });
      if (res.ok) {
        setVotedIds((prev) => [...prev, id]);
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, voteCount: s.voteCount + vote } : s
          )
        );

        const data = await res.json();
        if (data.status !== "pending") {
          const refreshRes = await fetch(`/api/games/${slug}/suggestions`);
          const refreshData = await refreshRes.json();
          if (refreshData.suggestions) {
            setSuggestions(refreshData.suggestions);
          }
          if (data.status === "approved") window.location.reload();
        }
      }
    });
  };

  const handleApproveGame = async () => {
    requireAuth(async () => {
      setApprovalError("");
      const res = await fetch(`/api/games/${slug}/approve`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setHasVotedApproval(true);
        setApprovalVotes(data.votes);
        if (data.approved) {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        const json = await res.json();
        setApprovalError(json.error || "Failed to approve");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-sans bg-background">
        <Header />
        <div className="relative w-full overflow-hidden h-100 md:h-125 bg-black/90">
          <Skeleton className="w-full h-full opacity-10" />
        </div>
        <main className="flex-1 w-full px-6 py-4 mx-auto max-w-7xl">
          <Skeleton className="w-full h-96" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!game) return notFound();

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background">
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

      {game.status === "pending" && (
        <div className="w-full bg-yellow-500/10 border-y border-yellow-500/20 backdrop-blur-md sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <WarningCircleIcon
                size={24}
                className="text-yellow-500 shrink-0"
                weight="fill"
              />
              <div>
                <h3 className="font-bold text-foreground">Under Review</h3>
                <p className="text-sm text-muted-foreground">
                  This game was submitted by the community and is currently
                  pending approval.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-4">
                <div className="text-sm font-bold text-yellow-500">
                  {approvalVotes} / 5 Votes
                </div>

                {/* Voting Buttons: Hidden for submitter */}
                {!isSubmitter && (
                  <>
                    {hasVotedApproval ? (
                      <Button
                        disabled
                        variant="secondary"
                        className="gap-2 cursor-not-allowed"
                      >
                        <CheckIcon /> Voted
                      </Button>
                    ) : (
                      <Button
                        onClick={handleApproveGame}
                        className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold cursor-pointer"
                      >
                        <CheckIcon weight="bold" /> This Page is Accurate
                      </Button>
                    )}
                  </>
                )}
              </div>

              {approvalError && (
                <span className="text-xs text-red-500 font-medium">
                  {approvalError}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full px-6 py-4 mx-auto max-w-7xl">
        {suggestions.length > 0 && (
          <Collapsible
            open={showSuggestions}
            onOpenChange={setShowSuggestions}
            className="mb-8 overflow-hidden border border-border/50 rounded-xl bg-secondary/5"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 transition-colors cursor-pointer hover:bg-secondary/10">
              <div className="flex items-center gap-2 text-sm font-bold">
                <UsersIcon size={18} className="text-primary" />
                Community Edits ({suggestions.length})
              </div>
              {showSuggestions ? <CaretUp /> : <CaretDown />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0">
              <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((s) => (
                  <SuggestionReviewCard
                    key={s.id}
                    suggestion={s}
                    hasVoted={votedIds.includes(s.id)}
                    onVote={handleVote}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-8">
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
