"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/ui/header";
import { GameGrid } from "@/components/auth/game-grid";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const isPasswordLengthValid = password.length > 4;
  const isPasswordNotCommon = !["password", "123456", "qwerty"].includes(
    password.toLowerCase()
  );
  const canSubmit = isPasswordLengthValid && isPasswordNotCommon && token;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const json = await res.json();
        setStatus("error");
        setMessage(json.error);
      }
    } catch {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-destructive">Invalid Link</h3>
        <p className="text-muted-foreground">
          This password reset link is invalid or missing.
        </p>
        <Button asChild>
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20 flex items-start gap-3">
          <CheckIcon
            className="text-green-500 mt-0.5 shrink-0"
            size={20}
            weight="bold"
          />
          <div className="space-y-1">
            <h4 className="font-semibold text-green-600 text-sm">
              Password Reset Complete
            </h4>
            <p className="text-sm text-green-600/90">
              Your password has been updated successfully.
            </p>
          </div>
        </div>
        <Button asChild className="w-full h-11 cursor-pointer">
          <Link href="/login">Login with New Password</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-11"
        />
        <div className="space-y-1 mt-1">
          <div
            className={`text-xs flex items-center gap-1.5 ${
              isPasswordLengthValid ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {isPasswordLengthValid ? (
              <CheckIcon />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-current" />
            )}
            More than 4 characters
          </div>
          <div
            className={`text-xs flex items-center gap-1.5 ${
              isPasswordNotCommon ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {isPasswordNotCommon ? (
              <CheckIcon />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-current" />
            )}
            Not a common password
          </div>
        </div>
      </div>

      {status === "error" && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {message}
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-11 text-base font-semibold cursor-pointer"
        disabled={status === "loading" || !canSubmit}
      >
        {status === "loading" ? "Updating..." : "Set New Password"}{" "}
        <ArrowRightIcon className="ml-2" />
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      <div className="hidden lg:block w-7/12 h-full bg-black relative">
        <GameGrid />
      </div>

      <div className="w-full lg:w-5/12 h-full flex flex-col relative z-20 bg-background/95 backdrop-blur-3xl border-l border-border/50">
        <div className="absolute top-0 left-0 w-full">
          <Header />
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-20 max-w-2xl mx-auto w-full">
          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-black tracking-tighter">
              New Password
            </h2>
            <p className="text-muted-foreground">
              Please enter your new password below.
            </p>
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
