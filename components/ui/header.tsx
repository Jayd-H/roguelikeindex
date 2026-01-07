"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Gear, User, Moon, Sun } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { setTheme, theme } = useTheme();

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
           <Sun size={20} className="absolute transition-all rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
           <Moon size={20} className="absolute transition-all rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
           <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Gear size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <User size={20} />
        </Button>
      </div>
    </header>
  );
}