import { GithubLogo, TwitterLogo, DiscordLogo } from "@phosphor-icons/react/dist/ssr";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-secondary/5 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2">
          <span className="font-bold text-lg">RoguelikeIndex</span>
          <p className="text-sm text-muted-foreground max-w-xs">
            The definitive structured database for roguelike and roguelite enthusiasts.
          </p>
        </div>
        
        <div className="flex gap-6 text-sm text-muted-foreground font-medium">
          <a href="#" className="hover:text-primary transition-colors">About</a>
          <a href="#" className="hover:text-primary transition-colors">API</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Contact</a>
        </div>

        <div className="flex gap-4">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <GithubLogo size={24} />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <TwitterLogo size={24} />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <DiscordLogo size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
}