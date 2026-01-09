"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { UserIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

export function Header() {
  const { setTheme, theme } = useTheme();
  const { user, loading, openLoginModal } = useAuth();

  return (
    <header className="h-16 px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/40">
      <div className="flex items-center gap-8">
        <Link href="/games" className="flex items-center gap-3 group">
          <span className="text-lg font-semibold tracking-wide group-hover:text-primary transition-colors">
            Roguelike Index
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/games"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/lists"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Lists
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full relative overflow-hidden cursor-pointer"
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

        {!loading && user ? (
          <Link href="/profile">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 border border-border/50 cursor-pointer p-0 overflow-hidden bg-secondary/50"
            >
              <span className="font-bold text-sm text-foreground">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </span>
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full cursor-pointer"
            onClick={openLoginModal}
          >
            <UserIcon size={20} />
          </Button>
        )}
      </div>
    </header>
  );
}
