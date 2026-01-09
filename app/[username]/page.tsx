"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  HeartIcon,
  GameControllerIcon,
  ListDashesIcon,
  ChatTextIcon,
  CalendarBlankIcon,
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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );

  if (error || !profileData)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-6">
        <section className="flex flex-col md:flex-row gap-8 items-start mb-8">
          <div className="shrink-0 relative group">
            <Avatar className="h-32 w-32 border-4 border-secondary shadow-xl">
              <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                {userInfo.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 group w-fit">
                  {userInfo.username}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mt-1">
                  <CalendarBlankIcon />
                  Joined {new Date(userInfo.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="text-lg text-muted-foreground max-w-3xl leading-relaxed whitespace-pre-wrap">
                {userInfo.bio || "No bio yet."}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="bg-secondary/20 rounded-lg px-4 py-2 flex items-center gap-3">
                <HeartIcon weight="fill" className="text-red-500" size={20} />
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-lg">{favorites.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Favorites
                  </span>
                </div>
              </div>
              <div className="bg-secondary/20 rounded-lg px-4 py-2 flex items-center gap-3">
                <GameControllerIcon
                  weight="fill"
                  className="text-primary"
                  size={20}
                />
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-lg">{owned.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Owned
                  </span>
                </div>
              </div>
              <div className="bg-secondary/20 rounded-lg px-4 py-2 flex items-center gap-3">
                <ListDashesIcon
                  weight="fill"
                  className="text-blue-500"
                  size={20}
                />
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-lg">
                    {createdLists.length}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Lists
                  </span>
                </div>
              </div>
              <div className="bg-secondary/20 rounded-lg px-4 py-2 flex items-center gap-3">
                <ChatTextIcon
                  weight="fill"
                  className="text-yellow-500"
                  size={20}
                />
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-lg">{reviews.length}</span>
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
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <ChatTextIcon size={24} weight="fill" />
                </div>
                <h2 className="text-2xl font-bold">Reviews</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
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
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <GameControllerIcon size={24} weight="fill" />
                </div>
                <h2 className="text-2xl font-bold">Library</h2>
              </div>

              {favorites.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
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
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
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
