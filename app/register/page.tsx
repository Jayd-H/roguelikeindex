"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/ui/header";
import { GameGrid } from "@/components/auth/game-grid";
import { CheckIcon, XIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useAuth } from "@/components/auth-provider";
import { containsProfanity } from "@/lib/profanity";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isUsernameLengthValid = username.length >= 3 && username.length <= 16;
  const isUsernameClean = !containsProfanity(username);
  const isUsernameValid = isUsernameLengthValid && isUsernameClean;

  const isEmailValid = email.includes("@") && email.length > 3;
  const isPasswordLengthValid = password.length > 4;
  const isPasswordNotCommon = ![
    "password",
    "123456",
    "qwerty",
    username,
  ].includes(password.toLowerCase());
  const isPasswordSecure = isPasswordLengthValid && isPasswordNotCommon;

  const canSubmit = isUsernameValid && isEmailValid && isPasswordSecure;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        await refreshUser();
        router.push("/games");
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
              Create an account
            </h2>
            <p className="text-muted-foreground">
              Enter your details below to start tracking your journey.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  placeholder="RogueOne"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={
                    username && !isUsernameValid
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  required
                />
                {username && (
                  <div className="absolute right-3 top-2.5">
                    {isUsernameValid ? (
                      <CheckIcon className="text-green-500" />
                    ) : (
                      <XIcon className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div
                  className={`text-xs ${
                    isUsernameLengthValid
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  Between 3 and 16 characters
                </div>
                {username.length > 0 && !isUsernameClean && (
                  <div className="text-xs text-red-500">
                    Username contains inappropriate words
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={
                    email && !isEmailValid
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  required
                />
                {email && (
                  <div className="absolute right-3 top-2.5">
                    {isEmailValid ? (
                      <CheckIcon className="text-green-500" />
                    ) : (
                      <XIcon className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {email && !isEmailValid && (
                <div className="text-xs text-red-500">
                  Please enter a valid email address
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={
                  password && !isPasswordSecure
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
                required
              />
              <div className="space-y-1 mt-1">
                <div
                  className={`text-xs flex items-center gap-1.5 ${
                    isPasswordLengthValid
                      ? "text-green-600"
                      : "text-muted-foreground"
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
                    isPasswordNotCommon
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {isPasswordNotCommon ? (
                    <CheckIcon />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-current" />
                  )}
                  Not your username or common passwords
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={loading || !canSubmit}
            >
              {loading ? "Creating account..." : "Sign Up"}{" "}
              <ArrowRightIcon className="ml-2" />
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="underline font-medium text-foreground hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
