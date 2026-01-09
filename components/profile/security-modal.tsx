"use client";

import { useState } from "react";
import { XIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "email" | "password" | "delete";
  onSuccess: () => void;
}

export function SecurityModal({
  isOpen,
  onClose,
  type,
  onSuccess,
}: SecurityModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let res;
      if (type === "delete") {
        res = await fetch("/api/auth/delete", {
          method: "POST",
          body: JSON.stringify({ password: currentPassword }),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        const body =
          type === "email"
            ? { email: newValue, currentPassword }
            : { newPassword: newValue, currentPassword };

        res = await fetch("/api/auth/update", {
          method: "PATCH",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Operation failed");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    email: "Change Email Address",
    password: "Change Password",
    delete: "Delete Account",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center duration-200 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 overflow-hidden duration-300 border shadow-2xl bg-background border-border/50 rounded-xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-xl font-bold ${
              type === "delete" ? "text-destructive" : ""
            }`}
          >
            {titles[type]}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8"
          >
            <XIcon size={16} />
          </Button>
        </div>

        {type === "delete" && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-destructive/10 text-destructive">
            <WarningCircleIcon size={32} />
            <p className="text-sm font-medium">
              This action is permanent. All your data will be wiped.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {type !== "delete" && (
            <div className="space-y-2">
              <Label>
                {type === "email" ? "New Email Address" : "New Password"}
              </Label>
              <Input
                type={type === "password" ? "password" : "email"}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Confirm your identity"
            />
          </div>

          {error && (
            <div className="p-2 text-sm font-medium text-red-500 rounded bg-red-500/10">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={type === "delete" ? "destructive" : "default"}
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
