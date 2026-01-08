"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, notFound, useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { useAuth } from "@/components/auth-provider";
import {
  HeartIcon,
  ListPlusIcon,
  ShareNetworkIcon,
  StarIcon,
  TimerIcon,
  TrophyIcon,
  GameControllerIcon,
  CheckIcon,
  DesktopIcon,
  DeviceMobileIcon,
  MonitorPlayIcon,
  SmileyIcon,
  HourglassIcon,
  MedalIcon,
  BookOpenIcon,
  SwordIcon,
  ArrowSquareOutIcon,
  InfinityIcon,
  PuzzlePieceIcon,
  ShoppingCartIcon,
  LightningIcon,
  DiceFiveIcon,
  PencilIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Tag {
  id: number;
  name: string;
}
interface Review {
  id: string;
  user: string;
  userId?: string | null;
  rating: number;
  comment: string;
  date: string;
  timeToFirstWin?: string | null;
  hoursPlayed?: string | null;
}
interface PricePoint {
  platform: string;
  stores: { store: string; price: string; url: string }[];
}
interface ExternalRating {
  source: string;
  score: string;
  url: string;
}
interface SimilarGame {
  id: string;
  slug: string;
  title: string;
  steamAppId?: string | null;
  subgenre: string;
}
interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  subgenre: string;
  narrativePresence: string;
  combatType: string;
  avgRunLength: string;
  timeToFirstWin: string;
  timeTo100: string;
  difficulty: number;
  rngReliance: number;
  userFriendliness: number;
  complexity: number;
  synergyDepth: number;
  replayability: number;
  metaProgression: boolean;
  steamDeckVerified: boolean;
  rating: number;
  steamAppId: string | null;
  tags: Tag[];
  reviews: Review[];
  pricing: PricePoint[];
  externalRatings: ExternalRating[];
  similarGames: SimilarGame[];
}

export default function GameDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, requireAuth, refreshUser } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [owned, setOwned] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [timeWin, setTimeWin] = useState("");
  const [time100, setTime100] = useState("");
  const [timeError, setTimeError] = useState("");

  useEffect(() => {
    if (slug) {
      fetch(`/api/games/${slug}`)
        .then((res) => {
          if (!res.ok) throw new Error("Game not found");
          return res.json();
        })
        .then((data) => {
          setGame(data);
          setReviewsList(data.reviews);
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
            setUserRating(data.review.rating);
            setReviewText(data.review.comment);
            setTimeWin(data.review.timeToFirstWin || "");
            setTime100(data.review.hoursPlayed || "");
          }
          setStatusLoaded(true);
        });
    } else {
      const timer = setTimeout(() => setStatusLoaded(true), 0);
      return () => clearTimeout(timer);
    }
  }, [user, slug]);

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  if (!game) return notFound();

  const handleRatingClick = (rating: number) =>
    requireAuth(() => {
      setUserRating(rating);
      setIsReviewFormOpen(true);
    });

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

  const submitReview = async () => {
    const res = await fetch(`/api/games/${slug}/review`, {
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
          (r) => r.userId !== user?.id && r.user !== user?.name
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

  const handleGenericAction = () => requireAuth(() => {});
  const validateTime = (val: string) =>
    /^\d+(h|m|h\+)$/.test(val) || val === "";
  const handleTimeChange = (val: string, setter: (v: string) => void) => {
    setter(val);
    setTimeError(val && !validateTime(val) ? "Format: 15h, 30m" : "");
  };

  const heroUrl = `/api/games/${slug}/image/hero`;
  const logoUrl = `/api/games/${slug}/image/logo`;
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "PC":
        return <DesktopIcon size={20} />;
      case "Mobile":
        return <DeviceMobileIcon size={20} />;
      case "Switch":
      case "PlayStation":
      case "Xbox":
        return <GameControllerIcon size={20} />;
      default:
        return <MonitorPlayIcon size={20} />;
    }
  };
  const getStoreIcon = (store: string) => {
    if (store.includes("Steam"))
      return <span className="font-bold text-blue-500">Steam</span>;
    if (store.includes("Epic"))
      return <span className="font-bold text-foreground">Epic</span>;
    if (store.includes("GOG"))
      return <span className="font-bold text-purple-500">GOG</span>;
    return <ShoppingCartIcon size={16} />;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <div className="relative w-full h-100 md:h-125 overflow-hidden bg-black/90 group">
        {heroUrl ? (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent z-10" />
            <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent z-10" />
            <Image
              src={heroUrl}
              alt={`${game.title} Hero`}
              fill
              className="object-cover opacity-60"
              unoptimized
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-secondary/20 to-primary/10" />
        )}
        <div className="absolute bottom-0 left-0 w-full z-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="max-w-100 w-full">
              {logoUrl ? (
                <div className="relative h-24 md:h-36 w-auto max-w-100 mb-6 origin-left">
                  <Image
                    src={logoUrl}
                    alt={game.title}
                    width={400}
                    height={160}
                    className="h-full w-auto object-contain drop-shadow-2xl"
                    unoptimized
                  />
                </div>
              ) : (
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-lg mb-4">
                  {game.title}
                </h1>
              )}
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="bg-primary/20 text-primary hover:bg-primary/30 border-none backdrop-blur-md px-3 py-1 text-sm"
                >
                  {game.subgenre}
                </Badge>
                {game.steamDeckVerified && (
                  <Badge
                    variant="outline"
                    className="border-green-500/50 text-green-400 bg-green-500/10 backdrop-blur-md gap-1 px-3 py-1"
                  >
                    <GameControllerIcon size={16} weight="fill" /> Deck Verified
                  </Badge>
                )}
                {game.metaProgression && (
                  <Badge
                    variant="outline"
                    className="border-cyan-500/50 text-cyan-400 bg-cyan-500/10 backdrop-blur-md gap-1 px-3 py-1"
                  >
                    <CheckIcon size={16} weight="bold" /> Meta Progression
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              {statusLoaded ? (
                <>
                  <Button
                    onClick={toggleOwned}
                    variant={owned ? "default" : "secondary"}
                    className={`rounded-full h-12 px-6 gap-2 backdrop-blur-md border border-white/5 font-semibold cursor-pointer transition-all ${
                      owned
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary/80 hover:bg-secondary text-foreground"
                    }`}
                  >
                    <CheckIcon
                      size={20}
                      weight="bold"
                      className={owned ? "opacity-100" : "opacity-50"}
                    />
                    {owned ? "Owned" : "Mark Owned"}
                  </Button>
                  <Button
                    onClick={toggleFavorite}
                    className={`rounded-full h-12 px-6 gap-2 bg-white text-black hover:bg-white/90 font-semibold shadow-lg shadow-primary/5 cursor-pointer`}
                  >
                    {favorited ? (
                      <HeartIcon
                        size={20}
                        weight="fill"
                        className="text-red-500"
                      />
                    ) : (
                      <HeartIcon size={20} className="text-black" />
                    )}
                    {favorited ? "Favorited" : "Favorite"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="h-12 w-40 rounded-full bg-secondary/50 animate-pulse" />
                  <div className="h-12 w-32 rounded-full bg-secondary/50 animate-pulse" />
                </>
              )}
              <Button
                onClick={handleGenericAction}
                variant="secondary"
                className="rounded-full h-12 px-6 gap-2 backdrop-blur-md bg-secondary/80 hover:bg-secondary text-foreground border border-white/5 cursor-pointer"
              >
                <ListPlusIcon size={20} /> Add to List
              </Button>
              <Button
                onClick={handleGenericAction}
                variant="secondary"
                size="icon"
                className="rounded-full h-12 w-12 backdrop-blur-md bg-secondary/80 hover:bg-secondary text-foreground border border-white/5 cursor-pointer"
              >
                <ShareNetworkIcon size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-6 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-10">
            <section className="space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                Overview
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {game.description}
              </p>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-500 opacity-90">
                      <TimerIcon size={18} weight="fill" /> Avg Run
                    </div>
                    <div className="text-2xl font-black text-foreground">
                      {game.avgRunLength}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-purple-500 opacity-90">
                      <BookOpenIcon size={18} weight="fill" /> Narrative
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {game.narrativePresence}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-500 opacity-90">
                      <SwordIcon size={18} weight="fill" /> Combat
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {game.combatType}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-yellow-500 opacity-90">
                      <TrophyIcon size={18} weight="fill" /> Difficulty
                    </div>
                    <div className="text-2xl font-black text-foreground">
                      {game.difficulty}/10
                    </div>
                  </div>
                </div>
                <Separator className="bg-border/60" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground font-medium">
                        <InfinityIcon size={16} weight="fill" /> Replayability
                      </span>
                      <span className="font-semibold text-foreground">
                        {game.replayability}/10
                      </span>
                    </div>
                    <Progress
                      value={game.replayability * 10}
                      className="h-2 bg-secondary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground font-medium">
                        <LightningIcon size={16} weight="fill" /> Synergy Depth
                      </span>
                      <span className="font-semibold text-foreground">
                        {game.synergyDepth}/10
                      </span>
                    </div>
                    <Progress
                      value={game.synergyDepth * 10}
                      className="h-2 bg-secondary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground font-medium">
                        <PuzzlePieceIcon size={16} weight="fill" /> Complexity
                      </span>
                      <span className="font-semibold text-foreground">
                        {game.complexity}/10
                      </span>
                    </div>
                    <Progress
                      value={game.complexity * 10}
                      className="h-2 bg-secondary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground font-medium">
                        <DiceFiveIcon size={16} weight="fill" /> RNG Reliance
                      </span>
                      <span className="font-semibold text-foreground">
                        {game.rngReliance}/10
                      </span>
                    </div>
                    <Progress
                      value={game.rngReliance * 10}
                      className="h-2 bg-secondary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground font-medium">
                        <SmileyIcon size={16} weight="fill" /> User Friendliness
                      </span>
                      <span className="font-semibold text-foreground">
                        {game.userFriendliness}/10
                      </span>
                    </div>
                    <Progress
                      value={game.userFriendliness * 10}
                      className="h-2 bg-secondary"
                    />
                  </div>
                  <div className="flex gap-8 items-center pt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <HourglassIcon size={16} weight="fill" /> Time to First
                        Win
                      </div>
                      <div className="font-bold text-foreground">
                        {game.timeToFirstWin}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MedalIcon size={16} weight="fill" /> Time to 100%
                      </div>
                      <div className="font-bold text-foreground">
                        {game.timeTo100}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag) => (
                  <Badge
                    key={tag.name}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm bg-secondary/50 hover:bg-secondary"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </section>
            <Separator />
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
                                weight={
                                  i < myReview.rating ? "fill" : "regular"
                                }
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {myReview.comment}
                          </p>
                          {(myReview.timeToFirstWin ||
                            myReview.hoursPlayed) && (
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
                                  <Label className="text-xs">
                                    Time to First Win
                                  </Label>
                                  <Input
                                    placeholder="e.g. 15h"
                                    className={`bg-background ${
                                      timeError ? "border-red-500" : ""
                                    }`}
                                    value={timeWin}
                                    onChange={(e) =>
                                      handleTimeChange(
                                        e.target.value,
                                        setTimeWin
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">
                                    Time to 100%
                                  </Label>
                                  <Input
                                    placeholder="e.g. 80h"
                                    className="bg-background"
                                    value={time100}
                                    onChange={(e) =>
                                      handleTimeChange(
                                        e.target.value,
                                        setTime100
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              {timeError && (
                                <p className="text-xs text-red-500">
                                  {timeError}
                                </p>
                              )}
                              <div className="space-y-2">
                                <Label>Your Review</Label>
                                <Textarea
                                  value={reviewText}
                                  onChange={(e) =>
                                    setReviewText(e.target.value)
                                  }
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
                          <div className="font-semibold text-sm">
                            {review.user}
                          </div>
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
          </div>
          <aside className="lg:col-span-4 space-y-8">
            <Card className="bg-secondary/10 border-none shadow-none overflow-hidden">
              <div className="bg-secondary/30 p-6 flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-5xl font-black text-primary tracking-tighter">
                      {game.rating}
                    </div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                      Index Score
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-primary mb-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        size={20}
                        weight={
                          i < Math.floor(game.rating) ? "fill" : "regular"
                        }
                        className={
                          i >= Math.floor(game.rating) ? "opacity-30" : ""
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {game.externalRatings.map((ex, i) => (
                  <a
                    key={i}
                    href={ex.url}
                    target="_blank"
                    className="flex justify-between text-sm items-center p-3 rounded-md bg-background/50 hover:bg-background transition-colors cursor-pointer group"
                  >
                    <span className="font-medium text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {ex.source}{" "}
                      <ArrowSquareOutIcon size={12} className="opacity-50" />
                    </span>
                    <span className="font-bold text-foreground">
                      {ex.score}
                    </span>
                  </a>
                ))}
              </div>
            </Card>
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="px-0 pt-0">
                <h4 className="font-bold text-lg flex items-center gap-2 mb-4 px-2">
                  <CheckIcon size={20} className="text-primary" /> Availability
                </h4>
                <div className="space-y-6">
                  {game.pricing.map((platformData, idx) => (
                    <div key={idx}>
                      <div className="flex items-center gap-2 mb-3 px-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
                        {getPlatformIcon(platformData.platform)}
                        {platformData.platform}
                      </div>
                      <div className="space-y-1">
                        {platformData.stores.map((store, sIdx) => (
                          <a
                            key={sIdx}
                            href={store.url}
                            className="flex items-center justify-between text-sm group cursor-pointer hover:bg-secondary/50 p-2 rounded transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {getStoreIcon(store.store)}
                              <span className="font-medium group-hover:text-foreground transition-colors">
                                {store.store}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-background border-border/60"
                            >
                              {store.price}
                            </Badge>
                          </a>
                        ))}
                      </div>
                      {idx !== game.pricing.length - 1 && (
                        <Separator className="my-4 opacity-50" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {game.similarGames.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-4">Similar Games</h4>
                <ScrollArea className="h-100 pr-4">
                  <div className="space-y-3">
                    {game.similarGames.map((simGame) => (
                      <div
                        key={simGame.id}
                        onClick={() =>
                          requireAuth(() =>
                            router.push(`/games/${simGame.slug}`)
                          )
                        }
                        className="flex gap-3 p-2 rounded-lg hover:bg-secondary/20 cursor-pointer transition-colors group border border-transparent hover:border-border/50"
                      >
                        <div className="h-16 w-24 bg-muted rounded overflow-hidden shrink-0 relative">
                          {simGame.steamAppId && (
                            <Image
                              src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${simGame.steamAppId}/header.jpg`}
                              className="object-cover"
                              alt={simGame.title}
                              fill
                              unoptimized
                            />
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">
                            {simGame.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {simGame.subgenre}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
