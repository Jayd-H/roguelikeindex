"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/ui/header";
import { GameGrid } from "@/components/auth/game-grid";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        await refreshUser();
        router.push("/games");
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      {/* Left Side - Game Grid */}
      <div className="relative hidden w-7/12 h-full bg-black lg:block">
        <GameGrid />
      </div>

      {/* Right Side - Form */}
      <div className="relative z-20 flex flex-col w-full h-full border-l lg:w-5/12 bg-background/95 backdrop-blur-3xl border-border/50">
        <div className="absolute top-0 left-0 w-full">
          <Header />
        </div>

        <div className="flex flex-col justify-center flex-1 w-full max-w-2xl px-8 mx-auto sm:px-12 md:px-20">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-black tracking-tighter">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-11"
              />
            </div>

            {error && (
              <div className="p-3 text-sm font-medium border rounded-md bg-destructive/10 text-destructive border-destructive/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full text-base font-semibold cursor-pointer h-11"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}{" "}
              <ArrowRightIcon className="ml-2" />
            </Button>
          </form>

          <div className="mt-8 text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium underline transition-colors text-foreground hover:text-primary"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
