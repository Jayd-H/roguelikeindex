"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { XIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
        router.refresh();
        onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-4 animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
        <div className="bg-background border border-border/50 shadow-2xl rounded-xl overflow-hidden relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={onClose}
          >
            <XIcon size={20} />
          </Button>

          <div className="p-8 sm:p-10">
            <div className="space-y-2 mb-8">
              <h2 className="text-3xl font-black tracking-tighter">
                Welcome back
              </h2>
              <p className="text-muted-foreground">
                Enter your email below to login to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="modal-email">Email</Label>
                <Input
                  id="modal-email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  autoFocus
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="modal-password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={onClose}
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="modal-password"
                  name="password"
                  type="password"
                  required
                  className="h-11"
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold cursor-pointer"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}{" "}
                <ArrowRightIcon className="ml-2" />
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="underline font-medium text-foreground hover:text-primary transition-colors"
                onClick={onClose}
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
