"use client";

import {
  StarIcon,
  TimerIcon,
  BookOpenIcon,
  SwordIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Review } from "@/lib/types";
import { useRouter } from "next/navigation";

interface ReviewCardProps {
  review: Review;
  showGameTitle?: boolean;
}

const StatBar = ({ label, value }: { label: string; value: number | null }) => {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        <span>{label}</span>
        <span>{value}/10</span>
      </div>
      <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/80"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
};

export function ReviewCard({ review, showGameTitle = false }: ReviewCardProps) {
  const router = useRouter();

  const hasRatings = [
    review.difficulty,
    review.replayability,
    review.synergyDepth,
    review.complexity,
    review.rngReliance,
    review.userFriendliness,
  ].some((v) => v !== null && v !== undefined);

  const hasTimes =
    review.avgRunLength || review.timeToFirstWin || review.timeTo100;
  const hasTraits = review.narrativePresence || review.combatType;

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (review.user) {
      router.push(`/${review.user}`);
    }
  };

  return (
    <Card
      className="overflow-hidden transition-all duration-300 shadow-sm cursor-pointer border-border/60 hover:shadow-md bg-card/60 group"
      onClick={() =>
        showGameTitle && review.game?.slug
          ? router.push(`/games/${review.game.slug}`)
          : undefined
      }
    >
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 overflow-hidden text-lg font-bold transition-colors rounded-full cursor-pointer bg-secondary text-muted-foreground shrink-0 hover:bg-secondary/80"
            onClick={!showGameTitle ? handleUserClick : undefined}
          >
            {showGameTitle && review.game?.title ? (
              <span className="text-xs font-bold">{review.game.title[0]}</span>
            ) : (
              <span>{review.user ? review.user[0].toUpperCase() : "?"}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4
                className={`font-bold text-sm text-foreground transition-colors ${
                  showGameTitle
                    ? "group-hover:text-primary"
                    : "hover:text-primary hover:underline cursor-pointer"
                }`}
                onClick={!showGameTitle ? handleUserClick : undefined}
              >
                {showGameTitle ? review.game?.title : review.user}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(review.date).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-1 border rounded-full bg-yellow-500/10 border-yellow-500/20">
          <StarIcon weight="fill" className="text-yellow-500" size={14} />
          <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
            {review.rating}/5
          </span>
        </div>
      </div>

      {review.comment && (
        <div className="px-6 pb-6">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {review.comment}
          </p>
        </div>
      )}

      {(hasRatings || hasTimes || hasTraits) && (
        <div className="grid grid-cols-1 gap-6 p-5 text-sm border-t bg-muted/20 border-border/50 md:grid-cols-12">
          {hasRatings && (
            <div className="space-y-3 md:col-span-6">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-primary/80">
                <ChartBarIcon /> GAME FEEL
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <StatBar label="Difficulty" value={review.difficulty ?? null} />
                <StatBar label="Complexity" value={review.complexity ?? null} />
                <StatBar
                  label="Replayability"
                  value={review.replayability ?? null}
                />
                <StatBar label="Synergy" value={review.synergyDepth ?? null} />
                <StatBar label="RNG" value={review.rngReliance ?? null} />
                <StatBar
                  label="Friendliness"
                  value={review.userFriendliness ?? null}
                />
              </div>
            </div>
          )}

          {hasTimes && (
            <div className="pt-4 space-y-3 border-t md:col-span-3 md:border-t-0 md:border-l border-border/50 md:pt-0 md:pl-6">
              <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-primary/80">
                <TimerIcon /> TIME
              </div>
              <div className="space-y-2">
                {review.avgRunLength && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Run Length</span>
                    <span className="font-medium">{review.avgRunLength}</span>
                  </div>
                )}
                {review.timeToFirstWin && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">First Win</span>
                    <span className="font-medium">{review.timeToFirstWin}</span>
                  </div>
                )}
                {review.timeTo100 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">100% Comp</span>
                    <span className="font-medium">{review.timeTo100}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasTraits && (
            <div className="pt-4 space-y-3 border-t md:col-span-3 md:border-t-0 md:border-l border-border/50 md:pt-0 md:pl-6">
              <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-primary/80">
                <BookOpenIcon /> TRAITS
              </div>
              <div className="flex flex-col gap-2">
                {review.narrativePresence && (
                  <div className="text-xs">
                    <span className="text-muted-foreground block mb-0.5">
                      Narrative
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border/50 font-medium">
                      {review.narrativePresence}
                    </span>
                  </div>
                )}
                {review.combatType && (
                  <div className="text-xs">
                    <span className="text-muted-foreground block mb-0.5">
                      Combat
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border/50 font-medium">
                      <SwordIcon size={12} className="text-muted-foreground" />
                      {review.combatType}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
