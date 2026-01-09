"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/ui/header";
import { GameGrid } from "@/components/auth/game-grid";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setStatus("success");
        setMessage(
          "If an account exists with that email, we've sent a reset link."
        );
      } else {
        const json = await res.json();
        setStatus("error");
        setMessage(json.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      <div className="relative hidden w-7/12 h-full bg-black lg:block">
        <GameGrid />
      </div>

      <div className="relative z-20 flex flex-col w-full h-full border-l lg:w-5/12 bg-background/95 backdrop-blur-3xl border-border/50">
        <div className="absolute top-0 left-0 w-full">
          <Header />
        </div>

        <div className="flex flex-col justify-center flex-1 w-full max-w-2xl px-8 mx-auto sm:px-12 md:px-20">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-black tracking-tighter">
              Reset Password
            </h2>
            <p className="text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          {status === "success" ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 border rounded-md bg-green-500/10 border-green-500/20">
                <CheckIcon
                  className="text-green-500 mt-0.5 shrink-0"
                  size={20}
                  weight="bold"
                />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-green-600">
                    Check your inbox
                  </h4>
                  <p className="text-sm text-green-600/90">{message}</p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full cursor-pointer h-11"
              >
                <Link href="/login">Return to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {status === "error" && (
                <div className="p-3 text-sm font-medium border rounded-md bg-destructive/10 text-destructive border-destructive/20">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full text-base font-semibold cursor-pointer h-11"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending Link..." : "Send Reset Link"}{" "}
                <ArrowRightIcon className="ml-2" />
              </Button>
            </form>
          )}

          <div className="mt-8 text-sm text-center text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium underline transition-colors text-foreground hover:text-primary"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
