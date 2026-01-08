import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-8 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black tracking-tighter sm:text-7xl">RoguelikeIndex</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">The centralized database for roguelike and roguelite games.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button asChild size="lg" className="flex-1 font-semibold text-base">
          <Link href="/games">Browse Games</Link>
        </Button>
        <div className="flex gap-4 flex-1">
          <Button asChild variant="secondary" size="lg" className="flex-1 font-semibold">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1 font-semibold">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}