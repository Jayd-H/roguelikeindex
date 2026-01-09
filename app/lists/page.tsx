"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import {
  ListDashesIcon,
  SparkleIcon,
  UserListIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListCarousel } from "@/components/lists/list-carousel";
import { ListCard } from "@/components/lists/list-card";

interface GamePreview {
  id: string;
  slug: string;
  title: string;
  image: string | null;
}

interface GameList {
  id: string;
  title: string;
  description: string;
  type: "automatic" | "user";
  creator?: string;
  averageRating?: number;
  gameCount: number;
  games: GamePreview[];
  isSaved?: boolean;
  userRating?: number;
  isOwner?: boolean;
}

export default function ListsPage() {
  const [autoLists, setAutoLists] = useState<GameList[]>([]);
  const [userLists, setUserLists] = useState<GameList[]>([]);

  const [loadingAuto, setLoadingAuto] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  const [userPage, setUserPage] = useState(1);
  const [hasMoreUser, setHasMoreUser] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    fetch("/api/lists/automatic")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAutoLists(data);
        setLoadingAuto(false);
      })
      .catch(() => setLoadingAuto(false));

    fetchUserLists(1);
  }, []);

  const fetchUserLists = async (page: number) => {
    try {
      const res = await fetch(`/api/lists/user?page=${page}&limit=15`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      if (Array.isArray(data)) {
        if (data.length < 15) setHasMoreUser(false);
        setUserLists((prev) => (page === 1 ? data : [...prev, ...data]));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUser(false);
      setIsFetchingMore(false);
    }
  };

  const handleLoadMoreUser = useCallback(() => {
    if (!hasMoreUser || isFetchingMore) return;
    setIsFetchingMore(true);
    const nextPage = userPage + 1;
    setUserPage(nextPage);
    fetchUserLists(nextPage);
  }, [hasMoreUser, isFetchingMore, userPage]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
        <div className="w-full max-w-3xl mx-auto mb-12 text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tighter">
            Curated Collections
          </h1>
          <p className="text-muted-foreground">
            Discover collections curated by the Index algorithm and the
            community.
          </p>
        </div>

        <section className=" mb-8 relative">
          <div className="flex items-center gap-4 px-4 sm:px-0">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <SparkleIcon
                weight="fill"
                className="text-yellow-500"
                size={24}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Index Collections
              </h2>
              <p className="text-sm text-muted-foreground">
                Automatically generated based on database stats
              </p>
            </div>
          </div>

          {loadingAuto ? (
            <div className="overflow-hidden py-32 -mx-6">
              <div className="flex gap-6 px-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-112 w-80 rounded-3xl shrink-0"
                  />
                ))}
              </div>
            </div>
          ) : (
            <ListCarousel>
              {autoLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </ListCarousel>
          )}
        </section>

        <section className="mb-12 relative">
          <div className="flex items-center gap-4 px-4 sm:px-0">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <UserListIcon weight="fill" className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Community Lists
              </h2>
              <p className="text-sm text-muted-foreground">
                Created and rated by other players
              </p>
            </div>
          </div>

          {loadingUser ? (
            <div className="overflow-hidden py-32 -mx-6">
              <div className="flex gap-6 px-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-112 w-80 rounded-3xl shrink-0"
                  />
                ))}
              </div>
            </div>
          ) : userLists.length > 0 ? (
            <ListCarousel onEndReached={handleLoadMoreUser}>
              {userLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
              {isFetchingMore && (
                <div className="h-112 w-80 flex items-center justify-center shrink-0">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </ListCarousel>
          ) : (
            <div className="py-24 text-center text-muted-foreground bg-secondary/5 rounded-3xl border border-dashed border-border/60">
              <div className="flex flex-col items-center gap-2">
                <ListDashesIcon size={32} className="opacity-20" />
                <p className="text-lg font-medium">
                  No community lists found yet.
                </p>
                <Button
                  variant="link"
                  className="mt-2 text-primary cursor-pointer"
                >
                  Be the first to create one!
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
