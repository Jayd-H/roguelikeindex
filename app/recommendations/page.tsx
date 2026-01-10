"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { GameCard } from "@/components/games/game-card";
import { Button } from "@/components/ui/button";
import {
  SparkleIcon,
  LockKeyIcon,
  LightningIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { Game } from "@/lib/types";

interface Recommendation extends Game {
  confidenceScore: number;
}

export default function RecommendationsPage() {
  const [games, setGames] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<
    "analyzing" | "matching" | "finalizing" | "done"
  >("analyzing");
  const [locked, setLocked] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      // Stage 1: Analyzing
      setLoadingStage("analyzing");

      try {
        const res = await fetch("/api/recommendations");
        const data = await res.json();

        // Ensure at least 600ms for stage 1
        await new Promise((r) => setTimeout(r, 600));
        setLoadingStage("matching");

        // Ensure at least 600ms for stage 2
        await new Promise((r) => setTimeout(r, 600));
        setLoadingStage("finalizing");

        // Short pause for "Finalizing" before showing content
        await new Promise((r) => setTimeout(r, 400));

        if (data.status === "insufficient_data") {
          setLocked(true);
          setReviewCount(data.count);
        } else if (data.recommendations) {
          setGames(data.recommendations);
        }

        setLoadingStage("done");
        setTimeout(() => setLoading(false), 200); // Slight delay to let 'done' animation play
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
      <Header />

      <main className="flex-1 w-full max-w-6xl px-6 py-12 mx-auto">
        <div className="w-full max-w-3xl mx-auto mb-16 text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tighter md:text-5xl">
            Your Personal Picks
          </h1>
          <p className="text-muted-foreground">
            Our algorithm analyzes your playstyle and compares it with similar
            users to find your next obsession.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-100 space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative flex items-center justify-center w-20 h-20">
              {loadingStage === "done" ? (
                <CheckCircleIcon
                  weight="fill"
                  className="text-green-500 w-20 h-20 animate-in zoom-in spin-in-180 duration-500"
                />
              ) : (
                <>
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <SparkleIcon
                    weight="fill"
                    className="text-primary w-8 h-8 animate-pulse"
                  />
                </>
              )}
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold tracking-tight min-w-50">
                {loadingStage === "analyzing" && "Analyzing Library..."}
                {loadingStage === "matching" && "Finding Similar Players..."}
                {loadingStage === "finalizing" && "Curating Selection..."}
                {loadingStage === "done" && "Recommendations Ready!"}
              </h3>
              <p className="text-sm text-muted-foreground">
                This uses live data from the Index.
              </p>
            </div>
          </div>
        ) : locked ? (
          <div className="relative overflow-hidden border-2 border-dashed rounded-3xl border-border/50 bg-secondary/5 px-6 py-20 text-center max-w-3xl mx-auto">
            <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
              <div className="p-4 mb-6 rounded-full bg-secondary text-muted-foreground shadow-sm">
                <LockKeyIcon size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-3">
                Unlock Recommendations
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                You&apos;ve reviewed <strong>{reviewCount}</strong>{" "}
                {reviewCount === 1 ? "game" : "games"}. To generate accurate
                personalized picks, we need you to review at least{" "}
                <strong>3 games</strong>.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-full h-12 px-8 text-base cursor-pointer"
              >
                <Link href="/games">Start Reviewing</Link>
              </Button>
            </div>
          </div>
        ) : games.length > 0 ? (
          <div className="space-y-12">
            {games.map((game, index) => (
              <div
                key={game.id}
                className="relative group animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Rank Number */}
                  <div className="hidden md:flex flex-col items-center justify-start pt-2 w-16 shrink-0 text-muted-foreground/20 font-black text-6xl select-none">
                    0{index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 w-full min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="md:hidden font-black text-muted-foreground/40 mr-2 text-xl">
                        #{index + 1}
                      </span>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold shadow-sm border border-primary/20">
                        <LightningIcon weight="fill" />
                        {game.confidenceScore}% Confidence
                      </div>
                    </div>

                    <div className="transition-all duration-300 group-hover:-translate-y-1">
                      <GameCard game={game} />
                    </div>
                  </div>
                </div>
                {index !== games.length - 1 && (
                  <div className="h-px w-full bg-border/40 mt-12 ml-0 md:ml-24" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-6 border rounded-3xl bg-secondary/5 border-border/50 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-secondary text-muted-foreground">
              <SparkleIcon size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">No matches found yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              We couldn&apos;t find any strong recommendations based on your
              current reviews. Try reviewing more varied games!
            </p>
            <Button variant="outline" asChild className="cursor-pointer">
              <Link href="/games">Browse Games</Link>
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
