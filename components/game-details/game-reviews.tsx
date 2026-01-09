"use client";

import React, { useState, useEffect } from "react";
import {
  StarIcon,
  PencilIcon,
  TimerIcon,
  SwordIcon,
  BookOpenIcon,
  ChartBarIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Review, Game } from "@/lib/types";

interface GameReviewsProps {
  game: Game;
  initialReviews: Review[];
  initialMyReview: Review | null;
  currentUser: { id: string; name: string | null } | null;
  requireAuth: (action: () => void) => void;
  refreshUser: () => void;
  onDeleteReview: () => void;
}

const StatBar = ({ label, value }: { label: string; value: number | null }) => {
  if (value === null) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        <span>{label}</span>
        <span>{value}/10</span>
      </div>
      <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/80 rounded-full"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
};

export function GameReviews({
  game,
  initialReviews,
  initialMyReview,
  currentUser,
  requireAuth,
  refreshUser,
  onDeleteReview,
}: GameReviewsProps) {
  const [reviewsList, setReviewsList] = useState<Review[]>(initialReviews);
  const [myReview, setMyReview] = useState<Review | null>(initialMyReview);
  const [isEditing, setIsEditing] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [difficulty, setDifficulty] = useState(5);
  const [replayability, setReplayability] = useState(5);
  const [synergyDepth, setSynergyDepth] = useState(5);
  const [complexity, setComplexity] = useState(5);
  const [rngReliance, setRngReliance] = useState(5);
  const [userFriendliness, setUserFriendliness] = useState(5);

  const [avgRunLength, setAvgRunLength] = useState("");
  const [timeWin, setTimeWin] = useState("");
  const [time100, setTime100] = useState("");
  const [timeError, setTimeError] = useState("");

  const [combatType, setCombatType] = useState<string>("");
  const [narrativePresence, setNarrativePresence] = useState<string>("");

  useEffect(() => {
    setReviewsList(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    setMyReview(initialMyReview);
    if (initialMyReview) {
      setUserRating(initialMyReview.rating);
      setReviewText(initialMyReview.comment);
      setDifficulty(initialMyReview.difficulty || 5);
      setReplayability(initialMyReview.replayability || 5);
      setSynergyDepth(initialMyReview.synergyDepth || 5);
      setComplexity(initialMyReview.complexity || 5);
      setRngReliance(initialMyReview.rngReliance || 5);
      setUserFriendliness(initialMyReview.userFriendliness || 5);
      setAvgRunLength(initialMyReview.avgRunLength || "");
      setTimeWin(initialMyReview.timeToFirstWin || "");
      setTime100(initialMyReview.timeTo100 || "");
      setCombatType(initialMyReview.combatType || "");
      setNarrativePresence(initialMyReview.narrativePresence || "");
    }
  }, [initialMyReview]);

  const handleRatingClick = (rating: number) =>
    requireAuth(() => {
      setUserRating(rating);
      setIsReviewFormOpen(true);
    });

  const validateTime = (val: string) =>
    /^\d+(h|m|h\+)$/.test(val) || val === "";

  const handleTimeChange = (val: string, setter: (v: string) => void) => {
    setter(val);
    setTimeError(val && !validateTime(val) ? "Format: 15h, 30m" : "");
  };

  const submitReview = async () => {
    const res = await fetch(`/api/games/${game.slug}/review`, {
      method: "POST",
      body: JSON.stringify({
        rating: userRating,
        comment: reviewText,
        difficulty,
        replayability,
        synergyDepth,
        complexity,
        rngReliance,
        userFriendliness,
        avgRunLength,
        timeToFirstWin: timeWin,
        timeTo100: time100,
        combatType,
        narrativePresence,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setMyReview(data.review);
      setIsEditing(false);
      setIsReviewFormOpen(false);
      refreshUser();
      window.location.reload();
    }
  };

  const handleEditReview = () => {
    setIsEditing(true);
    setIsReviewFormOpen(true);
  };

  const renderReviewCard = (review: Review, isMine: boolean = false) => {
    if (isMine && isEditing) return null;

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

    return (
      <Card
        key={review.id}
        className={`overflow-hidden transition-all duration-300 border-border/60 shadow-sm hover:shadow-md ${
          isMine ? "bg-secondary/5 border-primary/20" : "bg-card"
        }`}
      >
        <div className="p-6 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                isMine
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {review.user ? review.user[0].toUpperCase() : "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-foreground">
                  {isMine ? "Your Review" : review.user}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">{review.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isMine && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEditReview}
                  className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                >
                  <PencilIcon size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDeleteReview}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <TrashIcon size={16} />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-1 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
              <StarIcon weight="fill" className="text-yellow-500" size={14} />
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                {review.rating}/5
              </span>
            </div>
          </div>
        </div>

        {review.comment && (
          <div className="px-6 pb-6">
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          </div>
        )}

        {(hasRatings || hasTimes || hasTraits) && (
          <div className="bg-muted/30 border-t border-border/50 p-5 grid grid-cols-1 md:grid-cols-12 gap-6 text-sm">
            {hasRatings && (
              <div className="md:col-span-6 space-y-3">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-primary/80">
                  <ChartBarIcon /> GAME FEEL
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <StatBar
                    label="Difficulty"
                    value={review.difficulty ?? null}
                  />
                  <StatBar
                    label="Complexity"
                    value={review.complexity ?? null}
                  />
                  <StatBar
                    label="Replayability"
                    value={review.replayability ?? null}
                  />
                  <StatBar
                    label="Synergy"
                    value={review.synergyDepth ?? null}
                  />
                  <StatBar label="RNG" value={review.rngReliance ?? null} />
                  <StatBar
                    label="Friendliness"
                    value={review.userFriendliness ?? null}
                  />
                </div>
              </div>
            )}

            {hasTimes && (
              <div className="md:col-span-3 space-y-3 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-primary/80">
                  <TimerIcon /> TIME
                </div>
                <div className="space-y-2">
                  {review.avgRunLength && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Run Length</span>
                      <span className="font-medium">{review.avgRunLength}</span>
                    </div>
                  )}
                  {review.timeToFirstWin && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">First Win</span>
                      <span className="font-medium">
                        {review.timeToFirstWin}
                      </span>
                    </div>
                  )}
                  {review.timeTo100 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">100% Comp</span>
                      <span className="font-medium">{review.timeTo100}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasTraits && (
              <div className="md:col-span-3 space-y-3 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
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
                        <SwordIcon
                          size={12}
                          className="text-muted-foreground"
                        />
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
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold">Community Reviews</h3>
      </div>

      <Card
        className={`mb-10 border-dashed bg-secondary/5 border-border/60 overflow-hidden transition-all duration-500 shadow-none ${
          isReviewFormOpen || !myReview ? "block" : "hidden"
        }`}
      >
        <CardContent className="p-6">
          {(!myReview || isEditing) && (
            <>
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <span className="text-lg font-medium text-foreground">
                  {isEditing ? "Edit your review" : "Rate this game"}
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRatingClick(star)}
                    >
                      <StarIcon
                        size={32}
                        weight={
                          (hoverRating || userRating) >= star
                            ? "fill"
                            : "regular"
                        }
                        className={`transition-colors duration-200 ${
                          (hoverRating || userRating) >= star
                            ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`grid transition-all duration-500 ease-in-out ${
                  isReviewFormOpen
                    ? "grid-rows-[1fr] opacity-100 mt-6"
                    : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
              >
                <div className="overflow-hidden min-h-0 space-y-6">
                  <Separator className="mb-6" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {[
                        {
                          label: "Difficulty",
                          value: difficulty,
                          set: setDifficulty,
                          desc: "How hard is it?",
                        },
                        {
                          label: "Replayability",
                          value: replayability,
                          set: setReplayability,
                          desc: "Keep playing?",
                        },
                        {
                          label: "Synergy Depth",
                          value: synergyDepth,
                          set: setSynergyDepth,
                          desc: "Build variety?",
                        },
                        {
                          label: "Complexity",
                          value: complexity,
                          set: setComplexity,
                          desc: "Learning curve?",
                        },
                        {
                          label: "RNG Reliance",
                          value: rngReliance,
                          set: setRngReliance,
                          desc: "Luck factor?",
                        },
                        {
                          label: "User Friendliness",
                          value: userFriendliness,
                          set: setUserFriendliness,
                          desc: "Easy to learn?",
                        },
                      ].map((stat) => (
                        <div key={stat.label} className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <Label>{stat.label}</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">
                                {stat.desc}
                              </span>
                              <span className="font-bold w-4 text-right">
                                {stat.value}
                              </span>
                            </div>
                          </div>
                          <Slider
                            value={[stat.value]}
                            onValueChange={(val) => stat.set(val[0])}
                            max={10}
                            step={1}
                            className="py-2 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Narrative</Label>
                          <Select
                            value={narrativePresence}
                            onValueChange={setNarrativePresence}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="None">None</SelectItem>
                              <SelectItem value="Environmental">
                                Environmental
                              </SelectItem>
                              <SelectItem value="Light">Light</SelectItem>
                              <SelectItem value="Story-Rich">
                                Story-Rich
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Combat Style</Label>
                          <Select
                            value={combatType}
                            onValueChange={setCombatType}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Turn-Based">
                                Turn-Based
                              </SelectItem>
                              <SelectItem value="Real-Time">
                                Real-Time
                              </SelectItem>
                              <SelectItem value="Auto-Battler">
                                Auto-Battler
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Avg Run</Label>
                          <Input
                            placeholder="30m"
                            value={avgRunLength}
                            onChange={(e) =>
                              handleTimeChange(e.target.value, setAvgRunLength)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">First Win</Label>
                          <Input
                            placeholder="15h"
                            value={timeWin}
                            onChange={(e) =>
                              handleTimeChange(e.target.value, setTimeWin)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">100%</Label>
                          <Input
                            placeholder="80h"
                            value={time100}
                            onChange={(e) =>
                              handleTimeChange(e.target.value, setTime100)
                            }
                          />
                        </div>
                      </div>
                      {timeError && (
                        <p className="text-xs text-red-500 font-medium">
                          {timeError}
                        </p>
                      )}

                      <div className="space-y-2">
                        <Label>Your Review</Label>
                        <Textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your thoughts..."
                          className="resize-none h-32"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 gap-2">
                    {isEditing && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false);
                          setIsReviewFormOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      className="px-8"
                      disabled={!!timeError}
                      onClick={submitReview}
                    >
                      {isEditing ? "Update Review" : "Submit Review"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-8">
        {myReview && !isEditing && renderReviewCard(myReview, true)}

        {reviewsList
          .filter((r) => r.userId !== currentUser?.id)
          .map((review) => renderReviewCard(review, false))}
      </div>
    </section>
  );
}
