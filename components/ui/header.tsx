"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { UserIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

export function Header() {
  const { setTheme, theme } = useTheme();
  const { user, loading, openLoginModal } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-6 border-b bg-background/80 backdrop-blur-md border-border/40">
      <div className="flex items-center gap-8">
        <Link href="/games" className="flex items-center gap-3 group">
          <span className="text-lg font-semibold tracking-wide transition-colors group-hover:text-primary">
            Roguelike<span className="text-primary">Index</span>
          </span>
        </Link>

        <nav className="items-center hidden gap-6 text-sm font-medium md:flex">
          <Link
            href="/games"
            className="transition-colors text-muted-foreground hover:text-foreground"
          >
            Browse
          </Link>
          <Link
            href="/lists"
            className="transition-colors text-muted-foreground hover:text-foreground"
          >
            Lists
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative overflow-hidden rounded-full cursor-pointer h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          suppressHydrationWarning
        >
          <SunIcon
            size={20}
            className="absolute transition-all scale-100 rotate-0 dark:-rotate-90 dark:scale-0"
          />
          <MoonIcon
            size={20}
            className="absolute transition-all scale-0 rotate-90 dark:rotate-0 dark:scale-100"
          />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {!loading && user ? (
          <Link href={`/${user.name}`}>
            <Button
              variant="ghost"
              size="icon"
              className="p-0 overflow-hidden border rounded-full cursor-pointer h-9 w-9 border-border/50 bg-secondary/50"
            >
              <span className="text-sm font-bold text-foreground">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </span>
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full cursor-pointer h-9 w-9"
            onClick={openLoginModal}
          >
            <UserIcon size={20} />
          </Button>
        )}
      </div>
    </header>
  );
}
