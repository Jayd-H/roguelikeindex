"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  GearIcon,
  UserIcon,
  MoonIcon,
  SunIcon,
  HeartIcon,
  GameControllerIcon,
  StarIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Header() {
  const { setTheme, theme } = useTheme();
  const { user, loading, openLoginModal } = useAuth();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/40">
      <Link href="/games" className="flex items-center gap-3 group">
        <span className="text-lg font-semibold tracking-wide group-hover:text-primary transition-colors">
          Roguelike Index
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full relative overflow-hidden"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          suppressHydrationWarning
        >
          <SunIcon
            size={20}
            className="absolute transition-all rotate-0 scale-100 dark:-rotate-90 dark:scale-0"
          />
          <MoonIcon
            size={20}
            className="absolute transition-all rotate-90 scale-0 dark:rotate-0 dark:scale-100"
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <GearIcon size={20} />
        </Button>

        {!loading && user ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 border border-border/50 cursor-pointer p-0 overflow-hidden"
              >
                <UserIcon size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 mr-6" align="end">
              <div className="flex flex-col gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold leading-none">
                    {user.name || "User"}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-secondary/30 p-2 rounded-md space-y-1">
                    <HeartIcon
                      size={16}
                      className="mx-auto text-red-500"
                      weight="fill"
                    />
                    <div className="text-xs font-bold">
                      {user.stats?.favorites || 0}
                    </div>
                  </div>
                  <div className="bg-secondary/30 p-2 rounded-md space-y-1">
                    <GameControllerIcon
                      size={16}
                      className="mx-auto text-primary"
                      weight="fill"
                    />
                    <div className="text-xs font-bold">
                      {user.stats?.owned || 0}
                    </div>
                  </div>
                  <div className="bg-secondary/30 p-2 rounded-md space-y-1">
                    <StarIcon
                      size={16}
                      className="mx-auto text-yellow-500"
                      weight="fill"
                    />
                    <div className="text-xs font-bold">
                      {user.stats?.reviews || 0}
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full gap-2 cursor-pointer"
                >
                  <SignOutIcon size={16} /> Logout
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={openLoginModal}
          >
            <UserIcon size={20} />
          </Button>
        )}
      </div>
    </header>
  );
}
