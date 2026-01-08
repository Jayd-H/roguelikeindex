"use client";

import { useRef, useEffect } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ListCarouselProps {
  children: React.ReactNode;
  onEndReached?: () => void;
}

export function ListCarousel({ children, onEndReached }: ListCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      // 320px (card) + 24px (gap) = 344px
      const scrollAmount = 344;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !onEndReached) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      if (scrollLeft + clientWidth >= scrollWidth - 500) {
        onEndReached();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onEndReached]);

  return (
    <div className="relative group/carousel w-full">
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 pointer-events-auto">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-12 w-12 shadow-2xl bg-background/90 backdrop-blur-md border border-border/50 hover:scale-110 transition-transform cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            scroll("left");
          }}
        >
          <CaretLeft size={24} />
        </Button>
      </div>

      {/* Increased padding-y to 32 (8rem) to prevent clipping of fan effect */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto py-32 px-12 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      >
        {children}
      </div>

      <div className="absolute -right-6 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 pointer-events-auto">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-12 w-12 shadow-2xl bg-background/90 backdrop-blur-md border border-border/50 hover:scale-110 transition-transform cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            scroll("right");
          }}
        >
          <CaretRight size={24} />
        </Button>
      </div>
    </div>
  );
}
