"use client";

import React, { useState, useEffect } from "react";
import {
  StarIcon,
  CheckIcon,
  PencilIcon,
  TrophyIcon,
  MedalIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Review, Game } from "@/lib/types";

interface GameReviewsProps {
  game: Game;
  initialReviews: Review[];
  initialMyReview: Review | null;
  // Updated type to allow name to be null
  currentUser: { id: string; name: string | null } | null;
  requireAuth: (action: () => void) => void;
  refreshUser: () => void;
}

export function GameReviews({
  game,
  initialReviews,
  initialMyReview,
  currentUser,
  requireAuth,
  refreshUser,
}: GameReviewsProps) {
  const [reviewsList, setReviewsList] = useState<Review[]>(initialReviews);
  const [myReview, setMyReview] = useState<Review | null>(initialMyReview);
  const [isEditing, setIsEditing] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  // Form State
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [timeWin, setTimeWin] = useState("");
  const [time100, setTime100] = useState("");
  const [timeError, setTimeError] = useState("");

  useEffect(() => {
    setReviewsList(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    setMyReview(initialMyReview);
    if (initialMyReview) {
      setUserRating(initialMyReview.rating);
      setReviewText(initialMyReview.comment);
      setTimeWin(initialMyReview.timeToFirstWin || "");
      setTime100(initialMyReview.hoursPlayed || "");
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
        timeToFirstWin: timeWin,
        timeTo100: time100,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const newReview = data.review;

      setMyReview(newReview);
      setReviewsList((prev) => {
        const filtered = prev.filter(
          (r) => r.userId !== currentUser?.id && r.user !== currentUser?.name
        );
        return [newReview, ...filtered];
      });

      setIsEditing(false);
      setIsReviewFormOpen(false);
      refreshUser();
    }
  };

  const handleEditReview = () => {
    setIsEditing(true);
    setIsReviewFormOpen(true);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold">Community Reviews</h3>
      </div>
      <Card className="mb-10 border-dashed bg-secondary/5 border-border/60 overflow-hidden transition-all duration-500 shadow-none">
        <CardContent className="p-6">
          {myReview && !isEditing ? (
            <div className="animate-in fade-in duration-500 group">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-start gap-4 md:w-48 shrink-0">
                  <div>
                    <div className="font-semibold text-sm text-primary flex items-center gap-2">
                      <CheckIcon /> Your Review
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {myReview.date}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditReview}
                      className="h-6 px-0 gap-1 text-muted-foreground hover:text-foreground text-xs"
                    >
                      <PencilIcon size={14} /> Edit
                    </Button>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex text-primary">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        size={16}
                        weight={i < myReview.rating ? "fill" : "regular"}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {myReview.comment}
                  </p>
                  {(myReview.timeToFirstWin || myReview.hoursPlayed) && (
                    <div className="flex gap-4 pt-2">
                      {myReview.timeToFirstWin && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded">
                          <TrophyIcon size={14} /> First Win:{" "}
                          <span className="font-semibold text-foreground">
                            {myReview.timeToFirstWin}
                          </span>
                        </div>
                      )}
                      {myReview.hoursPlayed && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded">
                          <MedalIcon size={14} /> Played:{" "}
                          <span className="font-semibold text-foreground">
                            {myReview.hoursPlayed}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
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
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <Label>Difficulty</Label>
                          <span className="text-muted-foreground text-xs">
                            How hard is it?
                          </span>
                        </div>
                        <Slider
                          defaultValue={[5]}
                          max={10}
                          step={1}
                          className="py-2 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <Label>RNG Reliance</Label>
                          <span className="text-muted-foreground text-xs">
                            Luck factor?
                          </span>
                        </div>
                        <Slider
                          defaultValue={[5]}
                          max={10}
                          step={1}
                          className="py-2 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <Label>User Friendliness</Label>
                          <span className="text-muted-foreground text-xs">
                            Easy to learn?
                          </span>
                        </div>
                        <Slider
                          defaultValue={[5]}
                          max={10}
                          step={1}
                          className="py-2 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Time to First Win</Label>
                          <Input
                            placeholder="e.g. 15h"
                            className={`bg-background ${
                              timeError ? "border-red-500" : ""
                            }`}
                            value={timeWin}
                            onChange={(e) =>
                              handleTimeChange(e.target.value, setTimeWin)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Time to 100%</Label>
                          <Input
                            placeholder="e.g. 80h"
                            className="bg-background"
                            value={time100}
                            onChange={(e) =>
                              handleTimeChange(e.target.value, setTime100)
                            }
                          />
                        </div>
                      </div>
                      {timeError && (
                        <p className="text-xs text-red-500">{timeError}</p>
                      )}
                      <div className="space-y-2">
                        <Label>Your Review</Label>
                        <Textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Have any thoughts on the game? Share them here..."
                          className="resize-none h-32 bg-background border-border/50 focus-visible:ring-primary"
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
                      className="px-8 cursor-pointer"
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
        {reviewsList.map((review) => (
          <div
            key={review.id}
            className="group animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex items-start gap-4 md:w-48 shrink-0">
                <div>
                  <div className="font-semibold text-sm">{review.user}</div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {review.date}
                  </div>
                  {review.hoursPlayed && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                    >
                      {review.hoursPlayed} Played
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      size={16}
                      weight={i < review.rating ? "fill" : "regular"}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>
                {review.timeToFirstWin && (
                  <div className="flex gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded">
                      <TrophyIcon size={14} /> First Win:{" "}
                      <span className="font-semibold text-foreground">
                        {review.timeToFirstWin}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Separator className="mt-8 group-last:hidden opacity-40" />
          </div>
        ))}
      </div>
    </section>
  );
}
