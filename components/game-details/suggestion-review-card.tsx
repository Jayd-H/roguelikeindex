"use client";

import { useState } from "react";
import { ThumbsUpIcon, ThumbsDownIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Suggestion {
  id: string;
  targetField: string;
  operation: string;
  originalValue: unknown;
  suggestedValue: unknown;
  voteCount: number;
  suggester: string;
  createdAt: string;
}

interface TagValue {
  name: string;
}

interface StoreValue {
  store: string;
  price: string;
  url: string;
  platform: string;
}

interface RatingValue {
  source: string;
  score: string;
}

export function SuggestionReviewCard({
  suggestion,
  hasVoted,
  onVote,
}: {
  suggestion: Suggestion;
  hasVoted: boolean;
  onVote: (id: string, val: number) => void;
}) {
  const [voting, setVoting] = useState(false);

  const handleVote = async (val: number) => {
    setVoting(true);
    await onVote(suggestion.id, val);
    setVoting(false);
  };

  const renderDiff = () => {
    const { targetField, operation, originalValue, suggestedValue } =
      suggestion;

    if (
      targetField === "metaProgression" ||
      targetField === "steamDeckVerified"
    ) {
      return (
        <div className="text-sm">
          Change <strong>{targetField}</strong> from{" "}
          <Badge variant="secondary">{String(originalValue)}</Badge> to{" "}
          <Badge variant="default">{String(suggestedValue)}</Badge>
        </div>
      );
    }

    if (targetField === "tags") {
      const val = suggestedValue as TagValue;
      return (
        <div className="text-sm">
          {operation === "add" ? "Add Tag" : "Remove Tag"}:{" "}
          <Badge variant="outline">{val.name}</Badge>
        </div>
      );
    }

    if (targetField === "pricing") {
      const val = suggestedValue as StoreValue;
      if (operation === "remove")
        return (
          <div className="text-sm text-red-400">
            Remove store: {val.store} ({val.platform})
          </div>
        );
      return (
        <div className="space-y-1 text-sm">
          <div>
            <strong>{operation === "add" ? "New Store" : "Edit Store"}</strong>
          </div>
          <div className="grid grid-cols-2 gap-2 p-2 text-xs rounded text-muted-foreground bg-secondary/20">
            <span>Store: {val.store}</span>
            <span>Price: {val.price}</span>
            <span className="col-span-2 truncate">URL: {val.url}</span>
          </div>
        </div>
      );
    }

    if (targetField === "externalRatings") {
      const val = suggestedValue as RatingValue;
      if (operation === "remove")
        return (
          <div className="text-sm text-red-400">
            Remove review: {val.source}
          </div>
        );
      return (
        <div className="space-y-1 text-sm">
          <div>
            <strong>
              {operation === "add" ? "New Review" : "Edit Review"}
            </strong>
          </div>
          <div className="grid grid-cols-2 gap-2 p-2 text-xs rounded text-muted-foreground bg-secondary/20">
            <span>Source: {val.source}</span>
            <span>Score: {val.score}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg cursor-default border-border/50 bg-card/50">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Proposed by{" "}
            <span className="font-bold text-primary">
              {suggestion.suggester}
            </span>
          </span>
          {renderDiff()}
        </div>
        <div className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded bg-secondary/30">
          Votes: {suggestion.voteCount}
        </div>
      </div>

      {!hasVoted && (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 gap-2 text-green-500 cursor-pointer hover:text-green-600 hover:bg-green-500/10"
            onClick={() => handleVote(1)}
            disabled={voting}
          >
            <ThumbsUpIcon /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 gap-2 text-red-500 cursor-pointer hover:text-red-600 hover:bg-red-500/10"
            onClick={() => handleVote(-1)}
            disabled={voting}
          >
            <ThumbsDownIcon /> Reject
          </Button>
        </div>
      )}
      {hasVoted && (
        <div className="mt-1 text-xs text-center text-muted-foreground">
          You voted
        </div>
      )}
    </div>
  );
}
