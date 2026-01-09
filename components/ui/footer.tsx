import { GithubLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 mt-20 border-t border-border/40 bg-secondary/5">
      <div className="flex flex-col items-center justify-between gap-6 px-6 mx-auto max-w-7xl md:flex-row">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold">RoguelikeIndex</span>
          <p className="max-w-xs text-sm text-muted-foreground">
            The definitive structured database for roguelike and roguelite
            enthusiasts.
          </p>
        </div>

        <div className="flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/about">
            <a className="transition-colors hover:text-primary">About</a>
          </Link>
          <Link href="/apidocs">
            <a href="#" className="transition-colors hover:text-primary">
              API
            </a>
          </Link>
          <a href="#" className="transition-colors hover:text-primary">
            Privacy
          </a>
        </div>

        <div className="flex gap-4">
          <a
            href="https://github.com/Jayd-H/roguelikeindex"
            className="transition-colors text-muted-foreground hover:text-foreground"
          >
            <GithubLogoIcon size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
}
