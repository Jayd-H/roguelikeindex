"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ListCarouselProps {
  children: React.ReactNode;
  onEndReached?: () => void;
  visibleCards?: number;
}

export function ListCarousel({
  children,
  onEndReached,
  visibleCards = 3,
}: ListCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const CARD_WIDTH = 320;
  const GAP = 48;
  const SCROLL_ITEM_WIDTH = CARD_WIDTH + GAP;

  const CONTENT_WIDTH = CARD_WIDTH * visibleCards + GAP * (visibleCards - 1);

  const HOVER_BUFFER = 120;

  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

    setCanScrollLeft(scrollLeft > 20);

    const remainingScroll = scrollWidth - clientWidth - Math.ceil(scrollLeft);
    setCanScrollRight(remainingScroll > SCROLL_ITEM_WIDTH / 2);
  }, [SCROLL_ITEM_WIDTH]);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      if (!scrollRef.current) return;

      const currentScroll = scrollRef.current.scrollLeft;
      const targetScroll =
        direction === "left"
          ? currentScroll - SCROLL_ITEM_WIDTH
          : currentScroll + SCROLL_ITEM_WIDTH;

      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    },
    [SCROLL_ITEM_WIDTH]
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollButtons();
      if (!onEndReached) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;

      if (scrollLeft + clientWidth >= scrollWidth - SCROLL_ITEM_WIDTH * 1.5) {
        onEndReached();
      }
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateScrollButtons);

    updateScrollButtons();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, onEndReached, SCROLL_ITEM_WIDTH]);

  return (
    <div
      className="relative mx-auto"
      style={{ maxWidth: `${CONTENT_WIDTH}px` }}
    >
      {canScrollLeft && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute -left-6 top-1/2 -translate-y-1/2 z-50 rounded-full h-14 w-14 shadow-2xl bg-background/80 backdrop-blur-md border border-border/50 hover:scale-110 hover:bg-background transition-all cursor-pointer"
          onClick={() => scroll("left")}
        >
          <CaretLeft size={28} weight="bold" />
        </Button>
      )}

      <div
        className="py-32 -my-16 relative"
        style={{
          marginLeft: `-${HOVER_BUFFER}px`,
          marginRight: `-${HOVER_BUFFER}px`,
          maskImage: `linear-gradient(to right, transparent, black ${HOVER_BUFFER}px, black calc(100% - ${HOVER_BUFFER}px), transparent)`,
          WebkitMaskImage: `linear-gradient(to right, transparent, black ${HOVER_BUFFER}px, black calc(100% - ${HOVER_BUFFER}px), transparent)`,
        }}
      >
        <div
          ref={scrollRef}
          className="flex gap-12 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
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
          className="absolute -right-6 top-1/2 -translate-y-1/2 z-50 rounded-full h-14 w-14 shadow-2xl bg-background/80 backdrop-blur-md border border-border/50 hover:scale-110 hover:bg-background transition-all cursor-pointer"
          onClick={() => scroll("right")}
        >
          <CaretRight size={28} weight="bold" />
        </Button>
      )}
    </div>
  );
}
