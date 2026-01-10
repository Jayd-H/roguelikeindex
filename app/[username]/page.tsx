"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  CrownIcon,
  SparkleIcon,
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

export default function UserProfilePage(props: {
  params: Promise<{ username: string }>;
}) {
  const params = use(props.params);
  const router = useRouter();
  const { user: currentUser, refreshUser } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${params.username}/profile`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) setProfileData(data);
        } else {
          if (mounted) setError("User not found");
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [params.username]);

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
        if (field === "username" && value !== params.username) {
          router.push(`/${value}`);
        } else {
          refreshUser();
          const res = await fetch(`/api/users/${params.username}/profile`);
          if (res.ok) {
            const data = await res.json();
            setProfileData(data);
          }
          setEditingField(null);
        }
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

  const isOwner = currentUser?.id === userInfo.id;
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
                  ? "border-blue-400 shadow-blue-500/20"
                  : "border-secondary"
              }`}
            >
              <AvatarFallback
                className={`text-4xl font-bold ${
                  isAdmin
                    ? "bg-amber-500/10 text-amber-400"
                    : isEarlyAdopter
                    ? "bg-blue-500/10 text-blue-400"
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
                {isOwner && editingField === "username" ? (
                  <div className="flex items-center max-w-sm gap-2">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="h-10 text-2xl font-bold"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      onClick={() => handleUpdate("username", tempValue)}
                      disabled={isUpdating}
                      className="w-10 h-10 cursor-pointer shrink-0"
                    >
                      <CheckIcon />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingField(null)}
                      className="w-10 h-10 cursor-pointer shrink-0"
                    >
                      <XIcon />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <h1
                      className={`text-4xl font-black tracking-tighter flex items-center gap-3 group w-fit ${
                        isAdmin
                          ? "text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.2)]"
                          : ""
                      }`}
                    >
                      {userInfo.username}
                      {isOwner && (
                        <button
                          onClick={() =>
                            startEdit("username", userInfo.username)
                          }
                          className="transition-opacity opacity-0 cursor-pointer group-hover:opacity-100 text-muted-foreground hover:text-primary"
                        >
                          <PencilSimpleIcon size={20} />
                        </button>
                      )}
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
                        className="border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 flex gap-1 items-center"
                      >
                        <SparkleIcon weight="fill" size={14} /> Early Adopter
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1 text-sm font-medium text-muted-foreground">
                  <CalendarBlankIcon />
                  Joined {new Date(userInfo.createdAt).toLocaleDateString()}
                </div>
              </div>

              {isOwner && (
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
              )}
            </div>

            <div className="relative group">
              {isOwner && editingField === "bio" ? (
                <div className="space-y-2">
                  <Textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="resize-none min-h-24 bg-background"
                    placeholder="Write something about yourself..."
                  />
                  <div className="flex justify-end gap-2">
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
                <div className="max-w-3xl text-lg leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {userInfo.bio ? (
                    <span className="inline">
                      {userInfo.bio}
                      {isOwner && (
                        <button
                          onClick={() => startEdit("bio", userInfo.bio || "")}
                          className="inline-flex ml-2 align-middle transition-opacity opacity-0 cursor-pointer group-hover:opacity-100 text-muted-foreground hover:text-primary"
                          title="Edit Bio"
                        >
                          <PencilSimpleIcon size={18} />
                        </button>
                      )}
                    </span>
                  ) : isOwner ? (
                    <button
                      onClick={() => startEdit("bio", "")}
                      className="flex items-center gap-2 text-sm italic transition-colors cursor-pointer text-muted-foreground/60 hover:text-primary"
                    >
                      Add a bio... <PencilSimpleIcon size={14} />
                    </button>
                  ) : (
                    "No bio yet."
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1">
                <HeartIcon weight="fill" className="text-red-500" size={20} />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-bold">{favorites.length}</span>
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
                  <span className="text-lg font-bold">{owned.length}</span>
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
                  <span className="text-lg font-bold">
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
                <h2 className="text-2xl font-bold">
                  {isOwner ? "Your Lists" : "Lists"}
                </h2>
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

      {isOwner && (
        <SecurityModal
          isOpen={securityModal.open}
          type={securityModal.type}
          onClose={() => setSecurityModal((prev) => ({ ...prev, open: false }))}
          onSuccess={() => {
            refreshUser();
            const fetchProfile = async () => {
              const res = await fetch(`/api/users/${params.username}/profile`);
              if (res.ok) setProfileData(await res.json());
            };
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}
