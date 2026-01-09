"use client";

import { XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center duration-200 cursor-pointer bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-4 duration-300 cursor-default animate-in zoom-in-95 slide-in-from-bottom-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 space-y-6 overflow-hidden border shadow-2xl bg-background border-border/50 rounded-xl">
          <Button
            variant="ghost"
            size="icon"
            className="absolute cursor-pointer right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <XIcon size={20} />
          </Button>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="cursor-pointer"
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="cursor-pointer"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
