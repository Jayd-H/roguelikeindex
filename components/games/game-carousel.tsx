"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface GameCarouselProps {
  children: React.ReactNode;
}

export function GameCarousel({ children }: GameCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Adjusted for new MiniGameCard width (w-44 = 176px) + Gap (16px) = 192px
  const ITEM_WIDTH = 176;
  const GAP = 16;
  const SCROLL_AMOUNT = (ITEM_WIDTH + GAP) * 2;
  const HOVER_BUFFER = 40;

  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

    // Check if content overflows
    if (scrollWidth <= clientWidth) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
  }, []);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      if (!scrollRef.current) return;
      const currentScroll = scrollRef.current.scrollLeft;
      const targetScroll =
        direction === "left"
          ? currentScroll - SCROLL_AMOUNT
          : currentScroll + SCROLL_AMOUNT;

      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    },
    [SCROLL_AMOUNT]
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => updateScrollButtons();
    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateScrollButtons);

    // Initial check with delay to allow layout to settle
    const timeout = setTimeout(updateScrollButtons, 200);

    return () => {
      clearTimeout(timeout);
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons]);

  return (
    <div className="relative group">
      {canScrollLeft && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 rounded-full h-8 w-8 shadow-xl bg-background/80 backdrop-blur-md border border-border/50 hover:scale-110 hover:bg-background transition-all cursor-pointer"
          onClick={() => scroll("left")}
        >
          <CaretLeft size={16} weight="bold" />
        </Button>
      )}

      <div
        className="relative"
        style={{
          marginLeft: `-${HOVER_BUFFER}px`,
          marginRight: `-${HOVER_BUFFER}px`,
          maskImage: `linear-gradient(to right, transparent, black ${HOVER_BUFFER}px, black calc(100% - ${HOVER_BUFFER}px), transparent)`,
          WebkitMaskImage: `linear-gradient(to right, transparent, black ${HOVER_BUFFER}px, black calc(100% - ${HOVER_BUFFER}px), transparent)`,
        }}
      >
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] py-4"
          style={{
            paddingLeft: `${HOVER_BUFFER}px`,
            paddingRight: `${HOVER_BUFFER}px`,
          }}
        >
          {children}
        </div>
      </div>

      {canScrollRight && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 rounded-full h-8 w-8 shadow-xl bg-background/80 backdrop-blur-md border border-border/50 hover:scale-110 hover:bg-background transition-all cursor-pointer"
          onClick={() => scroll("right")}
        >
          <CaretRight size={16} weight="bold" />
        </Button>
      )}
    </div>
  );
}
