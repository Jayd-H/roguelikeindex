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
      <div className="space-y-4 text-center">
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
        <div className="flex items-start gap-3 p-4 border rounded-md bg-green-500/10 border-green-500/20">
          <CheckIcon
            className="text-green-500 mt-0.5 shrink-0"
            size={20}
            weight="bold"
          />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-green-600">
              Password Reset Complete
            </h4>
            <p className="text-sm text-green-600/90">
              Your password has been updated successfully.
            </p>
          </div>
        </div>
        <Button asChild className="w-full cursor-pointer h-11">
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
        <div className="mt-1 space-y-1">
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
        <div className="p-3 text-sm font-medium border rounded-md bg-destructive/10 text-destructive border-destructive/20">
          {message}
        </div>
      )}

      <Button
        type="submit"
        className="w-full text-base font-semibold cursor-pointer h-11"
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
