"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  HeartIcon,
  GameControllerIcon,
  ListDashesIcon,
  ChatTextIcon,
  CalendarBlankIcon,
  PencilSimpleIcon,
  CheckIcon,
  XIcon,
  EnvelopeSimpleIcon,
  LockKeyIcon,
  TrashIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/components/auth-provider";
import { ListCarousel } from "@/components/lists/list-carousel";
import { ListCard } from "@/components/lists/list-card";
import { MiniGameCard } from "@/components/games/mini-game-card";
import { GameCarousel } from "@/components/games/game-carousel";
import { ReviewCard } from "@/components/reviews/review-card";
import { SecurityModal } from "@/components/profile/security-modal";
import { UserProfile, Game, List, Review } from "@/lib/types";

interface ProfileData {
  user: UserProfile;
  favorites: Game[];
  owned: Game[];
  createdLists: List[];
  reviews: Review[];
}

export default function ProfilePage() {
  const { user, requireAuth, refreshUser, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [tempBio, setTempBio] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [securityModal, setSecurityModal] = useState<{
    open: boolean;
    type: "email" | "password" | "delete";
  }>({
    open: false,
    type: "email",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      requireAuth(() => {});
      return;
    }

    fetchProfile();
  }, [user, requireAuth, authLoading]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleUpdate = async (field: string, value: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/auth/update", {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        refreshUser();
        fetchProfile();
        setEditingField(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
    if (field === "bio") setTempBio(currentValue || "");
  };

  const openSecurityModal = (type: "email" | "password" | "delete") => {
    setSecurityModal({ open: true, type });
  };

  const handleSecuritySuccess = () => {
    if (securityModal.type === "delete") {
      window.location.href = "/register";
    } else {
      refreshUser();
      fetchProfile();
    }
  };

  if (authLoading || loading)
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

  if (!profileData) return null;

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
                {editingField === "username" ? (
                  <div className="flex items-center gap-2 max-w-sm">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="text-2xl font-bold h-10"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      onClick={() => handleUpdate("username", tempValue)}
                      disabled={isUpdating}
                      className="h-10 w-10 shrink-0 cursor-pointer"
                    >
                      <CheckIcon />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingField(null)}
                      className="h-10 w-10 shrink-0 cursor-pointer"
                    >
                      <XIcon />
                    </Button>
                  </div>
                ) : (
                  <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 group w-fit">
                    {userInfo.username}
                    <button
                      onClick={() => startEdit("username", userInfo.username)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary cursor-pointer"
                    >
                      <PencilSimpleIcon size={20} />
                    </button>
                  </h1>
                )}
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mt-1">
                  <CalendarBlankIcon />
                  Joined {new Date(userInfo.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 cursor-pointer"
                  onClick={() => openSecurityModal("email")}
                >
                  <EnvelopeSimpleIcon size={16} /> Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 cursor-pointer"
                  onClick={() => openSecurityModal("password")}
                >
                  <LockKeyIcon size={16} /> Password
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 cursor-pointer"
                  onClick={() => openSecurityModal("delete")}
                >
                  <TrashIcon size={16} /> Delete
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 cursor-pointer"
                  onClick={handleLogout}
                >
                  <SignOutIcon size={16} /> Logout
                </Button>
              </div>
            </div>

            <div className="relative group">
              {editingField === "bio" ? (
                <div className="space-y-2">
                  <Textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="min-h-24 resize-none bg-background"
                    placeholder="Write something about yourself..."
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingField(null)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdate("bio", tempBio)}
                      disabled={isUpdating}
                      className="cursor-pointer"
                    >
                      Save Bio
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-lg text-muted-foreground max-w-3xl leading-relaxed whitespace-pre-wrap">
                  {userInfo.bio ? (
                    <span className="inline">
                      {userInfo.bio}
                      <button
                        onClick={() => startEdit("bio", userInfo.bio || "")}
                        className="inline-flex align-middle ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary cursor-pointer"
                        title="Edit Bio"
                      >
                        <PencilSimpleIcon size={18} />
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => startEdit("bio", "")}
                      className="text-sm italic text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      Add a bio... <PencilSimpleIcon size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1">
                <HeartIcon weight="fill" className="text-red-500" size={20} />
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-lg">{favorites.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Favorites
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1">
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
              <div className="flex items-center gap-2 px-3 py-1">
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
              <div className="flex items-center gap-2 px-3 py-1">
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
                <h2 className="text-2xl font-bold">Your Lists</h2>
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

      <SecurityModal
        isOpen={securityModal.open}
        type={securityModal.type}
        onClose={() => setSecurityModal((prev) => ({ ...prev, open: false }))}
        onSuccess={handleSecuritySuccess}
      />
    </div>
  );
}
