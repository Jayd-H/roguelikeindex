"use client";

import { useState, useEffect } from "react";
import { TagIcon } from "@phosphor-icons/react";

interface TagCyclerProps {
  tags: string[];
}

export function TagCycler({ tags }: TagCyclerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!tags || tags.length === 0) return;
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % tags.length),
      3000
    );
    return () => clearInterval(timer);
  }, [tags]);

  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground">
      <TagIcon size={14} weight="fill" className="shrink-0" />
      <span
        key={index}
        className="text-right truncate duration-500 max-w-25 animate-in fade-in slide-in-from-bottom-1"
      >
        {tags[index]}
      </span>
    </div>
  );
}
