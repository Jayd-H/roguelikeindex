"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  HeartIcon,
  GameControllerIcon,
  ListDashesIcon,
  ChatTextIcon,
  CalendarBlankIcon,
  CrownIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { ListCarousel } from "@/components/lists/list-carousel";
import { ListCard } from "@/components/lists/list-card";
import { MiniGameCard } from "@/components/games/mini-game-card";
import { GameCarousel } from "@/components/games/game-carousel";
import { ReviewCard } from "@/components/reviews/review-card";
import { UserProfile, Game, List, Review } from "@/lib/types";

interface ProfileData {
  user: UserProfile;
  favorites: Game[];
  owned: Game[];
  createdLists: List[];
  reviews: Review[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${username}/profile`);
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        } else {
          setError("User not found");
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  if (loading)
    return (
      <div className="flex flex-col min-h-screen font-sans bg-background">
        <Header />
        <main className="flex-1 w-full px-6 py-6 mx-auto max-w-7xl">
          <div className="flex flex-col items-start gap-8 mb-8 md:flex-row">
            <Skeleton className="w-32 h-32 rounded-full shrink-0" />
            <div className="flex-1 w-full space-y-4">
              <div className="space-y-2">
                <Skeleton className="w-48 h-10" />
                <Skeleton className="w-32 h-4" />
              </div>
              <Skeleton className="w-full h-20 max-w-3xl" />
              <div className="flex gap-4 pt-2">
                <Skeleton className="rounded-lg h-14 w-28" />
                <Skeleton className="rounded-lg h-14 w-28" />
                <Skeleton className="rounded-lg h-14 w-28" />
                <Skeleton className="rounded-lg h-14 w-28" />
              </div>
            </div>
          </div>

          <Separator className="mb-10" />

          <div className="space-y-12">
            <div className="space-y-6">
              <Skeleton className="w-32 h-8" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Skeleton className="w-full h-48 rounded-xl" />
                <Skeleton className="w-full h-48 rounded-xl" />
              </div>
            </div>

            <div className="space-y-6">
              <Skeleton className="w-32 h-8" />
              <div className="flex gap-6 overflow-hidden">
                <Skeleton className="h-112 w-80 rounded-3xl shrink-0" />
                <Skeleton className="h-112 w-80 rounded-3xl shrink-0" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );

  if (error || !profileData)
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center flex-1 text-muted-foreground">
          <p className="text-xl font-bold">{error || "User not found"}</p>
        </div>
      </div>
    );

  const {
    user: userInfo,
    favorites,
    owned,
    createdLists,
    reviews,
  } = profileData;

  const isAdmin = userInfo.roles.includes("admin");
  const isEarlyAdopter = userInfo.roles.includes("early-adopter");

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full px-6 py-6 mx-auto max-w-7xl">
        <section className="flex flex-col items-start gap-8 mb-8 md:flex-row">
          <div className="relative shrink-0 group">
            <Avatar
              className={`h-32 w-32 border-4 shadow-xl ${
                isAdmin
                  ? "border-amber-400 shadow-amber-500/20"
                  : isEarlyAdopter
                  ? "border-purple-400 shadow-purple-500/20"
                  : "border-secondary"
              }`}
            >
              <AvatarFallback
                className={`text-4xl font-bold ${
                  isAdmin
                    ? "bg-amber-500/10 text-amber-400"
                    : isEarlyAdopter
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {userInfo.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1
                    className={`text-4xl font-black tracking-tighter flex items-center gap-3 group w-fit ${
                      isAdmin
                        ? "text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.2)]"
                        : ""
                    }`}
                  >
                    {userInfo.username}
                  </h1>
                  {isAdmin && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/50 bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 flex gap-1 items-center"
                    >
                      <CrownIcon weight="fill" size={14} /> Admin
                    </Badge>
                  )}
                  {isEarlyAdopter && !isAdmin && (
                    <Badge
                      variant="outline"
                      className="border-purple-500/50 bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 flex gap-1 items-center"
                    >
                      <SparkleIcon weight="fill" size={14} /> Early Adopter
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm font-medium text-muted-foreground">
                  <CalendarBlankIcon />
                  Joined {new Date(userInfo.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="max-w-3xl text-lg leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {userInfo.bio || "No bio yet."}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary/20">
                <HeartIcon weight="fill" className="text-red-500" size={20} />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-bold">{favorites.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Favorites
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary/20">
                <GameControllerIcon
                  weight="fill"
                  className="text-primary"
                  size={20}
                />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-bold">{owned.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Owned
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary/20">
                <ListDashesIcon
                  weight="fill"
                  className="text-blue-500"
                  size={20}
                />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-bold">
                    {createdLists.length}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Lists
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary/20">
                <ChatTextIcon
                  weight="fill"
                  className="text-yellow-500"
                  size={20}
                />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-bold">{reviews.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Reviews
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator className="mb-10" />

        <div className="space-y-12">
          {reviews.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 text-yellow-500 rounded-lg bg-yellow-500/10">
                  <ChatTextIcon size={24} weight="fill" />
                </div>
                <h2 className="text-2xl font-bold">Reviews</h2>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showGameTitle={true}
                  />
                ))}
              </div>
            </section>
          )}

          {createdLists.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 text-blue-500 rounded-lg bg-blue-500/10">
                  <ListDashesIcon size={24} weight="fill" />
                </div>
                <h2 className="text-2xl font-bold">Lists</h2>
              </div>

              <div className="space-y-3">
                <ListCarousel>
                  {createdLists.map((list) => (
                    <ListCard key={list.id} list={list} />
                  ))}
                </ListCarousel>
              </div>
            </section>
          )}

          {(favorites.length > 0 || owned.length > 0) && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <GameControllerIcon size={24} weight="fill" />
                </div>
                <h2 className="text-2xl font-bold">Library</h2>
              </div>

              {favorites.length > 0 && (
                <div className="space-y-3">
                  <h3 className="pl-1 text-sm font-bold tracking-widest uppercase text-muted-foreground">
                    Favorites
                  </h3>
                  <GameCarousel>
                    {favorites.map((game) => (
                      <MiniGameCard key={game.id} game={game} />
                    ))}
                  </GameCarousel>
                </div>
              )}

              {owned.length > 0 && (
                <div className="space-y-3">
                  <h3 className="pl-1 text-sm font-bold tracking-widest uppercase text-muted-foreground">
                    Owned
                  </h3>
                  <GameCarousel>
                    {owned.map((game) => (
                      <MiniGameCard key={game.id} game={game} />
                    ))}
                  </GameCarousel>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
